import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '../config/index';
import { logger } from '../utils/logger';

const pinecone = new Pinecone({ apiKey: config.pineconeApiKey });
const getIndex = () => pinecone.index(config.pineconeIndex);

export interface PineconeRecord {
  id: string;
  values: number[];
  metadata: {
    repoUrl: string;
    filePath: string;
    chunkIndex: number;
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

    const formattedBatch = batch.map((r) => ({
      id: r.id,
      values: Array.from(r.values),
      metadata: {
        repoUrl: r.metadata.repoUrl,
        filePath: r.metadata.filePath,
        chunkIndex: r.metadata.chunkIndex,
      },
    }));

    try {
      await index.upsert({ records: formattedBatch });
      logger.info(`Upserted Pinecone batch ${Math.floor(i / BATCH_SIZE) + 1}`);
    } catch (err: any) {
      logger.error(`Failed to upsert Pinecone batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message}`);
      throw err;
    }
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

    try {
      await index.deleteMany({
        ids: batch,
      });

      logger.info(`Deleted ${batch.length} vectors for ${repoUrl} (batch ${Math.floor(i / BATCH_SIZE) + 1})`);
    } catch (err: any) {
      logger.error(`Failed to delete Pinecone batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message}`);
      throw err;
    }
  }
};

