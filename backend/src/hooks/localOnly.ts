import { FastifyRequest, FastifyReply } from 'fastify'

const LOCALHOST = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

export async function localOnly(request: FastifyRequest, reply: FastifyReply) {
  if (!LOCALHOST.has(request.ip)) {
    return reply.status(403).send({ error: 'Forbidden: localhost only' })
  }
}
