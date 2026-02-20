import Groq from 'groq-sdk';
import { generateSingleEmbedding } from './embedding.service';
import { queryVectors } from './pinecone.service';
import { ChunkModel } from '../models/Chunk.model';
import { RepoModel } from '../models/Repo.model';
import { AppError } from '../api/middleware/errorHandler';
import { config } from '../config/index';
import { logger } from '../utils/logger';
import { generateCacheKey, getCache, setCache } from '../utils/cache';

const groq = new Groq({ apiKey: config.groqApiKey });

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

 
  const repoDoc = await RepoModel.findOne({ repoUrl });
  if (!repoDoc || repoDoc.status !== 'ingested') {
    throw new AppError(
      'Repository not ingested. Call POST /api/v1/repo/ingest first.',
      400
    );
  }

  // Skip caching for ask_repo feature
  let useCache = feature !== 'ask_repo';
  let cacheKey, cached;
  if (useCache) {
    cacheKey = generateCacheKey(feature, repoUrl, target);
    cached = await getCache(cacheKey);
    if (cached) {
      logger.info(`Cache hit for ${feature} on ${repoUrl}`);
      return cached;
    }
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

  
  const pineconeIds = vectorResults.map((r) => r.pineconeId);
  const chunkDocs = await ChunkModel.find({ pineconeId: { $in: pineconeIds } });

  if (chunkDocs.length === 0) {
    throw new AppError(
      'Chunk text not found in database. Re-ingest the repository.',
      404
    );
  }

  
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

  if (useCache) {
    await setCache(cacheKey, feature, repoUrl, target, response);
  }

  return response;
};