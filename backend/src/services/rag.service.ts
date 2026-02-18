import crypto from 'crypto';
import Groq from 'groq-sdk';
import { generateSingleEmbedding } from './embedding.service';
import { queryVectors } from './pinecone.service';
import { ChunkModel } from '../models/Chunk.model';
import { RepoModel } from '../models/Repo.model';
import { CacheModel } from '../models/Cache.model';
import { AppError } from '../api/middleware/errorHandler';
import { config } from '../config/index';
import { logger } from '../utils/logger';

const groq = new Groq({ apiKey: config.groqApiKey });
const CACHE_TTL_HOURS = 24;
const PROMPT_VERSION = 'v1'; // bump this to invalidate all caches when prompts change

const buildCacheKey = (
  repoUrl: string,
  feature: string,
  target: string,
  topK: number
): string =>
  crypto
    .createHash('sha256')
    .update(`${repoUrl}:${feature}:${target}:${topK}:${PROMPT_VERSION}`)
    .digest('hex');

const callLLM = async (prompt: string): Promise<string> => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  });
  return response.choices[0]?.message?.content?.trim() || '';
};

export const ragQuery = async ({
  repoUrl,
  feature,
  query,
  promptBuilder,
  target = '',
  topK = 8,
  filePath,
}: {
  repoUrl: string;
  feature: string;
  query: string;
  promptBuilder: (chunks: string[]) => string;
  target?: string;
  topK?: number;
  filePath?: string;
}): Promise<string> => {

  // Guard: ensure repo is ingested before proceeding
  const repoDoc = await RepoModel.findOne({ repoUrl });
  if (!repoDoc || repoDoc.status !== 'ingested') {
    throw new AppError(
      'Repository not ingested. Call POST /api/v1/repo/ingest first.',
      400
    );
  }

  const cacheKey = buildCacheKey(repoUrl, feature, target, topK);

  const cached = await CacheModel.findOne({ cacheKey });
  if (cached) {
    logger.info(`Cache hit for ${feature} on ${repoUrl}`);
    return cached.response;
  }

  logger.info(`Generating query embedding for feature: ${feature}`);
  const queryEmbedding = await generateSingleEmbedding(query);

  logger.info(`Querying Pinecone — topK=${topK}`);
  const vectorResults = await queryVectors(queryEmbedding, repoUrl, topK, filePath);

  if (vectorResults.length === 0) {
    throw new AppError(
      'No relevant chunks found in vector store. The repo may need to be re-ingested.',
      404
    );
  }

  // Fetch chunk texts from MongoDB using pineconeIds
  const pineconeIds = vectorResults.map((r) => r.pineconeId);
  const chunkDocs = await ChunkModel.find({ pineconeId: { $in: pineconeIds } });

  if (chunkDocs.length === 0) {
    throw new AppError(
      'Chunk text not found in database. Re-ingest the repository.',
      404
    );
  }

  // Preserve Pinecone relevance ordering
  const chunkMap = new Map(chunkDocs.map((c) => [c.pineconeId, c]));
  const chunkTexts = vectorResults
    .map((r) => {
      const doc = chunkMap.get(r.pineconeId);
      if (!doc) return null;
      return `--- File: ${doc.filePath} (chunk ${doc.chunkIndex}, score: ${r.score.toFixed(3)}) ---\n${doc.text}`;
    })
    .filter(Boolean) as string[];

  const prompt = promptBuilder(chunkTexts);
  logger.info(`Calling LLM for feature: ${feature}`);
  const response = await callLLM(prompt);

  const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000);
  await CacheModel.findOneAndUpdate(
    { cacheKey },
    { cacheKey, feature, repoUrl, target, response, expiresAt },
    { upsert: true }
  );

  return response;
};