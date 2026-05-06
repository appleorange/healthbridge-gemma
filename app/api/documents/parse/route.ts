import { chatWithVision, extractJSON } from '@/lib/ai/client'
import { DocumentParseRequestSchema } from '@/lib/validation/schemas'
import { getFPLPercent } from '@/lib/constants/fpl'

export const runtime = 'nodejs'

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
    const body = await req.json()
    const parsed = DocumentParseRequestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
    }
    const { fileData, mimeType, fileName, userProfile } = parsed.data

    // Ollama vision requires image input — PDF parsing not supported with local inference
    if (mimeType === 'application/pdf') {
      return Response.json(
        { error: 'PDF parsing is not supported with the local AI backend. Please upload an image (JPEG or PNG) of the document instead.' },
        { status: 422 }
      )
    }

    const userContext = userProfile
      ? `\n\nUser context: ${userProfile.immigrationStatus} status, ${userProfile.state} state, household income at approximately ${Math.round(getFPLPercent(userProfile.annualIncome, userProfile.householdSize))}% FPL.`
      : ''

    const text = await chatWithVision(
      [
        {
          role: 'user',
          content: `Please analyze this document (filename: ${fileName}) and extract all relevant health insurance information.${userContext}`,
        },
      ],
      PARSE_SYSTEM,
      [fileData]
    )

    const PARSE_FALLBACK: Record<string, unknown> = {
      documentType: 'unknown',
      summary: 'Could not parse document — the file may be too complex or low quality. Try a clearer scan or a different page.',
      extractedFields: [],
      deadlines: [],
      planDetails: { deductible: null, outOfPocketMax: null, networkType: null, premium: null, coinsurance: null, copays: {} },
    }

    const result = extractJSON<Record<string, unknown>>(text, PARSE_FALLBACK)
    if (result === PARSE_FALLBACK) {
      throw new Error('Could not parse document — the file may be too complex or low quality. Try a clearer scan or a different page.')
    }

    return Response.json({
      id: Date.now().toString(),
      fileName,
      ...result,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Document parse error:', errMsg)
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
