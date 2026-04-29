import { calculateEligibility } from '@/lib/eligibility/engine'
import { EligibilityRequestSchema } from '@/lib/validation/schemas'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = EligibilityRequestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
    }
    const result = calculateEligibility(parsed.data.profile)
    return Response.json(result)
  } catch (error) {
    console.error('Eligibility API error:', error)
    return Response.json({ error: 'Failed to calculate eligibility' }, { status: 500 })
  }
}
