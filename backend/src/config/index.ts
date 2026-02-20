import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  githubToken: process.env.GITHUB_TOKEN || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  mongoUri: process.env.MONGODB_URI || '',
  pineconeApiKey: process.env.PINECONE_API_KEY || '',
  pineconeIndex: process.env.PINECONE_INDEX || 'repolens-chunks',
  cohereApiKey: process.env.COHERE_API_KEY || '',
  embeddingDimension: 1024,          
  maxFilesPerRepo: parseInt(process.env.MAX_FILES || '50'),
  maxChunksPerRepo: parseInt(process.env.MAX_CHUNKS || '2000'),
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE || '500000'), 
};