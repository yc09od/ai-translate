import 'dotenv/config'
import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import fjwt from '@fastify/jwt'
import { connectMongoDB } from './db/mongodb'
import { connectRedis } from './db/redis'
import { authRoutes } from './routes/auth'

const PORT = parseInt(process.env.PORT || '8000', 10)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

const server = Fastify({ logger: true })

server.register(fjwt, { secret: JWT_SECRET })

server.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

server.get('/health', async () => {
  return { status: 'ok', message: 'Backend is running' }
})

server.register(authRoutes)

const start = async () => {
  try {
    await connectMongoDB()
    await connectRedis()
    await server.listen({ port: PORT, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
