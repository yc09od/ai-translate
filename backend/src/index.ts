import 'dotenv/config'
import Fastify from 'fastify'

const PORT = parseInt(process.env.PORT || '8000', 10)

const server = Fastify({ logger: true })

server.get('/health', async () => {
  return { status: 'ok', message: 'Backend is running' }
})

const start = async () => {
  try {
    await server.listen({ port: PORT, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
