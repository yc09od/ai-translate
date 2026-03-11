import { Topic, ITopic } from '../models/Topic'
import { Types } from 'mongoose'

export async function createTopic(data: {
  userId: string
  title: string
  sourceLang: string
  targetLang: string
}): Promise<ITopic> {
  const uid = new Types.ObjectId(data.userId)
  const minDoc = await Topic.findOne({ userId: uid }).sort({ order: 1 }).select('order')
  const order = minDoc ? minDoc.order - 1 : 0
  return Topic.create({ ...data, userId: uid, order })
}

export async function listTopics(userId: string): Promise<ITopic[]> {
  return Topic.find({ userId: new Types.ObjectId(userId) }).sort({ order: 1 })
}

export async function updateTopicTitle(topicId: string, userId: string, title: string): Promise<ITopic | null> {
  return Topic.findOneAndUpdate(
    { _id: new Types.ObjectId(topicId), userId: new Types.ObjectId(userId) },
    { title },
    { new: true }
  )
}

export async function reorderTopics(userId: string, items: { id: string; order: number }[]): Promise<void> {
  const uid = new Types.ObjectId(userId)
  await Promise.all(
    items.map(({ id, order }) =>
      Topic.updateOne({ _id: new Types.ObjectId(id), userId: uid }, { order })
    )
  )
}

export async function deleteTopic(topicId: string, userId: string): Promise<boolean> {
  const result = await Topic.deleteOne({
    _id: new Types.ObjectId(topicId),
    userId: new Types.ObjectId(userId),
  })
  return result.deletedCount === 1
}
