import { FastifyInstance } from 'fastify'

export async function systemRoutes(fastify: FastifyInstance) {
  fastify.get('/', { schema: { hide: true } }, async (_request, reply) => {
    return reply.redirect('/docs')
  })

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
