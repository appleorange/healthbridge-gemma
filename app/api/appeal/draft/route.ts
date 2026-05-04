import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { AppealDraftRequestSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = AppealDraftRequestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
    }
    const { denialInfo, analysis, planType, state, age } = parsed.data

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
${denialInfo.policyLanguage ? `Policy language cited in denial: "${denialInfo.policyLanguage}"` : ''}
Denial type: ${analysis.denialType}
State: ${state ?? 'unknown'}
${age ? `Patient age: ${age}` : ''}

Appeal grounds to use: ${analysis.keyArguments.join('; ')}

Write a professional appeal letter under 450 words that includes:
1. Clear statement of what is being appealed, the denial date${denialInfo.denialCode ? `, and the denial code (${denialInfo.denialCode})` : ''}
2. Statement that this is a formal first-level internal appeal
3. Specific grounds for appeal using the grounds listed above
${denialInfo.policyLanguage ? `4. Direct challenge to the specific policy language cited in the denial — quote it exactly and explain why it does not apply or was applied incorrectly` : `4. Request for the specific clinical criteria used in the denial (this is a legal right under ERISA and ACA)`}
5. Request for the complete medical criteria and guidelines used in the decision
6. Statement of intent to pursue external independent review if internal appeal is denied
7. Clear request for written response within the legally required timeframe (30 days for standard, 72 hours for urgent care)

Do not include any placeholder text in brackets. Use the actual plan name, service, dates, and any specific policy language provided above.`,
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
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Appeal draft error:', errMsg)
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
