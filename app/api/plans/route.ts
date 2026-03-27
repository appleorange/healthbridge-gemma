import { NextResponse } from 'next/server'
import { getPlansForProfile } from '@/lib/plans/plan-finder'
import type { UserProfile, PlanType } from '@/types'

export async function POST(req: Request) {
  try {
    const { profile, eligiblePlans, primaryRecommendation } = await req.json() as {
      profile: UserProfile
      eligiblePlans: PlanType[]
      primaryRecommendation: PlanType
    }
    const plans = await getPlansForProfile(profile, eligiblePlans, primaryRecommendation)
    return NextResponse.json({ plans })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ plans: [], error: 'Failed to fetch plans' }, { status: 500 })
  }
}
