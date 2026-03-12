import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { WebSocket } from '@fastify/websocket'
import { translateWithGemini, translateWithKimi, translateWithGeminiStream, transcribeAndTranslateStream } from '../services/aiService'
import { RawData } from 'ws'
import { localOnly } from '../hooks/localOnly'
import fs from 'fs'
import path from 'path'

const TEST_DIR = path.resolve(__dirname, '../../test')

export async function devTestRoutes(fastify: FastifyInstance) {
  // All /dev/* routes are localhost-only
  fastify.addHook('onRequest', localOnly)

  // POST /dev/test/translate — 测试 AI 翻译（仅 dev 环境）
  fastify.post(
    '/dev/test/translate',
    {
      schema: {
        tags: ['Dev'],
        summary: '测试 AI 翻译（仅 dev 环境）',
        description: '直接将一段文本发给指定 AI API 进行翻译，用于调试 AI 集成。',
        body: {
          type: 'object',
          required: ['text', 'brand'],
          properties: {
            text: { type: 'string', description: '需要翻译的文本' },
            brand: {
              type: 'string',
              enum: ['gemini', 'kimi'],
              description: '使用的 AI 提供商',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              original: { type: 'string' },
              translated: { type: 'string' },
              brand: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          500: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { text, brand } = request.body as { text: string; brand: 'gemini' | 'kimi' }

      if (!text?.trim()) {
        return reply.status(400).send({ error: 'text is required' })
      }

      try {
        const result =
          brand === 'kimi' ? await translateWithKimi(text) : await translateWithGemini(text)
        return reply.send({ ...result, brand })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        fastify.log.error(`[devTest] translate error: ${message}`)
        return reply.status(500).send({ error: message })
      }
    }
  )

  // GET /dev/test/translate/stream — WebSocket streaming 翻译测试（仅 dev 环境）
  // 消息协议（客户端 → 服务端）：
  //   Binary frame          — 音频数据块（每 250ms）
  //   { type: "end_utterance" } — VAD 检测到静音，触发转录+翻译
  //   Plain text string     — 直接翻译文本（不经过 STT）
  // 消息协议（服务端 → 客户端）：
  //   { type: "chunk", text: "..." }               — 流式输出 chunk
  //   { type: "done", original: "...", translated: "..." } — 完成
  //   { type: "error", message: "..." }             — 出错
  fastify.get(
    '/dev/test/translate/stream',
    { websocket: true },
    async (socket: WebSocket) => {
      let headerChunk: Buffer | null = null
      let audioChunks: Buffer[] = []

      socket.on('message', async (raw: RawData, isBinary: boolean) => {
        // Binary: accumulate audio buffer
        if (isBinary) {
          const chunk = Buffer.from(raw as Buffer)
          if (!headerChunk) {
            // First chunk is the container header (WebM/OGG); store separately
            headerChunk = chunk
            return
          }
          audioChunks.push(chunk)
          return
        }

        const text = raw.toString()

        // Try JSON protocol
        try {
          const msg = JSON.parse(text) as { type: string }

          if (msg.type === 'end_utterance') {
            if (audioChunks.length === 0) return
            // Always prepend the container header so every utterance is a valid audio file
            const buffer = Buffer.concat(headerChunk ? [headerChunk, ...audioChunks] : audioChunks)
            audioChunks = []

            // Save audio to backend/test/<timestamp>.webm
            const filename = `utterance_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`
            fs.mkdirSync(TEST_DIR, { recursive: true })
            fs.writeFileSync(path.join(TEST_DIR, filename), buffer)
            fastify.log.info(`[devTest] saved audio: ${filename}`)

            try {
              const result = await transcribeAndTranslateStream(buffer, (chunk) => {
                socket.send(JSON.stringify({ type: 'chunk', text: chunk }))
              })
              socket.send(JSON.stringify({ type: 'done', ...result }))
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err)
              fastify.log.error(`[devTest] audio stream error: ${message}`)
              socket.send(JSON.stringify({ type: 'error', message }))
            }
          }
          return
        } catch { /* not JSON — treat as plain text */ }

        // Plain text: translate directly
        const trimmed = text.trim()
        if (!trimmed) return
        try {
          const result = await translateWithGeminiStream(trimmed, (chunk) => {
            socket.send(JSON.stringify({ type: 'chunk', text: chunk }))
          })
          socket.send(JSON.stringify({ type: 'done', ...result }))
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          fastify.log.error(`[devTest] text stream error: ${message}`)
          socket.send(JSON.stringify({ type: 'error', message }))
        }
      })
    }
  )
}
