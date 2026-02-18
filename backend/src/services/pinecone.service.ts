import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '../config/index';
import { logger } from '../utils/logger';
import { EMBEDDING_DIMENSION } from './embedding.service';

const pinecone = new Pinecone({ apiKey: config.pineconeApiKey });
const getIndex = () => pinecone.index(config.pineconeIndex);

export interface PineconeRecord {
  id: string;
  values: number[];
  metadata: {
    repoUrl: string;
    filePath: string;
    chunkIndex: number;
    // text is NOT stored here — fetched from MongoDB instead
  };
}

export interface QueryResult {
  pineconeId: string;
  filePath: string;
  chunkIndex: number;
  score: number;
}

export const upsertVectors = async (records: PineconeRecord[]): Promise<void> => {
  const index = getIndex();
  const BATCH_SIZE = 100;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await index.upsert(batch as any);
    logger.info(`Upserted Pinecone batch ${Math.floor(i / BATCH_SIZE) + 1}`);
  }
};

export const queryVectors = async (
  queryEmbedding: number[],
  repoUrl: string,
  topK: number = 8,
  filePath?: string
): Promise<QueryResult[]> => {
  const index = getIndex();

  const filter: Record<string, any> = { repoUrl };
  if (filePath) filter.filePath = filePath;

  const response = await index.query({
    vector: queryEmbedding,
    topK,
    filter,
    includeMetadata: true,
  });

  if (!response.matches || response.matches.length === 0) {
    logger.warn(`Pinecone returned 0 matches for repoUrl=${repoUrl} filePath=${filePath}`);
    return [];
  }

  return response.matches.map((match) => ({
    pineconeId: match.id,
    filePath: match.metadata?.filePath as string,
    chunkIndex: match.metadata?.chunkIndex as number,
    score: match.score || 0,
  }));
};

export const deleteRepoVectors = async (
  repoUrl: string,
  pineconeIds: string[]
): Promise<void> => {
  if (pineconeIds.length === 0) {
    logger.info(`No Pinecone vectors to delete for ${repoUrl}`);
    return;
  }

  const index = getIndex();
  const BATCH_SIZE = 100;

  for (let i = 0; i < pineconeIds.length; i += BATCH_SIZE) {
    const batch = pineconeIds.slice(i, i + BATCH_SIZE);
    await index.deleteMany(batch);
  }

  logger.info(`Deleted ${pineconeIds.length} vectors for ${repoUrl}`);
};