import mongoose, { Schema, Document } from 'mongoose';

export interface IChunk extends Document {
  repoUrl: string;
  filePath: string;
  chunkIndex: number;
  pineconeId: string;
  tokenCount: number;
  text: string; // full text stored only here, not in Pinecone
  startChar: number;
  endChar: number;
  createdAt: Date;
}

const ChunkSchema = new Schema<IChunk>({
  repoUrl: { type: String, required: true },
  filePath: { type: String, required: true },
  chunkIndex: { type: Number, required: true },
  pineconeId: { type: String, required: true, unique: true },
  tokenCount: { type: Number },
  text: { type: String, required: true },
  startChar: { type: Number, default: 0 },
  endChar: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

ChunkSchema.index({ repoUrl: 1, filePath: 1 });
ChunkSchema.index({ pineconeId: 1 });

export const ChunkModel = mongoose.model<IChunk>('Chunk', ChunkSchema);