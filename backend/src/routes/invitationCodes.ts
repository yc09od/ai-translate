import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { InvitationCode } from '../models/InvitationCode'
import { requireRole } from '../hooks/requireRole'

export async function invitationCodeRoutes(fastify: FastifyInstance) {
  // POST /invitation-codes — create a new invitation code
  fastify.post(
    '/invitation-codes',
    {
      schema: {
        tags: ['InvitationCodes'],
        summary: '创建邀请码',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              code: { type: 'string' },
              used: { type: 'boolean' },
            },
          },
        },
      },
      onRequest: [(fastify as any).authenticate, requireRole('agent', 'admin')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code } = request.body as { code: string }
      const existing = await InvitationCode.findOne({ code })
      if (existing) {
        return reply.status(409).send({ error: 'Code already exists' })
      }
      const invitation = await InvitationCode.create({ code })
      return reply.status(201).send(invitation)
    },
  )

  // GET /invitation-codes — list all invitation codes
  fastify.get(
    '/invitation-codes',
    {
      schema: {
        tags: ['InvitationCodes'],
        summary: '查询邀请码列表',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                code: { type: 'string' },
                used: { type: 'boolean' },
              },
            },
          },
        },
      },
      onRequest: [(fastify as any).authenticate, requireRole('agent', 'admin')],
    },
    async () => {
      return InvitationCode.find().sort({ _id: -1 })
    },
  )
}
