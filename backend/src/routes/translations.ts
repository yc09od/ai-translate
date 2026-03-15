import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { saveTranslation, getTranslationsByTopicId } from '../services/translationService'

export async function translationRoutes(fastify: FastifyInstance) {
  // POST /topics/:topicId/translations — 保存翻译记录
  fastify.post(
    '/topics/:topicId/translations',
    {
      schema: {
        tags: ['Translations'],
        summary: '保存翻译记录',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            topicId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['originalText', 'translatedText'],
          properties: {
            originalText: { type: 'string' },
            translatedText: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              topicId: { type: 'string' },
              userId: { type: 'string' },
              originalText: { type: 'string' },
              translatedText: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
      onRequest: [(fastify as any).authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user as { userId: string }
      const { topicId } = request.params as { topicId: string }
      const { originalText, translatedText } = request.body as {
        originalText: string
        translatedText: string
      }
      const record = await saveTranslation({ topicId, userId, originalText, translatedText })
      return reply.status(201).send({
        id: (record._id as any).toString(),
        topicId: record.topicId.toString(),
        userId: record.userId.toString(),
        originalText: record.originalText,
        translatedText: record.translatedText,
        timestamp: record.timestamp.toISOString(),
      })
    }
  )

  // GET /topics/:topicId/translations — 分页查询翻译历史
  fastify.get(
    '/topics/:topicId/translations',
    {
      schema: {
        tags: ['Translations'],
        summary: '查询翻译历史（分页）',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            topicId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', default: 10 },
            before: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              records: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    topicId: { type: 'string' },
                    userId: { type: 'string' },
                    originalText: { type: 'string' },
                    translatedText: { type: 'string' },
                    timestamp: { type: 'string' },
                  },
                },
              },
              total: { type: 'integer' },
            },
          },
        },
      },
      onRequest: [(fastify as any).authenticate],
    },
    async (request: FastifyRequest) => {
      const { topicId } = request.params as { topicId: string }
      const { limit = 10, before } = request.query as { limit?: number; before?: string }
      return getTranslationsByTopicId(topicId, limit, before)
    }
  )
}
