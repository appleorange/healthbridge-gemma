import { NextResponse } from 'next/server'
import { getPlansForProfile } from '@/lib/plans/plan-finder'
import type { UserProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const { profile } = await req.json() as { profile: UserProfile }
    const plans = await getPlansForProfile(profile)
    return NextResponse.json({ plans })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ plans: [], error: 'Failed to fetch plans' }, { status: 500 })
  }
}
