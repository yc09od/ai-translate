import { Schema, model, Document, Types } from 'mongoose'

export interface ITopic extends Document {
  userId: Types.ObjectId
  title: string
  sourceLang: string
  targetLang: string
  createdAt: Date
}

const TopicSchema = new Schema<ITopic>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    sourceLang: { type: String, required: true },
    targetLang: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const Topic = model<ITopic>('Topic', TopicSchema)
