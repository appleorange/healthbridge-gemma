import Anthropic from '@anthropic-ai/sdk'
import type { UserProfile } from '@/types'

export const runtime = 'nodejs'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PARSE_SYSTEM = `You are a health insurance document analyst. When given a document, you:
1. Identify the document type (insurance_card, eob, prior_auth, appeal_letter, tax_form, plan_summary, employer_guide, or unknown)
2. Extract all key fields relevant to health insurance in plain language
3. Flag any important deadlines or limits
4. For plan documents: extract deductible, out-of-pocket max, network type (HMO/PPO/EPO/HDHP), premium, copays, coinsurance
5. Provide a 2–3 sentence plain-language summary a non-expert can understand

Respond ONLY with valid JSON matching this exact structure (no markdown, no explanation):
{
  "documentType": "string (one of the types above)",
  "summary": "string",
  "extractedFields": [
    { "label": "string", "value": "string", "flagged": false }
  ],
  "deadlines": [
    { "label": "string", "date": "string", "urgent": false }
  ],
  "planDetails": {
    "deductible": "string or null",
    "outOfPocketMax": "string or null",
    "networkType": "string or null",
    "premium": "string or null",
    "coinsurance": "string or null",
    "copays": {}
  }
}`

export async function POST(req: Request) {
  try {
    const { fileData, mimeType, fileName, userProfile } = await req.json() as {
      fileData: string
      mimeType: string
      fileName: string
      userProfile?: UserProfile
    }

    const isImage = mimeType.startsWith('image/')
    const isPDF = mimeType === 'application/pdf'

    if (!isImage && !isPDF) {
      return Response.json({ error: 'Unsupported file type. Please upload a PDF or image.' }, { status: 400 })
    }

    const userContext = userProfile
      ? `\n\nUser context: ${userProfile.immigrationStatus} status, ${userProfile.state} state, household income at approximately ${Math.round((userProfile.annualIncome / 15060) * 100)}% FPL.`
      : ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = [
      isPDF
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData } }
        : { type: 'image', source: { type: 'base64', media_type: mimeType, data: fileData } },
      {
        type: 'text',
        text: `Please analyze this document (filename: ${fileName}) and extract all relevant health insurance information.${userContext}`,
      },
    ]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: PARSE_SYSTEM,
      messages: [{ role: 'user', content }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return Response.json({
      id: Date.now().toString(),
      fileName,
      ...parsed,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Document parse error:', errMsg)
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
