import { chat, extractJSON } from '@/lib/ai/client'
import type { TimelineEvent } from '@/types'
import { TimelineRequestSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = TimelineRequestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ events: [] })
    }
    const { profile, eligibilityResult } = parsed.data

    // Only send fields the model needs for enrollment-deadline generation
    const timelineProfile = {
      immigrationStatus: profile.immigrationStatus,
      employmentStatus: profile.employmentStatus,
      state: profile.state,
      age: profile.age,
      isStudent: profile.isStudent,
      university: profile.university,
      yearsLeftInCollege: profile.yearsLeftInCollege,
      schoolRequiresInsurance: profile.schoolRequiresInsurance,
      employerName: profile.employerName,
      hasEmployerInsurance: profile.hasEmployerInsurance,
      employerOpenEnrollmentMonth: profile.employerOpenEnrollmentMonth,
      onCOBRA: profile.onCOBRA,
      cobraMonthsRemaining: profile.cobraMonthsRemaining,
      currentlyInsured: profile.currentlyInsured,
      currentPlanType: profile.currentPlanType,
      hasDependents: profile.hasDependents,
      dependentCoverageEndDate: profile.dependentCoverageEndDate,
      agingOffDate: profile.agingOffDate,
      jobSearchTimeline: profile.jobSearchTimeline,
      formerEmployerInsurance: profile.formerEmployerInsurance,
      unemployedMonths: profile.unemployedMonths,
    }

    const prompt = `Based on this user profile and eligibility result, generate up to 6 enrollment deadlines as a JSON array. Each item has exactly 3 fields: date (ISO string YYYY-MM-DD), title (short action title, under 10 words), urgent (true or false). Make dates specific — if they attend Carnegie Mellon, the fall SHIP waiver deadline is August 31; if they work at Google, open enrollment is in November. Return only valid JSON, no other text.

User profile:
${JSON.stringify(timelineProfile)}

Eligibility result:
${JSON.stringify({ primaryRecommendation: eligibilityResult.primaryRecommendation, eligiblePlans: eligibilityResult.eligiblePlans, specialCircumstances: eligibilityResult.specialCircumstances })}`

    const text = await chat(
      [{ role: 'user', content: prompt }],
      '',
      false
    )

    type MinimalEvent = { date?: string; title?: string; urgent?: boolean }
    const rawEvents = extractJSON<MinimalEvent[]>(text, [])

    const events: TimelineEvent[] = rawEvents
      .filter((e): e is { date: string; title: string; urgent?: boolean } =>
        typeof e.date === 'string' && typeof e.title === 'string'
      )
      .slice(0, 6)
      .map((e, i) => ({
        id: `ai_${i + 1}`,
        title: e.title,
        description: e.title,
        date: e.date,
        type: 'action' as const,
        status: (e.urgent ? 'action_required' : 'upcoming') as TimelineEvent['status'],
        urgent: e.urgent ?? false,
        aiSource: true,
      }))

    return Response.json({ events })
  } catch (error) {
    console.error('Timeline generate error:', error)
    return Response.json({ events: [] })
  }
}
