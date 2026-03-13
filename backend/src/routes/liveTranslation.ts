import { FastifyInstance } from 'fastify'
import { WebSocket } from '@fastify/websocket'
import { RawData } from 'ws'
import { getSession } from '../services/sessionStore'
import { transcribeAndTranslateJson } from '../services/aiService'
import { saveTranslation } from '../services/translationService'
import fs from 'fs'
import path from 'path'

const RECORDER_DIR = path.resolve(__dirname, '../../test/recorder')
const MESSAGE_FILE = path.resolve(__dirname, '../../test/message.txt')

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

async function flushAudioBuffer(topicId: string, chunks: Buffer[]): Promise<void> {
  if (chunks.length === 0) return
  const combined = Buffer.concat(chunks)
  await fs.promises.mkdir(RECORDER_DIR, { recursive: true })
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const filename = path.join(RECORDER_DIR, `${topicId}-${hh}-${mm}-${ss}.webm`)
  await fs.promises.writeFile(filename, combined)
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

      // Audio buffer state
      // headerChunk: first binary frame (container init segment), prepended to every file
      // so each file is independently playable.
      let headerChunk: Buffer | null = null
      let audioChunks: Buffer[] = []
      let isFirstFlush = true
      // [122] Track the segmentId associated with the current utterance buffer
      let currentSegmentId: string | null = null

      // [111][118] Flush triggered by end_utterance: concurrently save file + call AI
      async function flushOnUtterance(segmentId: string | null) {
        if (audioChunks.length === 0) return
        const chunks = isFirstFlush ? audioChunks : [headerChunk!, ...audioChunks]
        isFirstFlush = false
        audioChunks = []
        const buffer = Buffer.concat(chunks)

        // Fire-and-forget file save
        flushAudioBuffer(topicId, [buffer])
          .then(() => fastify.log.info(`Saved utterance file: topicId=${topicId}`))
          .catch(err => fastify.log.error(`Failed to save utterance file: ${err}`))

        // Call AI and push translation result to client
        try {
          const result = await transcribeAndTranslateJson(buffer)
          // [122] Attach segmentId so frontend can match result to the loading card
          socket.send(JSON.stringify({ type: 'translation', original: result.original, translated: result.translated, segmentId }))

          // Fire-and-forget: save to MongoDB without blocking next utterance
          if (result.original) {
            saveTranslation({
              topicId,
              userId,
              originalText: result.original,
              translatedText: result.translated,
            }).catch(err => fastify.log.error(`Failed to save TranslationRecord: ${err}`))
          }
        } catch (err) {
          fastify.log.error(`AI translation error: topicId=${topicId} err=${err}`)
          socket.send(JSON.stringify({ type: 'error', message: String(err) }))
        }
      }

      // Message handler — binary: audio chunks; text: JSON protocol or plain string
      socket.on('message', async (rawMessage: RawData, isBinary: boolean) => {
        // Binary frame: accumulate audio buffer; cache first chunk as header
        if (isBinary) {
          const chunk = Buffer.from(rawMessage as Buffer)
          if (headerChunk === null) {
            headerChunk = chunk
          }
          audioChunks.push(chunk)
          return
        }

        const text = rawMessage.toString()

        // Try JSON protocol messages first
        try {
          const message = JSON.parse(text) as { type: string; [key: string]: unknown }
          fastify.log.info(`WS message: type=${message.type} topicId=${topicId} userId=${userId}`)

          switch (message.type) {
            case 'segment_start':
              // [122] Record segmentId for the utterance about to be recorded
              currentSegmentId = message.segmentId as string
              break
            case 'end_utterance':
              // [111] Frontend VAD detected silence — save current buffer as a file
              await flushOnUtterance(currentSegmentId)
              break
            case 'ping':
              socket.send(JSON.stringify({ type: 'pong' }))
              break
            default:
              socket.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${message.type}` }))
          }
        } catch {
          // [109] Plain text string from input box: append to message.txt
          try {
            await fs.promises.mkdir(path.dirname(MESSAGE_FILE), { recursive: true })
            await fs.promises.appendFile(MESSAGE_FILE, text + '\n')
            fastify.log.info(`Appended text to message.txt: "${text}"`)
          } catch (err) {
            fastify.log.error(`Failed to append to message.txt: ${err}`)
          }
        }
      })

      // Cleanup on close: flush any remaining buffer
      socket.on('close', async () => {
        try {
          const toFlush = isFirstFlush ? audioChunks : [headerChunk!, ...audioChunks]
          await flushAudioBuffer(topicId, toFlush)
        } catch (err) {
          fastify.log.error(`Failed to flush remaining audio on close: ${err}`)
        }
        audioChunks = []
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
