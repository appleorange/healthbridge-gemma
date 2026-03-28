import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { denialInfo, analysis, planType, state, age } = await req.json()

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Write a formal internal appeal letter for this denied claim. Write in first person. Do not use placeholder brackets — use the actual information provided.

Plan/Insurer: ${denialInfo.planName}
Service denied: ${denialInfo.serviceDescription}
Date of denial: ${denialInfo.denialDate}
Denial reason: ${denialInfo.denialReason}
${denialInfo.denialCode ? `Denial code: ${denialInfo.denialCode}` : ''}
Denial type: ${analysis.denialType}
State: ${state ?? 'unknown'}
${age ? `Patient age: ${age}` : ''}

Appeal grounds to use: ${analysis.keyArguments.join('; ')}

Write a professional appeal letter under 400 words that includes:
1. Clear statement of what is being appealed and the denial date
2. Statement that this is a formal first-level internal appeal
3. Specific grounds for appeal using the grounds listed above
4. Request for the specific clinical criteria used in the denial (this is a legal right under ERISA and ACA)
5. Statement of intent to pursue external independent review if internal appeal is denied
6. Clear request for written response within the legally required timeframe (30 days for standard, 72 hours for urgent care)

Do not include any placeholder text in brackets. Use the actual plan name, service, and dates provided.`,
      },
    ],
  })

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
}
