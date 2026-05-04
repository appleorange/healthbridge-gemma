import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

export const runtime = 'nodejs'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ExtractRequestSchema = z.object({
  fileData: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ExtractRequestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
    }
    const { fileData, mimeType } = parsed.data

    const isPDF = mimeType === 'application/pdf'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = [
      isPDF
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData } }
        : { type: 'image', source: { type: 'base64', media_type: mimeType, data: fileData } },
      {
        type: 'text',
        text: `This is an insurance denial letter or Explanation of Benefits (EOB). Extract the following and respond ONLY with valid JSON — no markdown, no explanation:
{
  "planName": "insurance company or plan name as written in the document",
  "denialCode": "denial code, CARC/RARC adjustment reason code, or remark code (e.g. CO-4, PR-96, N130) — null if not present",
  "denialReason": "the exact reason for denial as stated verbatim in the document",
  "serviceDescription": "the procedure, service, medication, or item that was denied",
  "denialDate": "date of denial in YYYY-MM-DD format — null if not found",
  "policyLanguage": "the specific policy clause, contract language, or clinical criteria cited verbatim as the basis for denial — null if not present"
}`,
      },
    ]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    const result = JSON.parse(jsonMatch[0])
    return Response.json(result)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Appeal extract error:', errMsg)
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
