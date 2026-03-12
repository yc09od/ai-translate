import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { translateWithGemini, translateWithKimi } from '../services/aiService'
import { localOnly } from '../hooks/localOnly'

export async function devTestRoutes(fastify: FastifyInstance) {
  // All /dev/* routes are localhost-only
  fastify.addHook('onRequest', localOnly)

  // POST /dev/test/translate — 测试 AI 翻译（仅 dev 环境）
  fastify.post(
    '/dev/test/translate',
    {
      schema: {
        tags: ['Dev'],
        summary: '测试 AI 翻译（仅 dev 环境）',
        description: '直接将一段文本发给指定 AI API 进行翻译，用于调试 AI 集成。',
        body: {
          type: 'object',
          required: ['text', 'brand'],
          properties: {
            text: { type: 'string', description: '需要翻译的文本' },
            brand: {
              type: 'string',
              enum: ['gemini', 'kimi'],
              description: '使用的 AI 提供商',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              original: { type: 'string' },
              translated: { type: 'string' },
              brand: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          500: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { text, brand } = request.body as { text: string; brand: 'gemini' | 'kimi' }

      if (!text?.trim()) {
        return reply.status(400).send({ error: 'text is required' })
      }

      try {
        const result =
          brand === 'kimi' ? await translateWithKimi(text) : await translateWithGemini(text)
        return reply.send({ ...result, brand })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        fastify.log.error(`[devTest] translate error: ${message}`)
        return reply.status(500).send({ error: message })
      }
    }
  )
}
