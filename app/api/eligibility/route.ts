import { calculateEligibility } from '@/lib/eligibility/engine'
import { EligibilityRequestSchema } from '@/lib/validation/schemas'
import Anthropic from '@anthropic-ai/sdk'
import type { UserProfile, EligibilityResult } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const STATUS_LABELS: Record<string, string> = {
  us_citizen: 'US citizen',
  green_card: 'lawful permanent resident (green card holder)',
  h1b: 'H-1B visa holder',
  h4: 'H-4 visa holder (H-1B dependent)',
  f1_student: 'F-1 international student',
  f1_opt: 'F-1 OPT worker',
  j1_scholar: 'J-1 exchange visitor',
  j2: 'J-2 visa holder (J-1 dependent)',
  l1: 'L-1 intracompany transferee',
  o1: 'O-1 visa holder (extraordinary ability)',
  tn: 'TN visa holder (NAFTA/USMCA professional)',
  daca: 'DACA recipient',
  refugee_asylee: 'refugee or asylee',
  tps: 'Temporary Protected Status (TPS) holder',
  parolee: 'humanitarian parolee',
  undocumented: 'undocumented individual',
  other: 'person with an unspecified immigration status',
}

const PLAN_LABELS: Record<string, string> = {
  medicaid: 'Medicaid',
  chip: 'CHIP',
  aca_marketplace: 'ACA Marketplace',
  employer_sponsored: 'employer-sponsored insurance',
  school_plan: 'university health plan (SHIP)',
  international_student_plan: 'international student plan (ISP)',
  short_term: 'short-term health plan',
  cobra: 'COBRA',
  medicare: 'Medicare',
  va: 'VA Healthcare',
  parent_plan: "parent/spouse's plan",
  none: 'no standard plan',
}

async function generateVisaSummary(
  profile: UserProfile,
  result: EligibilityResult,
  language: 'en' | 'es' = 'en',
): Promise<string> {
  const statusLabel = STATUS_LABELS[profile.immigrationStatus] ?? profile.immigrationStatus
  const primaryLabel = PLAN_LABELS[result.primaryRecommendation] ?? result.primaryRecommendation
  const eligibleLabels = (result.eligiblePlans ?? []).map(p => PLAN_LABELS[p] ?? p).join(', ')
  const ineligibleLabels = (result.ineligiblePlans ?? []).map(p => PLAN_LABELS[p] ?? p).join(', ')

  const prompt = `You are a health insurance navigator writing a plain-language explanation for a specific user.

<user>
Immigration status: ${statusLabel}
State: ${profile.state}
Age: ${profile.age}
Income: $${profile.annualIncome.toLocaleString()} / year (household size: ${profile.householdSize})
Employment: ${profile.employmentStatus}${profile.employerName ? ` at ${profile.employerName}` : ''}
Has employer insurance: ${profile.hasEmployerInsurance}
Is student: ${profile.isStudent}${profile.university ? ` at ${profile.university}` : ''}
Has dependents: ${profile.hasDependents}
On COBRA: ${profile.onCOBRA ?? false}
</user>

<eligibility_result>
Best plan: ${primaryLabel}
Eligible for: ${eligibleLabels || 'none'}
Not eligible for: ${ineligibleLabels || 'none'}
Subsidy eligible: ${result.subsidyEligible}
Special circumstances: ${(result.specialCircumstances ?? []).join('; ') || 'none'}
</eligibility_result>

Write 2–4 sentences that explain this person's situation in completely plain language — zero insurance jargon, zero legal citations. The explanation must:
1. Name their immigration status and what it specifically means for their insurance options (why they can or can't access certain programs)
2. Clearly state what they can and cannot access, and why — be concrete, not vague
3. Call out anything unique or important to their specific situation (state, income, dependents, visa-specific risks like coverage gaps on job loss)

Write directly to the user ("you" / "your"). Warm and clear, like a knowledgeable friend. No bullet points — flowing sentences only. No heading. No preamble.${language === 'es' ? '\n\nRespond entirely in Spanish.' : ''}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = response.content?.[0]
  if (!block || block.type !== 'text') throw new Error('Claude returned no text content')
  return block.text.trim()
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = EligibilityRequestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
    }
    const result = calculateEligibility(parsed.data.profile)

    try {
      result.visaEligibilitySummary = await generateVisaSummary(
        parsed.data.profile,
        result,
        parsed.data.language ?? 'en',
      )
    } catch (summaryErr) {
      console.error('Visa summary generation failed (non-fatal):', summaryErr)
    }

    return Response.json(result)
  } catch (error) {
    console.error('Eligibility API error:', error)
    return Response.json({ error: 'Failed to calculate eligibility' }, { status: 500 })
  }
}
