import { FastifyInstance } from 'fastify'
import { WebSocket } from '@fastify/websocket'
import { RawData } from 'ws'
import { getSession } from '../services/sessionStore'

// Track active connections per topic: topicId -> Set of WebSocket clients
const topicConnections = new Map<string, Set<WebSocket>>()

function addConnection(topicId: string, ws: WebSocket) {
  if (!topicConnections.has(topicId)) {
    topicConnections.set(topicId, new Set())
  }
  topicConnections.get(topicId)!.add(ws)
}

function removeConnection(topicId: string, ws: WebSocket) {
  topicConnections.get(topicId)?.delete(ws)
  if (topicConnections.get(topicId)?.size === 0) {
    topicConnections.delete(topicId)
  }
}

export async function liveTranslationRoutes(fastify: FastifyInstance) {
  // GET /topics/:topicId/translation/live — WebSocket endpoint for live translation
  // Auth: pass JWT as query param ?token=xxx (browser WebSocket API cannot set headers)
  fastify.get(
    '/topics/:topicId/translation/live',
    { websocket: true },
    async (socket: WebSocket, request) => {
      const { topicId } = request.params as { topicId: string }
      const { token } = request.query as { token?: string }

      // Auth: verify JWT and session
      if (!token) {
        socket.send(JSON.stringify({ type: 'error', message: 'Missing token' }))
        socket.close(1008, 'Missing token')
        return
      }

      let userId: string
      try {
        const payload = fastify.jwt.verify(token) as { userId: string }
        userId = payload.userId
        const session = await getSession(userId)
        if (!session) {
          socket.send(JSON.stringify({ type: 'error', message: 'Session expired' }))
          socket.close(1008, 'Session expired')
          return
        }
      } catch {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid token' }))
        socket.close(1008, 'Invalid token')
        return
      }

      // Connection established
      addConnection(topicId, socket)
      fastify.log.info(`WS connected: userId=${userId} topicId=${topicId}`)
      socket.send(JSON.stringify({ type: 'connected', topicId, userId }))

      // Message handler
      socket.on('message', (rawMessage: RawData) => {
        try {
          const message = JSON.parse(rawMessage.toString()) as {
            type: string
            [key: string]: unknown
          }
          fastify.log.info(`WS message: type=${message.type} topicId=${topicId} userId=${userId}`)

          // Dispatch by message type — handlers to be added in future TODOs
          switch (message.type) {
            case 'ping':
              socket.send(JSON.stringify({ type: 'pong' }))
              break
            default:
              socket.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${message.type}` }))
          }
        } catch {
          socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
        }
      })

      // Cleanup on close
      socket.on('close', () => {
        removeConnection(topicId, socket)
        fastify.log.info(`WS disconnected: userId=${userId} topicId=${topicId}`)
      })

      socket.on('error', (err: Error) => {
        fastify.log.error(`WS error: userId=${userId} topicId=${topicId} err=${err.message}`)
        removeConnection(topicId, socket)
      })
    }
  )
}
