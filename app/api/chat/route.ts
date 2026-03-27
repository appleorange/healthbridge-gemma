import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from '@/lib/prompts/system'
import type { UserProfile } from '@/types'

export const runtime = 'nodejs'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages, userProfile } = await req.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      userProfile?: UserProfile
    }

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
    console.error('Chat API error:', error)
    return Response.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
