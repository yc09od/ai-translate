import { FastifyInstance } from 'fastify'

export async function systemRoutes(fastify: FastifyInstance) {
  fastify.get('/health', {
    schema: {
      tags: ['System'],
      summary: 'Health check',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return { status: 'ok', message: 'Backend is running' }
  })
}
