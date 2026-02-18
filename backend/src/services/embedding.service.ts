import { CohereClient } from 'cohere-ai';
import { config } from '../config/index';
import { logger } from '../utils/logger';

const cohere = new CohereClient({ token: config.cohereApiKey });

const BATCH_SIZE = 96;

export const EMBEDDING_DIMENSION = config.embeddingDimension; // 1024

export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    logger.info(
      `Embedding batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
        texts.length / BATCH_SIZE
      )}`
    );

    const response = await cohere.embed({
      texts: batch,
      model: 'embed-english-v3.0',
      inputType: 'search_document',
    });

    const embeddings = response.embeddings as number[][];
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
};

export const generateSingleEmbedding = async (text: string): Promise<number[]> => {
  const response = await cohere.embed({
    texts: [text],
    model: 'embed-english-v3.0',
    inputType: 'search_query',
  });

  return (response.embeddings as number[][])[0];
};