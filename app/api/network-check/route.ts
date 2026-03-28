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
  confidence: 'confirmed' | 'likely' | 'unlikely' | 'unknown'
  suggestion?: string
  source: 'cms_api' | 'ai_estimate' | 'unknown'
}

const KNOWN_SYSTEMS: Record<string, string> = {
  'sutter': 'Sutter Health operates a largely closed network in Northern California. Most non-Sutter insurance plans cover Sutter providers as out-of-network only.',
  'kaiser': 'Kaiser Permanente is exclusively in-network only for Kaiser plans. No other insurance plans cover Kaiser providers as in-network.',
  'ucsf': 'UCSF Health participates in many PPO networks in the Bay Area but generally not HMO networks.',
  'upmc': 'UPMC operates its own health plan. UPMC providers are often out-of-network for non-UPMC plans in western Pennsylvania.',
  'mayo': 'Mayo Clinic has selective network participation — in-network for some Blue Cross Blue Shield plans and select PPOs.',
  'cleveland clinic': 'Cleveland Clinic participates in many major PPO networks but has limited HMO participation.',
  'cedars': 'Cedars-Sinai participates in many major networks in Los Angeles including most PPO plans.',
  'stanford': 'Stanford Health Care participates in many PPO networks in the Bay Area.',
  'dignity': 'Dignity Health / CommonSpirit participates in most major insurance networks.',
  'hca': 'HCA Healthcare hospitals participate in most major insurance networks.',
}

export async function POST(req: Request) {
  try {
    const { providerName, providerType, zipCode, planId, planName, planNetworkType } = await req.json() as {
      providerName: string
      providerType: 'doctor' | 'hospital' | 'any'
      zipCode: string
      planId?: string
      planName?: string
      planNetworkType?: string
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
    const providerLower = providerName.toLowerCase()
    const systemNote = Object.entries(KNOWN_SYSTEMS).find(([key]) => providerLower.includes(key))?.[1] ?? ''

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `A patient wants to check if their doctor/hospital is in-network for their health insurance plan.

Provider: ${providerName}
Provider type: ${providerType}
ZIP code: ${zipCode}
Insurance plan: ${planName ?? 'unknown plan'}
Network type: ${planNetworkType ?? 'unknown'}

${systemNote ? `Important background: ${systemNote}` : ''}

Instructions:
- PPO plans generally have broad networks. Unless this is a known closed-network provider (like Kaiser or Sutter), PPO plans often DO cover providers.
- HMO plans have restricted networks — only cover providers in their specific network.
- If the provider is part of a large well-known health system (UCSF, Stanford, Mayo, Cleveland Clinic), they often participate in many major networks.
- Only say "likely out of network" if you have a specific reason — not just because you are uncertain.
- If you genuinely don't know, say inNetwork: null with confidence "unknown".

Respond ONLY with valid JSON, no other text:
{
  "inNetwork": true or false or null,
  "confidence": "likely" or "unlikely" or "unknown",
  "reasoning": "one clear specific sentence",
  "suggestion": "what to do to verify"
}`,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    let aiResult: { inNetwork: boolean | null; reasoning: string; confidence: 'likely' | 'unlikely' | 'unknown'; suggestion: string }
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
      confidence: (aiResult?.confidence ?? 'unknown') as 'likely' | 'unlikely' | 'unknown',
      suggestion: aiResult?.suggestion ?? 'Call the member services number on your insurance card to verify.',
      source: 'ai_estimate',
    } satisfies NetworkCheckResult)
  } catch (error) {
    console.error('Network check error:', error)
    return Response.json({ error: 'Failed to check network status' }, { status: 500 })
  }
}
