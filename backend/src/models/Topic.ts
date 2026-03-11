import { Schema, model, Document, Types } from 'mongoose'

export interface ITopic extends Document {
  userId: Types.ObjectId
  title: string
  sourceLang: string
  targetLang: string
  order: number
  createdAt: Date
}

const TopicSchema = new Schema<ITopic>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    sourceLang: { type: String, required: true },
    targetLang: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const Topic = model<ITopic>('Topic', TopicSchema)
