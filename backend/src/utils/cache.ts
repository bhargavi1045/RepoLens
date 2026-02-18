import { CacheModel, ICache } from '../models/Cache.model';
import crypto from 'crypto';

export const generateCacheKey = (feature: string, repoUrl: string, target: string = ''): string => {
  const hash = crypto.createHash('md5').update(`${feature}-${repoUrl}-${target}`).digest('hex');
  return hash;
};

export const getCache = async (cacheKey: string): Promise<string | null> => {
  const cache = await CacheModel.findOne({ cacheKey });
  if (!cache) return null;

  // Check expiration
  if (cache.expiresAt < new Date()) {
    await CacheModel.deleteOne({ cacheKey });
    return null;
  }

  return cache.response;
};

export const setCache = async (cacheKey: string, feature: string, repoUrl: string, target: string, response: string, ttlSeconds: number = 3600): Promise<void> => {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await CacheModel.findOneAndUpdate(
    { cacheKey },
    { feature, repoUrl, target, response, expiresAt },
    { upsert: true }
  );
};
