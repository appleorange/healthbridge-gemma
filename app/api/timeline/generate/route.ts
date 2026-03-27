import Anthropic from '@anthropic-ai/sdk'
import type { UserProfile, EligibilityResult, TimelineEvent } from '@/types'

export const runtime = 'nodejs'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { profile, eligibilityResult } = await req.json() as {
      profile: UserProfile
      eligibilityResult: EligibilityResult
    }

    const prompt = `Based on this user profile and eligibility result, generate 3-5 specific enrollment deadlines and action items as a JSON array. Each item needs: id, title, description, date (ISO string), type (one of: open_enrollment, sep, cobra, university, medicaid, action), status (one of: active, upcoming, ongoing, action_required, past), urgent (boolean). Make dates specific — if they go to Carnegie Mellon, the fall waiver deadline is typically August 31. If they work at Google, open enrollment is in November. Be specific about what action to take and why based on their recommended plan. Return only valid JSON, no other text.

User profile:
${JSON.stringify(profile, null, 2)}

Eligibility result:
${JSON.stringify({ primaryRecommendation: eligibilityResult.primaryRecommendation, eligiblePlans: eligibilityResult.eligiblePlans, specialCircumstances: eligibilityResult.specialCircumstances }, null, 2)}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]'

    // Extract JSON array from response (Claude may wrap it in markdown code fences)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return Response.json({ events: [] })
    }

    const rawEvents = JSON.parse(jsonMatch[0]) as Partial<TimelineEvent>[]

    // Validate and tag each event as AI-sourced
    const events: TimelineEvent[] = rawEvents
      .filter(e => e.id && e.title && e.description && e.date && e.type && e.status)
      .map(e => ({
        id: `ai_${e.id}`,
        title: e.title!,
        description: e.description!,
        date: e.date!,
        endDate: e.endDate,
        type: e.type!,
        status: e.status!,
        urgent: e.urgent ?? false,
        actionLabel: e.actionLabel,
        actionUrl: e.actionUrl,
        aiSource: true,
      }))

    return Response.json({ events })
  } catch (error) {
    console.error('Timeline generate error:', error)
    return Response.json({ events: [] })
  }
}
