export const runtime = 'nodejs'

import { chat, extractJSON } from '@/lib/ai/client'
import { ChecklistRequestSchema } from '@/lib/validation/schemas'
import type { ChecklistItem } from '@/types'

const PLAN_LABEL: Record<string, string> = {
  medicaid: 'Medicaid',
  chip: 'CHIP',
  aca_marketplace: 'ACA Marketplace',
  employer_sponsored: 'employer-sponsored plan',
  school_plan: 'university health plan (SHIP)',
  international_student_plan: 'international student plan',
  short_term: 'short-term health plan',
  cobra: 'COBRA',
  medicare: 'Medicare',
  va: 'VA Healthcare',
  parent_plan: "parent/spouse's plan",
  none: 'no standard plan',
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = ChecklistRequestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { profile, eligibility, language } = parsed.data
    const primaryLabel = PLAN_LABEL[eligibility.primaryRecommendation] ?? eligibility.primaryRecommendation

    const prompt = `You are a health insurance navigator helping a user take their next concrete steps toward getting coverage.

<user_profile>
Immigration status: ${profile.immigrationStatus}
State: ${profile.state}${profile.zipCode ? ` (ZIP: ${profile.zipCode})` : ''}
Age: ${profile.age}
Employment: ${profile.employmentStatus}${profile.employerName ? ` at ${profile.employerName}` : ''}
Annual income: $${profile.annualIncome.toLocaleString()}
Household size: ${profile.householdSize}
Currently insured: ${profile.currentlyInsured}
Has dependents: ${profile.hasDependents}
Is student: ${profile.isStudent}${profile.university ? ` at ${profile.university}` : ''}
On COBRA: ${profile.onCOBRA ?? false}
</user_profile>

<eligibility_result>
Primary recommendation: ${primaryLabel}
Eligible plans: ${eligibility.eligiblePlans.map(p => PLAN_LABEL[p] ?? p).join(', ')}
Subsidy eligible: ${eligibility.subsidyEligible ?? false}
Special circumstances: ${(eligibility.specialCircumstances ?? []).join('; ') || 'none'}
</eligibility_result>

Generate a personalized action checklist for this user to enroll in ${primaryLabel}.

Return a JSON array of exactly 5 items or fewer. Each item has exactly these 4 fields:
- category: "document", "call", "action", or "deadline"
- title: under 8 words
- detail: 1-2 sentences of specific, actionable guidance
- urgent: true or false

Rules: be specific to their immigration status, state, and plan type. Lead with the highest-impact items. No generic advice.

Return only valid JSON — no markdown, no explanation.${language === 'es' ? '\n\nWrite all title and detail fields in Spanish.' : ''}`

    const text = await chat(
      [{ role: 'user', content: prompt }],
      '',
      false
    )

    const items = extractJSON<unknown[]>(text, [])
    if (!Array.isArray(items)) throw new Error('Expected array from model')

    const VALID_CATEGORIES = new Set(['document', 'call', 'action', 'deadline'])
    const safeItems: ChecklistItem[] = (items as unknown[])
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .filter(item => typeof item.title === 'string' && typeof item.detail === 'string' && VALID_CATEGORIES.has(item.category as string))
      .map(item => ({
        category: item.category as ChecklistItem['category'],
        title: item.title as string,
        detail: item.detail as string,
        urgent: item.urgent === true,
      }))

    return Response.json({ items: safeItems })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Checklist API error:', errMsg)
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
