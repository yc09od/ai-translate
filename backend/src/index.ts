import 'dotenv/config'
import { exec } from 'child_process'
import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import fjwt from '@fastify/jwt'
import fcookie from '@fastify/cookie'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import websocket from '@fastify/websocket'
import mongoose from 'mongoose'
import { connectMongoDB } from './db/mongodb'
import { redis, connectRedis } from './db/redis'
import { getSession } from './services/sessionStore'
import { authRoutes } from './routes/auth'
import { topicRoutes } from './routes/topics'
import { translationRoutes } from './routes/translations'
import { userRoutes } from './routes/users'
import { systemRoutes } from './routes/system'
import { liveTranslationRoutes } from './routes/liveTranslation'
import { devTestRoutes } from './routes/devTest'

// Fastify type augmentation for decorated DB instances
declare module 'fastify' {
  interface FastifyInstance {
    mongoose: typeof mongoose
    redis: typeof redis
  }
}

const PORT = parseInt(process.env.PORT || '8000', 10)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())

const server = Fastify({ logger: true })

// CORS
server.register(cors, {
  origin: CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})

// Swagger / OpenAPI
server.register(swagger, {
  openapi: {
    info: {
      title: 'AI 实时翻译 API',
      description: 'Backend API for AI real-time translation service',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
})

server.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: { docExpansion: 'list' },
})

// WebSocket
server.register(websocket)

// Cookie
server.register(fcookie)

// JWT
server.register(fjwt, { secret: JWT_SECRET })

server.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    const { userId } = request.user as { userId: string }
    const session = await getSession(userId)
    if (!session) {
      return reply.status(401).send({ error: 'Session expired or invalidated' })
    }
  } catch (err) {
    reply.send(err)
  }
})

// Routes
server.register(systemRoutes)
server.register(authRoutes)
server.register(topicRoutes)
server.register(translationRoutes)
server.register(userRoutes)
server.register(liveTranslationRoutes)
if (process.env.NODE_ENV !== 'production') {
  server.register(devTestRoutes)
}

const start = async () => {
  try {
    await connectMongoDB()
    await connectRedis()
    server.decorate('mongoose', mongoose)
    server.decorate('redis', redis)
    await server.listen({ port: PORT, host: '0.0.0.0' })
    if (process.env.NODE_ENV !== 'production') {
      exec(`start http://localhost:${PORT}/docs`)
    }
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
