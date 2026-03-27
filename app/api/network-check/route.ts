import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const CMS_KEY = process.env.HEALTHCARE_GOV_API_KEY || 'a94d697d-5fe2-43d5-b829-fbf1d52d9c49'

export interface NetworkCheckResult {
  providerName: string
  inNetwork: boolean | null
  planName: string
  planId: string
  address?: string
  specialty?: string
  reasoning?: string
  confidence: 'confirmed' | 'likely' | 'unknown'
  suggestion?: string
  source: 'cms_api' | 'ai_estimate' | 'unknown'
}

export async function POST(req: Request) {
  try {
    const { providerName, providerType, zipCode, planId, planName } = await req.json() as {
      providerName: string
      providerType: 'doctor' | 'hospital' | 'any'
      zipCode: string
      planId?: string
      planName?: string
    }

    // ── Try CMS Provider Directory if planId is available ──
    if (planId) {
      const type = providerType === 'doctor' ? 'individual' : 'facility'
      try {
        const cmsRes = await fetch(
          `https://marketplace.api.healthcare.gov/api/v1/plans/${planId}/providers?apikey=${CMS_KEY}&name=${encodeURIComponent(providerName)}&zipcode=${encodeURIComponent(zipCode)}&type=${type}`
        )
        if (cmsRes.ok) {
          const data = await cmsRes.json() as { providers?: Record<string, unknown>[] }
          const providers = data.providers ?? []
          if (providers.length > 0) {
            const p = providers[0] as Record<string, unknown>
            const addr = p.address as Record<string, string> | undefined
            return Response.json({
              providerName,
              inNetwork: true,
              planName: planName ?? planId,
              planId,
              address: addr?.street ? `${addr.street}, ${addr.city}, ${addr.state}` : undefined,
              specialty: p.specialty as string | undefined,
              confidence: 'confirmed',
              source: 'cms_api',
            } satisfies NetworkCheckResult)
          }
          // CMS returned OK but zero results — provider not found in this plan's network
          if (cmsRes.ok) {
            return Response.json({
              providerName,
              inNetwork: false,
              planName: planName ?? planId,
              planId,
              confidence: 'confirmed',
              suggestion: 'This provider was not found in this plan\'s network directory. Call member services to confirm before scheduling.',
              source: 'cms_api',
            } satisfies NetworkCheckResult)
          }
        }
      } catch {
        // CMS API failed — fall through to AI estimate
      }
    }

    // ── AI estimate fallback ──
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `A user wants to know if ${providerName} (${providerType}) near ZIP ${zipCode} is likely in-network for ${planName ?? 'their health plan'}. Based on your knowledge of provider networks, give a best estimate. Respond only with JSON: { "inNetwork": boolean | null, "reasoning": string, "confidence": "likely" | "unknown", "suggestion": string }. If you don't have enough information say inNetwork: null and explain what to do.`,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    let aiResult: { inNetwork: boolean | null; reasoning: string; confidence: 'likely' | 'unknown'; suggestion: string }
    try {
      aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      aiResult = { inNetwork: null, reasoning: 'Unable to estimate.', confidence: 'unknown', suggestion: 'Call the member services number on your insurance card to verify.' }
    }

    return Response.json({
      providerName,
      inNetwork: aiResult?.inNetwork ?? null,
      planName: planName ?? 'Your plan',
      planId: planId ?? '',
      reasoning: aiResult?.reasoning,
      confidence: (aiResult?.confidence ?? 'unknown') as 'likely' | 'unknown',
      suggestion: aiResult?.suggestion ?? 'Call the member services number on your insurance card to verify.',
      source: 'ai_estimate',
    } satisfies NetworkCheckResult)
  } catch (error) {
    console.error('Network check error:', error)
    return Response.json({ error: 'Failed to check network status' }, { status: 500 })
  }
}
