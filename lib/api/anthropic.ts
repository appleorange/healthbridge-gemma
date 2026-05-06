import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Parses JSON from Claude responses, handling markdown fences and embedded JSON.
 * Claude sometimes wraps JSON in ```json ... ``` or includes surrounding text.
 */
export function extractJSON(text: string): unknown {
  const trimmed = text.trim()

  // 1. Try direct parse first (Claude followed instructions)
  try {
    return JSON.parse(trimmed)
  } catch { /* continue */ }

  // 2. Strip markdown fences
  const stripped = trimmed
    .replace(/^```json\s*/m, '')
    .replace(/^```\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim()
  try {
    return JSON.parse(stripped)
  } catch { /* continue */ }

  // 3. Extract embedded JSON object or array from surrounding text
  const objMatch = stripped.match(/\{[\s\S]*\}/)
  if (objMatch) return JSON.parse(objMatch[0])
  const arrMatch = stripped.match(/\[[\s\S]*\]/)
  if (arrMatch) return JSON.parse(arrMatch[0])

  throw new SyntaxError(`No JSON found in response: ${trimmed.slice(0, 100)}`)
}
