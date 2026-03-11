import { Topic, ITopic } from '../models/Topic'
import { Types } from 'mongoose'

export async function createTopic(data: {
  userId: string
  title: string
  sourceLang: string
  targetLang: string
}): Promise<ITopic> {
  return Topic.create({ ...data, userId: new Types.ObjectId(data.userId) })
}

export async function listTopics(userId: string): Promise<ITopic[]> {
  return Topic.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 })
}

export async function deleteTopic(topicId: string, userId: string): Promise<boolean> {
  const result = await Topic.deleteOne({
    _id: new Types.ObjectId(topicId),
    userId: new Types.ObjectId(userId),
  })
  return result.deletedCount === 1
}
