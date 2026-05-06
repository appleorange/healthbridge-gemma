import { chat } from '@/lib/ai/client'
import { buildSystemPrompt } from '@/lib/prompts/system'
import { ChatRequestSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = ChatRequestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
    }
    const { messages, userProfile } = parsed.data

    const systemPrompt = buildSystemPrompt(
      userProfile?.immigrationStatus || 'other',
      userProfile as unknown as Record<string, unknown>
    )

    const ollamaStream = await chat(messages, systemPrompt, true)

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder()
        const reader = ollamaStream.getReader()
        let buffer = ''

        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed) continue
              try {
                const json = JSON.parse(trimmed) as { message?: { content?: string }; done?: boolean }
                if (json.message?.content) {
                  controller.enqueue(encoder.encode(json.message.content))
                }
              } catch { /* malformed line, skip */ }
            }
          }

          // flush remaining buffer
          if (buffer.trim()) {
            try {
              const json = JSON.parse(buffer.trim()) as { message?: { content?: string } }
              if (json.message?.content) {
                controller.enqueue(encoder.encode(json.message.content))
              }
            } catch { /* ignore */ }
          }
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Chat API error:', errMsg)
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
