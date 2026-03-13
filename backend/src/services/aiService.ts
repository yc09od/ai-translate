import { GoogleGenerativeAI } from '@google/generative-ai'
import prompts from '../config/prompts.json'

// --- Config (overridable via env) ---
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const GEMINI_TEMPERATURE = parseFloat(process.env.GEMINI_TEMPERATURE ?? '0')
const KIMI_MODEL = process.env.KIMI_MODEL ?? 'moonshot-v1-8k'
const KIMI_API_URL = process.env.KIMI_API_URL ?? 'https://api.moonshot.cn/v1/chat/completions'
const KIMI_TEMPERATURE = parseFloat(process.env.KIMI_TEMPERATURE ?? '0.3')
const AUDIO_MIME_TYPE = process.env.AUDIO_MIME_TYPE ?? 'audio/ogg'
const CJK_REGEX = /[\u4e00-\u9fff]/

export interface TranslationResult {
  original: string
  translated: string
}

// Detect language: returns 'zh' if text contains CJK characters, otherwise 'en'
function detectLang(text: string): 'zh' | 'en' {
  return CJK_REGEX.test(text) ? 'zh' : 'en'
}

function buildPrompt(text: string): string {
  const sourceLang = detectLang(text)
  const targetLang = sourceLang === 'zh' ? 'English' : 'Chinese'
  return (
    `Translate the following text to ${targetLang}. ` +
    `Return ONLY the translation, no explanations or extra text.\n\n${text}`
  )
}

// --- Gemini ---

let geminiClient: GoogleGenerativeAI | null = null

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      throw new Error('GEMINI_API_KEY is not configured')
    }
    geminiClient = new GoogleGenerativeAI(apiKey)
  }
  return geminiClient
}

export async function translateWithGemini(text: string): Promise<TranslationResult> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: GEMINI_MODEL, generationConfig: { temperature: GEMINI_TEMPERATURE } })
  const result = await model.generateContent(buildPrompt(text))
  const translated = result.response.text().trim()
  return { original: text, translated }
}

// Streaming variant: calls onChunk for each text chunk, resolves with full result
export async function translateWithGeminiStream(
  text: string,
  onChunk: (chunk: string) => void
): Promise<TranslationResult> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: GEMINI_MODEL, generationConfig: { temperature: GEMINI_TEMPERATURE } })
  const result = await model.generateContentStream(buildPrompt(text))

  let translated = ''
  for await (const chunk of result.stream) {
    const chunkText = chunk.text()
    if (chunkText) {
      translated += chunkText
      onChunk(chunkText)
    }
  }
  return { original: text, translated: translated.trim() }
}

// --- Kimi (Moonshot AI — OpenAI-compatible API) ---

export async function translateWithKimi(text: string): Promise<TranslationResult> {
  const apiKey = process.env.KIMI_API_KEY
  if (!apiKey || apiKey === 'your-kimi-api-key') {
    throw new Error('KIMI_API_KEY is not configured')
  }

  const response = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      messages: [{ role: 'user', content: buildPrompt(text) }],
      temperature: KIMI_TEMPERATURE,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Kimi API error ${response.status}: ${err}`)
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[]
  }
  const translated = data.choices[0].message.content.trim()
  return { original: text, translated }
}

// --- Gemini audio transcribe + translate (streaming) ---

const { instructionForAudio } = prompts

export async function transcribeAndTranslateStream(
  audioBuffer: Buffer,
  onChunk: (chunk: string) => void
): Promise<TranslationResult> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: instructionForAudio})

  const result = await model.generateContentStream([
    { inlineData: { mimeType: AUDIO_MIME_TYPE, data: audioBuffer.toString('base64') } },
  ])

  let fullText = ''
  for await (const chunk of result.stream) {
    const chunkText = chunk.text()
    if (chunkText) {
      fullText += chunkText
      onChunk(chunkText)
    }
  }

  const originalMatch = fullText.match(/Original:\s*(.+?)(?:\n|$)/i)
  const translationMatch = fullText.match(/Translation:\s*(.+?)(?:\n|$)/i)
  return {
    original: originalMatch?.[1]?.trim() ?? fullText,
    translated: translationMatch?.[1]?.trim() ?? '',
  }
}

// --- Gemini audio transcribe + translate for live route (JSON output) ---

export async function transcribeAndTranslateJson(audioBuffer: Buffer): Promise<TranslationResult> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: prompts.instructionForLiveAudio,
    generationConfig: { temperature: GEMINI_TEMPERATURE },
  })
  const result = await model.generateContent([
    { inlineData: { mimeType: AUDIO_MIME_TYPE, data: audioBuffer.toString('base64') } },
  ])
  const text = result.response.text().trim()
  try {
    const parsed = JSON.parse(text) as { o?: string; t?: string }
    return { original: parsed.o ?? '', translated: parsed.t ?? '' }
  } catch {
    return { original: text, translated: '' }
  }
}

// --- Default translate: tries Gemini first, falls back to Kimi ---

export async function translate(text: string): Promise<TranslationResult> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey && geminiKey !== 'your-gemini-api-key') {
    return translateWithGemini(text)
  }
  return translateWithKimi(text)
}
