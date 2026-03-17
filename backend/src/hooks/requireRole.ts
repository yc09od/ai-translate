import { FastifyRequest, FastifyReply } from 'fastify'
import { User, UserRole } from '../models/User'

/**
 * Factory that returns an onRequest hook allowing only the specified roles.
 * Must be used after the `authenticate` hook (which populates request.user).
 */
export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const user = await User.findById(userId).select('role').lean()
    if (!user || !roles.includes(user.role as UserRole)) {
      return reply.status(403).send({ error: 'Forbidden: insufficient role' })
    }
  }
}
