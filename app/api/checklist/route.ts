export const runtime = 'nodejs'

import Anthropic from '@anthropic-ai/sdk'
import { ChecklistRequestSchema } from '@/lib/validation/schemas'
import type { ChecklistItem } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

Generate a concrete, personalized action checklist for this specific user to enroll in ${primaryLabel}.

Return a JSON array of checklist items. Each item must have:
- id: unique string (e.g. "doc_1", "call_1")
- category: one of "document", "call", "action", "deadline"
- title: short action title (under 10 words)
- detail: 1-2 sentences of specific, actionable guidance. Include real phone numbers, URLs, or specific document names where relevant.
- urgent: true if this is time-sensitive or blocking
- link: URL (optional, only if a specific government or official site is directly relevant)
- linkLabel: short label for the link (optional)

Rules:
- "document" items = specific documents they need to gather (name the actual document, e.g. "Form I-94", "W-2", "SSN card")
- "call" items = specific offices/numbers to contact (give the actual number or URL, not just "call your state")
- "action" items = concrete steps to take (apply online, complete a form, etc.)
- "deadline" items = time-sensitive windows they must act within
- Be specific to their immigration status, state, and plan type — generic advice is useless
- Maximum 8 items total. Prioritize by urgency. Lead with the highest-impact items.
- Do not include items that don't apply (e.g. no COBRA deadline if they're not losing coverage)

Return only valid JSON — no markdown fences, no explanation.${language === 'es' ? '\n\nWrite all title and detail fields in Spanish.' : ''}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = response.content?.[0]
    if (!block || block.type !== 'text') throw new Error('Claude returned no text content')

    let items: unknown
    try {
      items = JSON.parse(block.text.trim())
    } catch {
      const cleaned = block.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      items = JSON.parse(cleaned)
    }

    if (!Array.isArray(items)) throw new Error('Expected array from Claude')

    const VALID_CATEGORIES = new Set(['document', 'call', 'action', 'deadline'])
    const safeItems: ChecklistItem[] = (items as unknown[])
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .filter(item => typeof item.id === 'string' && typeof item.title === 'string' && typeof item.detail === 'string' && VALID_CATEGORIES.has(item.category as string))
      .map(item => ({
        id: item.id as string,
        category: item.category as ChecklistItem['category'],
        title: item.title as string,
        detail: item.detail as string,
        urgent: item.urgent === true,
        link: typeof item.link === 'string' ? item.link : undefined,
        linkLabel: typeof item.linkLabel === 'string' ? item.linkLabel : undefined,
      }))

    return Response.json({ items: safeItems })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Checklist API error:', errMsg)
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
