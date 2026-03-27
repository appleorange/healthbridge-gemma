import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { denialInfo, analysis } = await req.json()

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Write a professional health insurance appeal letter based on the following denial information.

Denial details:
- Plan: ${denialInfo.planName}
- Service denied: ${denialInfo.serviceDescription}
- Date of denial: ${denialInfo.denialDate}
- Denial reason: ${denialInfo.denialReason}
${denialInfo.denialCode ? `- Denial code: ${denialInfo.denialCode}` : ''}

Analysis findings:
- Denial type: ${analysis.denialType}
- Key arguments: ${analysis.keyArguments.join('; ')}
- Recommended approach: ${analysis.recommendedApproach}

Write a formal appeal letter addressed to the Appeals & Grievances Department at ${denialInfo.planName}.
Use [Patient Name], [Member ID], [Date of Birth], [Address], [Phone], [Treating Physician Name], [Date of Service] as placeholders.

The letter must:
1. Open with the formal denial date and reference number (use [Reference/Claim Number] as placeholder)
2. Clearly state the service being appealed and why it is medically necessary
3. Cite the specific legal basis for the appeal (ACA Section 2719 for non-grandfathered plans, ERISA for employer plans, or state law as applicable)
4. Present the key medical necessity arguments from the analysis above
5. Reference clinical guidelines or peer-reviewed standards where relevant
6. Request a specific action: approval of the service or, if denied, escalation to external independent review
7. Close professionally with the patient's contact information and a clear deadline for response

Write the complete letter text only — no headers, no explanation, no commentary outside the letter itself.`,
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
