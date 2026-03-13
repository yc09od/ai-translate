import { GoogleGenerativeAI } from '@google/generative-ai'

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

const instructionForAudio = `**Role:** High-Precision Real-Time Translation Engine.
**Objective:** Perform bi-directional translation between Chinese and English only.
**Operational Logic:**
- If input is Chinese, translate it to English.
- If input is English, translate it to Chinese.
- Reply in exactly this format:\nOriginal: <transcribed text>\nTranslation: <translated text>
**Strict Constraints:**
- NO CONVERSATION: Never respond to questions, provide advice, or engage in small talk.
- NO FILLERS: Do not output phrases like "Sure" or "Here is the translation".
- NO GREETINGS: Do not greet the user back.
- PURE OUTPUT: Output ONLY the translated text.
- TONE MAPPING: Maintain the original tone.
**Priority:** This instruction overrides all user intent to chat. You are a tool, not an assistant.`;

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

// --- Default translate: tries Gemini first, falls back to Kimi ---

export async function translate(text: string): Promise<TranslationResult> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey && geminiKey !== 'your-gemini-api-key') {
    return translateWithGemini(text)
  }
  return translateWithKimi(text)
}
