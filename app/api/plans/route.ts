import { NextResponse } from 'next/server'
import { getPlansForProfile } from '@/lib/plans/plan-finder'
import { PlansRequestSchema } from '@/lib/validation/schemas'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = PlansRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
    }
    const { profile, eligiblePlans, primaryRecommendation } = parsed.data
    const plans = await getPlansForProfile(profile, eligiblePlans, primaryRecommendation)
    return NextResponse.json({ plans })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ plans: [], error: 'Failed to fetch plans' }, { status: 500 })
  }
}
