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
  page: number
  limit: number
}

export async function getTranslationsByTopicId(
  topicId: string,
  page: number,
  limit: number
): Promise<PaginatedTranslations> {
  // Only cache first page with default limit
  if (page === 1) {
    const cached = await getTranslationCache(topicId)
    if (cached) {
      return { records: cached, total: cached.length, page, limit }
    }
  }

  const skip = (page - 1) * limit
  const [docs, total] = await Promise.all([
    TranslationRecord.find({ topicId: new Types.ObjectId(topicId) })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
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

  if (page === 1) {
    await setTranslationCache(topicId, records)
  }

  return { records, total, page, limit }
}
