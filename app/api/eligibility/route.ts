import { calculateEligibility } from '@/lib/eligibility/engine'
import type { UserProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const { profile } = await req.json() as { profile: UserProfile }
    const result = calculateEligibility(profile)
    return Response.json(result)
  } catch (error) {
    console.error('Eligibility API error:', error)
    return Response.json({ error: 'Failed to calculate eligibility' }, { status: 500 })
  }
}
