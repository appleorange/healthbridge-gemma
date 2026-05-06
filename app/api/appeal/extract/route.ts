import { NextRequest } from 'next/server'
import { chatWithVision, extractJSON } from '@/lib/ai/client'
import { z } from 'zod'

export const runtime = 'nodejs'

const ExtractRequestSchema = z.object({
  fileData: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
})

const EXTRACT_FALLBACK = {
  planName: null as string | null,
  denialCode: null as string | null,
  denialReason: null as string | null,
  serviceDescription: null as string | null,
  denialDate: null as string | null,
  policyLanguage: null as string | null,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ExtractRequestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
    }
    const { fileData, mimeType } = parsed.data

    // Ollama vision requires image input — PDF not supported with local inference
    if (mimeType === 'application/pdf') {
      return Response.json(
        { error: 'PDF parsing is not supported with the local AI backend. Please upload an image (JPEG or PNG) of the denial letter instead.' },
        { status: 422 }
      )
    }

    const text = await chatWithVision(
      [
        {
          role: 'user',
          content: `This is an insurance denial letter or Explanation of Benefits (EOB). Extract the following and respond ONLY with valid JSON — no markdown, no explanation:
{
  "planName": "insurance company or plan name as written in the document",
  "denialCode": "denial code, CARC/RARC adjustment reason code, or remark code (e.g. CO-4, PR-96, N130) — null if not present",
  "denialReason": "the exact reason for denial as stated verbatim in the document",
  "serviceDescription": "the procedure, service, medication, or item that was denied",
  "denialDate": "date of denial in YYYY-MM-DD format — null if not found",
  "policyLanguage": "the specific policy clause, contract language, or clinical criteria cited verbatim as the basis for denial — null if not present"
}`,
        },
      ],
      '',
      [fileData]
    )

    const raw = extractJSON<typeof EXTRACT_FALLBACK>(text, EXTRACT_FALLBACK)
    const result = {
      planName: typeof raw.planName === 'string' ? raw.planName : null,
      denialCode: typeof raw.denialCode === 'string' ? raw.denialCode : null,
      denialReason: typeof raw.denialReason === 'string' ? raw.denialReason : null,
      serviceDescription: typeof raw.serviceDescription === 'string' ? raw.serviceDescription : null,
      denialDate: typeof raw.denialDate === 'string' ? raw.denialDate : null,
      policyLanguage: typeof raw.policyLanguage === 'string' ? raw.policyLanguage : null,
    }
    return Response.json(result)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Appeal extract error:', errMsg)
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
