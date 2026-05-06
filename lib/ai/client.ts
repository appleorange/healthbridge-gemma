const BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL ?? 'gemma4:e4b'
// Default 30s for streaming (first token arrives quickly); set OLLAMA_TIMEOUT_MS higher
// for non-streaming on hardware where full response generation exceeds 30 seconds.
const TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS ?? '30000', 10)

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaMessage extends ChatMessage {
  images?: string[]
}

interface OllamaNonStreamResponse {
  message: { role: string; content: string }
  done: boolean
}

function buildMessages(messages: ChatMessage[], system: string): OllamaMessage[] {
  if (system) {
    return [{ role: 'system', content: system }, ...messages]
  }
  return [...messages]
}

export async function chat(
  messages: ChatMessage[],
  system: string,
  stream: false
): Promise<string>
export async function chat(
  messages: ChatMessage[],
  system: string,
  stream: true
): Promise<ReadableStream<Uint8Array>>
export async function chat(
  messages: ChatMessage[],
  system: string,
  stream: boolean
): Promise<string | ReadableStream<Uint8Array>> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: buildMessages(messages, system),
      stream,
      think: false,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!res.ok) {
    throw new Error(`Ollama /api/chat ${res.status}: ${await res.text()}`)
  }

  if (stream) {
    if (!res.body) throw new Error('Ollama returned no body for streaming request')
    return res.body
  }

  const data = (await res.json()) as OllamaNonStreamResponse
  return data.message.content
}

export async function chatWithVision(
  messages: ChatMessage[],
  system: string,
  images: string[]
): Promise<string> {
  const ollamaMessages: OllamaMessage[] = buildMessages(messages, system)

  // Attach images to the last user message per Ollama's vision format
  let lastUserIdx = -1
  for (let i = ollamaMessages.length - 1; i >= 0; i--) {
    if (ollamaMessages[i].role === 'user') {
      lastUserIdx = i
      break
    }
  }
  if (lastUserIdx !== -1) {
    ollamaMessages[lastUserIdx] = { ...ollamaMessages[lastUserIdx], images }
  }

  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: ollamaMessages,
      stream: false,
      think: false,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!res.ok) {
    throw new Error(`Ollama /api/chat (vision) ${res.status}: ${await res.text()}`)
  }

  const data = (await res.json()) as OllamaNonStreamResponse
  return data.message.content
}

export function extractJSON<T>(text: string, fallback: T): T {
  try {
    const trimmed = text.trim()

    try { return JSON.parse(trimmed) as T } catch { /* continue */ }

    const stripped = trimmed
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim()
    try { return JSON.parse(stripped) as T } catch { /* continue */ }

    const objMatch = stripped.match(/\{[\s\S]*\}/)
    if (objMatch) return JSON.parse(objMatch[0]) as T
    const arrMatch = stripped.match(/\[[\s\S]*\]/)
    if (arrMatch) return JSON.parse(arrMatch[0]) as T
  } catch { /* fall through to fallback */ }

  return fallback
}
