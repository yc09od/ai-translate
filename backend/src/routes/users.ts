import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { findById, updateUserName } from '../services/userService'

export async function userRoutes(fastify: FastifyInstance) {
  // GET /users/me — 获取当前用户信息
  fastify.get(
    '/users/me',
    {
      schema: {
        tags: ['Users'],
        summary: '获取当前用户信息',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              provider: { type: 'string' },
              role: { type: 'string' },
            },
          },
        },
      },
      onRequest: [(fastify as any).authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user as { userId: string }
      const user = await findById(userId)
      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }
      return {
        id: (user._id as { toString(): string }).toString(),
        email: user.email,
        name: user.name,
        provider: user.provider,
        role: user.role,
      }
    },
  )

  // PATCH /users/me — 更新当前用户名
  fastify.patch(
    '/users/me',
    {
      schema: {
        tags: ['Users'],
        summary: '更新用户名',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              provider: { type: 'string' },
            },
          },
        },
      },
      onRequest: [(fastify as any).authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user as { userId: string }
      const { name } = request.body as { name: string }
      const user = await updateUserName(userId, name)
      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }
      return {
        id: (user._id as { toString(): string }).toString(),
        email: user.email,
        name: user.name,
        provider: user.provider,
      }
    },
  )
}
