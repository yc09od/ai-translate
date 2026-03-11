import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { createTopic, listTopics, deleteTopic, updateTopicTitle, reorderTopics } from '../services/topicService'

export async function topicRoutes(fastify: FastifyInstance) {
  // POST /topics — 创建话题
  fastify.post(
    '/topics',
    {
      schema: {
        tags: ['Topics'],
        summary: '创建话题',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['title', 'sourceLang', 'targetLang'],
          properties: {
            title: { type: 'string' },
            sourceLang: { type: 'string' },
            targetLang: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              title: { type: 'string' },
              sourceLang: { type: 'string' },
              targetLang: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
      onRequest: [(fastify as any).authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user as { userId: string }
      const { title, sourceLang, targetLang } = request.body as {
        title: string
        sourceLang: string
        targetLang: string
      }
      const topic = await createTopic({ userId, title, sourceLang, targetLang })
      return reply.status(201).send({
        id: (topic._id as any).toString(),
        userId: topic.userId.toString(),
        title: topic.title,
        sourceLang: topic.sourceLang,
        targetLang: topic.targetLang,
        createdAt: topic.createdAt.toISOString(),
      })
    }
  )

  // GET /topics — 列出当前用户的所有话题
  fastify.get(
    '/topics',
    {
      schema: {
        tags: ['Topics'],
        summary: '列出话题',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                title: { type: 'string' },
                sourceLang: { type: 'string' },
                targetLang: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
      onRequest: [(fastify as any).authenticate],
    },
    async (request: FastifyRequest) => {
      const { userId } = request.user as { userId: string }
      const topics = await listTopics(userId)
      return topics.map((t) => ({
        id: (t._id as any).toString(),
        userId: t.userId.toString(),
        title: t.title,
        sourceLang: t.sourceLang,
        targetLang: t.targetLang,
        createdAt: t.createdAt.toISOString(),
      }))
    }
  )

  // PATCH /topics/:topicId — 更新话题标题
  fastify.patch(
    '/topics/:topicId',
    {
      schema: {
        tags: ['Topics'],
        summary: '更新话题标题',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { topicId: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['title'],
          properties: { title: { type: 'string' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
      onRequest: [(fastify as any).authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user as { userId: string }
      const { topicId } = request.params as { topicId: string }
      const { title } = request.body as { title: string }
      const updated = await updateTopicTitle(topicId, userId, title)
      if (!updated) {
        return reply.status(404).send({ error: 'Topic not found' })
      }
      return { id: (updated._id as any).toString(), title: updated.title }
    }
  )

  // PUT /topics/reorder — 批量更新话题排序
  fastify.put(
    '/topics/reorder',
    {
      schema: {
        tags: ['Topics'],
        summary: '批量更新话题排序',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'order'],
            properties: {
              id: { type: 'string' },
              order: { type: 'number' },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: { success: { type: 'boolean' } },
          },
        },
      },
      onRequest: [(fastify as any).authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user as { userId: string }
      const items = request.body as { id: string; order: number }[]
      await reorderTopics(userId, items)
      return reply.send({ success: true })
    }
  )

  // DELETE /topics/:topicId — 删除话题
  fastify.delete(
    '/topics/:topicId',
    {
      schema: {
        tags: ['Topics'],
        summary: '删除话题',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            topicId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: { success: { type: 'boolean' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
      onRequest: [(fastify as any).authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user as { userId: string }
      const { topicId } = request.params as { topicId: string }
      console.log(`########Attempting to delete topic ${topicId} for user ${userId}`)
      const deleted = await deleteTopic(topicId, userId)
      if (!deleted) {
        return reply.status(404).send({ error: 'Topic not found' })
      }
      return { success: true }
    }
  )
}
