const BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL ?? 'gemma4:e4b'
const TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS ?? '120000', 10)
// Streaming responses can take several minutes at low tok/s — use a separate, much longer timeout.
const STREAM_TIMEOUT_MS = parseInt(process.env.OLLAMA_STREAM_TIMEOUT_MS ?? '300000', 10)
// Thinking mode streams thinking tokens then content tokens — needs a long timeout covering both phases.
const THINKING_TIMEOUT_MS = parseInt(process.env.OLLAMA_THINKING_TIMEOUT_MS ?? '180000', 10)

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
    signal: AbortSignal.timeout(stream ? STREAM_TIMEOUT_MS : TIMEOUT_MS),
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

// Thinking-step keyword definitions — ordered so earlier steps don't accidentally satisfy later ones.
// Each set of keywords maps to the step number fired when ANY keyword is matched in the accumulated
// thinking text. Steps fire at most once each, in order, via the firedSteps guard.
const THINKING_STEP_KEYWORDS: { step: number; keywords: string[] }[] = [
  { step: 1, keywords: ['marketplace', 'immigration status'] },
  { step: 2, keywords: ['medicaid', 'Medicaid'] },
  { step: 3, keywords: ['5-year', 'five-year', 'bar'] },
  { step: 4, keywords: ['subsidy', 'APTC', 'FPL'] },
]

interface OllamaStreamChunk {
  message: { role: string; thinking?: string; content: string }
  done: boolean
}

export async function chatWithThinking(
  messages: ChatMessage[],
  system: string,
  onThinkingStep?: (step: number) => void,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: buildMessages(messages, system),
      stream: true,
      think: true,
    }),
    signal: AbortSignal.timeout(THINKING_TIMEOUT_MS),
  })

  if (!res.ok) {
    throw new Error(`Ollama /api/chat (thinking) ${res.status}: ${await res.text()}`)
  }
  if (!res.body) throw new Error('Ollama returned no body for thinking request')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let thinkingAccum = ''
  let contentAccum = ''
  let contentStarted = false
  const firedSteps = new Set<number>()

  function checkSteps(newThinking: string) {
    if (!onThinkingStep) return
    const combined = thinkingAccum + newThinking
    for (const { step, keywords } of THINKING_STEP_KEYWORDS) {
      if (!firedSteps.has(step) && keywords.some(kw => combined.includes(kw))) {
        firedSteps.add(step)
        onThinkingStep(step)
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const chunk = JSON.parse(trimmed) as OllamaStreamChunk
        const thinking = chunk.message.thinking ?? ''
        const content = chunk.message.content ?? ''

        if (thinking) {
          checkSteps(thinking)
          thinkingAccum += thinking
        }

        if (content && !contentStarted) {
          contentStarted = true
          // Step 5 fires as soon as the first content token arrives — thinking is complete
          if (!firedSteps.has(5) && onThinkingStep) {
            firedSteps.add(5)
            onThinkingStep(5)
          }
        }
        if (content) contentAccum += content
      } catch {
        // malformed chunk — skip
      }
    }
  }

  return contentAccum
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
