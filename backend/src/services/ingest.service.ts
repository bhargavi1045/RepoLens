import { fetchRepoFiles } from './github.service';
import { chunkFile, TextChunk, estimateTokens } from './chunking.service';
import { generateEmbeddings } from './embedding.service';
import { upsertVectors, deleteRepoVectors, PineconeRecord } from './pinecone.service';
import { sanitizeCode } from '../utils/sanitize';
import { parseGithubUrl } from '../utils/parseGithubUrl';
import { RepoModel } from '../models/Repo.model';
import { ChunkModel } from '../models/Chunk.model';
import { AppError } from '../api/middleware/errorHandler';
import { logger } from '../utils/logger';
import { config } from '../config/index';

export const ingestRepo = async (
  repoUrl: string,
  force: boolean = false
): Promise<{ message: string; chunkCount: number }> => {
  const { owner, repo } = parseGithubUrl(repoUrl);

  const existing = await RepoModel.findOne({ repoUrl });

  if (existing?.status === 'ingested' && !force) {
    return { message: 'Repository already ingested. Pass force=true to re-ingest.', chunkCount: 0 };
  }

  if (force && existing) {
    logger.info(`Force re-ingestion for ${owner}/${repo} — cleaning up old data`);
    const existingChunks = await ChunkModel.find({ repoUrl }, { pineconeId: 1 });
    const pineconeIds = existingChunks.map((c) => c.pineconeId);
    await deleteRepoVectors(repoUrl, pineconeIds);
    await ChunkModel.deleteMany({ repoUrl });
    logger.info(`Cleaned up ${pineconeIds.length} old vectors and chunks`);
  }

  await RepoModel.findOneAndUpdate(
    { repoUrl },
    { repoUrl, owner, repo, status: 'pending' },
    { upsert: true, returnDocument: 'after' }
  );

  try {
    const files = await fetchRepoFiles(repoUrl);
    logger.info(`Ingesting ${files.length} files from ${owner}/${repo}`);

    const allChunks: TextChunk[] = [];
    let skippedFiles = 0;

    for (const file of files) {
      if (file.content.length > config.maxFileSizeBytes) {
        logger.warn(`Skipping ${file.path} — exceeds size limit (${file.content.length} bytes)`);
        skippedFiles++;
        continue;
      }

      const sanitized = sanitizeCode(file.content);
      const chunks = chunkFile(sanitized, file.path, repoUrl);
      allChunks.push(...chunks);

      if (allChunks.length >= config.maxChunksPerRepo) {
        logger.warn(`Chunk limit (${config.maxChunksPerRepo}) reached — stopping early`);
        break;
      }
    }

    if (skippedFiles > 0) {
      logger.warn(`Skipped ${skippedFiles} oversized files`);
    }

    logger.info(`Total chunks to embed: ${allChunks.length}`);

    const texts = allChunks.map((c) => c.text);
    const embeddings = await generateEmbeddings(texts);

    logger.info(`Total chunks: ${allChunks.length}`);
    logger.info(`Total embeddings: ${embeddings.length}`);
    logger.info(`Sample embedding length: ${embeddings[0]?.length}`);
    logger.info(`Sample embedding type: ${typeof embeddings[0]?.[0]}`)

    const pineconeRecords: PineconeRecord[] = allChunks.map((chunk, i) => ({
      id: `${owner}-${repo}-${chunk.metadata.filePath}-${chunk.metadata.chunkIndex}`.replace(
        /[^a-zA-Z0-9-_]/g,
        '_'
      ),
      values: embeddings[i],
      metadata: {
        repoUrl,
        filePath: chunk.metadata.filePath,
        chunkIndex: chunk.metadata.chunkIndex,
      },
    }));

    logger.info(`Total records: ${pineconeRecords.length}`);
    logger.info(`Sample record values length: ${pineconeRecords[0]?.values?.length}`);

    await upsertVectors(pineconeRecords);

    const chunkDocs = allChunks.map((chunk, i) => ({
      repoUrl,
      filePath: chunk.metadata.filePath,
      chunkIndex: chunk.metadata.chunkIndex,
      pineconeId: pineconeRecords[i].id,
      tokenCount: estimateTokens(chunk.text),
      text: chunk.text,
      startChar: chunk.metadata.startChar,
      endChar: chunk.metadata.endChar,
    }));

    await ChunkModel.deleteMany({ repoUrl });
    await ChunkModel.insertMany(chunkDocs);

    await RepoModel.findOneAndUpdate(
      { repoUrl },
      { status: 'ingested', fileCount: files.length, ingestedAt: new Date() },
      {returnDocument: 'after'}
    );

    logger.info(`Ingestion complete for ${owner}/${repo} — ${allChunks.length} chunks`);
    return { message: 'Ingestion successful', chunkCount: allChunks.length };
  } catch (error: any) {
    await RepoModel.findOneAndUpdate({ repoUrl }, { status: 'failed' });
    throw new AppError(`Ingestion failed: ${error.message}`, 500);
  }
};