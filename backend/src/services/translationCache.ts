import { redis } from '../db/redis'

const TRANSLATION_CACHE_TTL = parseInt(process.env.TRANSLATION_CACHE_TTL ?? '600', 10)

export interface CachedTranslationRecord {
  id: string
  topicId: string
  userId: string
  originalText: string
  translatedText: string
  timestamp: string
}

function key(topicId: string) {
  return `translations:${topicId}`
}

export async function setTranslationCache(
  topicId: string,
  records: CachedTranslationRecord[]
): Promise<void> {
  await redis.set(key(topicId), JSON.stringify(records), 'EX', TRANSLATION_CACHE_TTL)
}

export async function getTranslationCache(
  topicId: string
): Promise<CachedTranslationRecord[] | null> {
  const raw = await redis.get(key(topicId))
  if (!raw) return null
  return JSON.parse(raw) as CachedTranslationRecord[]
}

export async function deleteTranslationCache(topicId: string): Promise<void> {
  await redis.del(key(topicId))
}
