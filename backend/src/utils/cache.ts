import crypto from 'crypto';
import { CacheModel } from '../models/Cache.model';

const PROMPT_VERSION = 'v1'; 
const DEFAULT_TTL_HOURS = 24;

export const generateCacheKey = (
  feature: string,
  repoUrl: string,
  target: string = ''
): string =>
  crypto
    .createHash('sha256')
    .update(`${feature}:${repoUrl}:${target}:${PROMPT_VERSION}`)
    .digest('hex');

export const getCache = async (cacheKey: string): Promise<string | null> => {
  const cache = await CacheModel.findOne({ cacheKey });
  if (!cache) return null;

  if (cache.expiresAt < new Date()) {
    await CacheModel.deleteOne({ cacheKey });
    return null;
  }

  return cache.response;
};

export const setCache = async (
  cacheKey: string,
  feature: string,
  repoUrl: string,
  target: string,
  response: string,
  ttlHours: number = DEFAULT_TTL_HOURS
): Promise<void> => {
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  await CacheModel.findOneAndUpdate(
    { cacheKey },
    { cacheKey, feature, repoUrl, target, response, expiresAt },
    { upsert: true }
  );
};