import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { User } from '../models/User'
import { InvitationCode } from '../models/InvitationCode'
import { requireRole } from '../hooks/requireRole'

const PAGE_SIZE_MAX = 15

export async function adminRoutes(fastify: FastifyInstance) {
  // GET /admin/users — list users with filter, order, pagination
  fastify.get(
    '/admin/users',
    {
      schema: {
        tags: ['Admin'],
        summary: '管理员：查询用户列表',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            filter: { type: 'string' },
            order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            page: { type: 'integer', minimum: 1, default: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: PAGE_SIZE_MAX, default: PAGE_SIZE_MAX },
          },
        },
      },
      onRequest: [(fastify as any).authenticate, requireRole('admin')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { filter, order = 'desc', page = 1, pageSize = PAGE_SIZE_MAX } = request.query as {
        filter?: string
        order?: string
        page?: number
        pageSize?: number
      }
      const pageNum = Math.max(1, page)
      const size = Math.min(PAGE_SIZE_MAX, Math.max(1, pageSize))
      const sortOrder = order === 'asc' ? 1 : -1

      const query: Record<string, unknown> = {}
      if (filter) {
        query.$or = [
          { name: { $regex: filter, $options: 'i' } },
          { email: { $regex: filter, $options: 'i' } },
        ]
      }

      const total = await User.countDocuments(query)
      const users = await User.find(query)
        .sort({ createdAt: sortOrder })
        .skip((pageNum - 1) * size)
        .limit(size)
        .select('_id email name role active createdAt')
        .lean()

      return {
        users: users.map((u) => ({
          id: (u._id as { toString(): string }).toString(),
          email: u.email,
          name: u.name,
          role: u.role,
          active: u.active,
          createdAt: u.createdAt,
        })),
        total,
        page: pageNum,
        pageSize: size,
      }
    },
  )

  // PATCH /admin/users/:userId — update active field only
  fastify.patch(
    '/admin/users/:userId',
    {
      schema: {
        tags: ['Admin'],
        summary: '管理员：更新用户激活状态',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['userId'],
          properties: { userId: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['active'],
          properties: { active: { type: 'boolean' } },
        },
      },
      onRequest: [(fastify as any).authenticate, requireRole('admin')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.params as { userId: string }
      const { active } = request.body as { active: boolean }
      const user = await User.findByIdAndUpdate(userId, { active }, { new: true })
      if (!user) return reply.status(404).send({ error: 'User not found' })
      return {
        id: (user._id as { toString(): string }).toString(),
        active: user.active,
      }
    },
  )

  // GET /admin/invitation-codes — list codes with filter, order, pagination
  fastify.get(
    '/admin/invitation-codes',
    {
      schema: {
        tags: ['Admin'],
        summary: '管理员：查询邀请码列表',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            filter: { type: 'string', enum: ['used', 'unused', 'null'], default: 'unused' },
            order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            page: { type: 'integer', minimum: 1, default: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: PAGE_SIZE_MAX, default: PAGE_SIZE_MAX },
          },
        },
      },
      onRequest: [(fastify as any).authenticate, requireRole('admin')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { filter = 'unused', order = 'desc', page = 1, pageSize = PAGE_SIZE_MAX } = request.query as {
        filter?: string
        order?: string
        page?: number
        pageSize?: number
      }
      const pageNum = Math.max(1, page)
      const size = Math.min(PAGE_SIZE_MAX, Math.max(1, pageSize))
      const sortOrder = order === 'asc' ? 1 : -1

      const query: Record<string, unknown> = {}
      if (filter === 'used') query.used = true
      else if (filter === 'unused') query.used = false
      // filter === 'null' → no filter, show all

      const total = await InvitationCode.countDocuments(query)
      const codes = await InvitationCode.find(query)
        .sort({ createdAt: sortOrder })
        .skip((pageNum - 1) * size)
        .limit(size)
        .lean()

      return {
        codes: codes.map((c) => ({
          id: (c._id as { toString(): string }).toString(),
          code: c.code,
          used: c.used,
          createdAt: c.createdAt,
        })),
        total,
        page: pageNum,
        pageSize: size,
      }
    },
  )

  // POST /admin/invitation-codes — create a new invitation code
  fastify.post(
    '/admin/invitation-codes',
    {
      schema: {
        tags: ['Admin'],
        summary: '管理员：创建邀请码',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['code'],
          properties: { code: { type: 'string', minLength: 1 } },
        },
      },
      onRequest: [(fastify as any).authenticate, requireRole('admin')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code } = request.body as { code: string }
      if (/[\s\t]/.test(code)) return reply.status(400).send({ error: 'Code must not contain spaces or tabs' })
      const existing = await InvitationCode.findOne({ code })
      if (existing) return reply.status(409).send({ error: 'Code already exists' })
      const invitation = await InvitationCode.create({ code })
      return reply.status(201).send({
        id: (invitation._id as { toString(): string }).toString(),
        code: invitation.code,
        used: invitation.used,
      })
    },
  )

  // PATCH /admin/invitation-codes/:codeId — toggle used status
  fastify.patch(
    '/admin/invitation-codes/:codeId',
    {
      schema: {
        tags: ['Admin'],
        summary: '管理员：更新邀请码使用状态',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['codeId'],
          properties: { codeId: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['used'],
          properties: { used: { type: 'boolean' } },
        },
      },
      onRequest: [(fastify as any).authenticate, requireRole('admin')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { codeId } = request.params as { codeId: string }
      const { used } = request.body as { used: boolean }
      const code = await InvitationCode.findByIdAndUpdate(codeId, { used }, { new: true })
      if (!code) return reply.status(404).send({ error: 'Code not found' })
      return {
        id: (code._id as { toString(): string }).toString(),
        code: code.code,
        used: code.used,
      }
    },
  )
}
