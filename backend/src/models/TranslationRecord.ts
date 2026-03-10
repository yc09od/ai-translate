import { Schema, model, Document, Types } from 'mongoose'

export interface ITranslationRecord extends Document {
  topicId: Types.ObjectId
  userId: Types.ObjectId
  originalText: string
  translatedText: string
  timestamp: Date
}

const TranslationRecordSchema = new Schema<ITranslationRecord>({
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  originalText: { type: String, required: true },
  translatedText: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
})

export const TranslationRecord = model<ITranslationRecord>('TranslationRecord', TranslationRecordSchema)
