import { TranslationRecord, ITranslationRecord } from '../models/TranslationRecord'
import { Types } from 'mongoose'
import {
  getTranslationCache,
  setTranslationCache,
  deleteTranslationCache,
  CachedTranslationRecord,
} from './translationCache'

export async function saveTranslation(data: {
  topicId: string
  userId: string
  originalText: string
  translatedText: string
}): Promise<ITranslationRecord> {
  const record = await TranslationRecord.create({
    topicId: new Types.ObjectId(data.topicId),
    userId: new Types.ObjectId(data.userId),
    originalText: data.originalText,
    translatedText: data.translatedText,
  })
  await deleteTranslationCache(data.topicId)
  return record
}

export interface PaginatedTranslations {
  records: CachedTranslationRecord[]
  total: number
}

// [127] Cursor-based pagination: `before` is an ISO timestamp; returns records older than that point.
export async function getTranslationsByTopicId(
  topicId: string,
  limit: number,
  before?: string
): Promise<PaginatedTranslations> {
  // Only cache the initial load (no before cursor)
  if (!before) {
    const cached = await getTranslationCache(topicId)
    if (cached) {
      return { records: cached.records.slice(0, limit), total: cached.total }
    }
  }

  const query: Record<string, unknown> = { topicId: new Types.ObjectId(topicId) }
  if (before) {
    query.timestamp = { $lt: new Date(before) }
  }

  const [docs, total] = await Promise.all([
    TranslationRecord.find(query).sort({ timestamp: -1 }).limit(limit),
    TranslationRecord.countDocuments({ topicId: new Types.ObjectId(topicId) }),
  ])

  const records: CachedTranslationRecord[] = docs.map((d) => ({
    id: (d._id as Types.ObjectId).toString(),
    topicId: d.topicId.toString(),
    userId: d.userId.toString(),
    originalText: d.originalText,
    translatedText: d.translatedText,
    timestamp: d.timestamp.toISOString(),
  }))

  if (!before) {
    await setTranslationCache(topicId, { records, total })
  }

  return { records, total }
}
