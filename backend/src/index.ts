import 'dotenv/config'
import { exec } from 'child_process'
import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import fjwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { connectMongoDB } from './db/mongodb'
import { connectRedis } from './db/redis'
import { authRoutes } from './routes/auth'

const PORT = parseInt(process.env.PORT || '8000', 10)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

const server = Fastify({ logger: true })

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

// JWT
server.register(fjwt, { secret: JWT_SECRET })

server.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

// Routes
server.get('/health', {
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

server.register(authRoutes)

const start = async () => {
  try {
    await connectMongoDB()
    await connectRedis()
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
