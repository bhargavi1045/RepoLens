import mongoose, { Schema, Document } from 'mongoose';

export interface ICache extends Document {
  cacheKey: string;
  feature: string;
  repoUrl: string;
  target: string;
  response: string;
  createdAt: Date;
  expiresAt: Date;
}

const ONE_DAY = 24 * 60 * 60 * 1000;
const CacheSchema = new Schema<ICache>({
  cacheKey: { type: String, required: true, unique: true },
  feature: { type: String, required: true },
  repoUrl: { type: String, required: true },
  target: { type: String, default: '' },
  response: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
 expiresAt: { type: Date, default: () => new Date(Date.now() + ONE_DAY) },
});

CacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CacheModel = mongoose.model<ICache>('Cache', CacheSchema);
