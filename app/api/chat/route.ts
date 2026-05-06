import { anthropic as client } from '@/lib/api/anthropic'
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

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    })

    // Return a streaming response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
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
