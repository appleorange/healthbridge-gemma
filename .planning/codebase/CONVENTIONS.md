# HealthBridge Coding Conventions

## TypeScript Configuration

**Strict Mode: ENABLED** (`tsconfig.json` — `strict: true`)
- No implicit `any`, strict null checks
- `noEmit: true` (type-checking only)
- `isolatedModules: true`
- `esModuleInterop: true`
- Target: ES2017, Module resolution: bundler
- Path alias: `@/*` → repository root

---

## Component Patterns

**File Structure**
- Client Components: `'use client'` directive at top
- Path: `components/{feature}/{ComponentName}.tsx`
- Examples: `components/plans/PlanCards.tsx`, `components/chat/ChatInterface.tsx`, `components/ui/GradientText.tsx`

**Props Interface Pattern**
```typescript
interface Props {
  userProfile: UserProfile
  onToggleCompare?: (planId: string) => void
}
export default function ComponentName({ userProfile, onToggleCompare }: Props) { ... }
```

**Naming Conventions**
- Components: PascalCase (`PlanCardItem`, `ChatInterface`)
- Props interfaces: `Props` or `{ComponentName}Props`
- Internal functions: camelCase (`clearHistory`, `sendMessage`)
- Constants: UPPER_CASE (`STORAGE_KEY`, `MESSAGE_LIMIT`)
- Event handlers: prefix with `handle` (`handleNext`, `handleFiles`)

---

## Error Handling Patterns

**API Routes (Server)**
```typescript
export async function POST(req: Request) {
  try {
    const { profile } = await req.json() as { profile: UserProfile }
    return Response.json(result)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Feature API error:', errMsg)
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
```

**Client-Side**
```typescript
setError(null)
try {
  const res = await fetch('/api/endpoint', { ... })
  if (!res.ok) setError('Failed')
  const data = await res.json()
} catch (e) {
  setError(e instanceof Error ? e.message : 'Unknown error')
}
```

**JSON Parsing Robustness** — Claude may wrap JSON in markdown fences:
```typescript
let analysis = JSON.parse(text.trim())
// If fails, strip markdown and retry:
const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
analysis = JSON.parse(cleaned)
```
Always provide safe fallback structures with sensible defaults (see `app/api/appeal/analyze/route.ts`).

---

## API Route Patterns

- All routes in `app/api/{feature}/{action}/route.ts`
- Node.js-dependent routes declare: `export const runtime = 'nodejs'`
- Request: `await req.json() as { expectedShape: Type }` (explicit type assertion)
- Simple responses: `Response.json(data)`
- Streaming: `new Response(ReadableStream, { headers: { 'Content-Type': '...' } })`

**Anthropic Integration**
```typescript
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
// Non-streaming:
const response = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1500, ... })
// Streaming:
const stream = await client.messages.stream({ ... })
for await (const chunk of stream) { ... }
```

---

## Import Conventions

Order: external deps → type imports → `@/*` aliases → internal utilities

```typescript
'use client'
import { useState, useRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import type { UserProfile, ParsedDocument } from '@/types'
import { ONBOARDING_STEPS } from '@/lib/eligibility/onboarding-steps'
```

- Always `import type` for TypeScript-only imports
- Lucide icons imported individually by name (tree-shaking)

---

## State Management Conventions

**sessionStorage** (not localStorage) — keys prefixed with `hb_`:
```typescript
const STORAGE_KEY = 'hb_chat_messages'
const countKey = 'hb_message_count'

// Read
const saved = sessionStorage.getItem(STORAGE_KEY)
const count = parseInt(sessionStorage.getItem(countKey) ?? '0')

// Write
sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
sessionStorage.setItem(countKey, String(count + 1))
```

Always wrap sessionStorage access in try/catch. Persist state changes in `useEffect`.

---

## Styling Conventions

**Tailwind CSS v4** — all styling via className utility classes.

**Brand palette** (defined in `app/globals.css`):
```
brand-50: #f4f6f0  brand-100: #dad7cd  brand-200: #c2c9b5
brand-300: #a3b18a  brand-400: #7a9466  brand-500: #588157
brand-600: #3a5a40  brand-700: #344e41  brand-800: #2a3d33
brand-900: #1a2820
```

**Reusable classes** (`@layer components` in globals.css):
- `.btn-primary` — primary action button
- `.btn-secondary` — secondary action button
- `.card` — white rounded card with border
- `.input-base` — form input base styles

**Conditional classes:**
```tsx
className={`rounded-2xl border ${isBest ? 'border-brand-300 shadow-sm' : 'border-gray-100'}`}
```

**Style-to-class mapping pattern:**
```typescript
const NETWORK_COLORS: Record<string, string> = {
  HMO: 'bg-blue-50 text-blue-700 border-blue-200',
  PPO: 'bg-purple-50 text-purple-700 border-purple-200',
}
```

Animations via framer-motion (`motion.div`, `useInView`) and GSAP. Keyframes in `globals.css`.

---

## Type Definitions

- All shared types centralized in `types/index.ts`
- Discriminated unions for status fields:
```typescript
export type ImmigrationStatus =
  | 'us_citizen' | 'green_card' | 'h1b' | 'h4' | 'f1_student'
  | 'daca' | 'refugee_asylee' | 'undocumented' | 'other'
```

---

## Code Organization

**`lib/` functions** — pure functions organized by domain:
- `lib/eligibility/engine.ts` — eligibility calculation
- `lib/calculators/cost-estimator.ts` — cost estimation
- `lib/plans/plan-finder.ts` — plan matching + CMS API calls
- `lib/prompts/system.ts` — AI system prompt building

**Constants** — top-level arrays/objects in module scope:
```typescript
const SUGGESTED_QUESTIONS = ['What does my deductible mean?', ...]
const FEATURES = [{ icon: Shield, title: '...', description: '...' }]
```

---

## Notable Patterns

- **Streaming responses:** Chat API streams via `ReadableStream`; client reads with `for await`
- **Document handling:** Base64-encode files before sending to Claude; validate type + size first
- **Session limits:** sessionStorage counters gate API calls (`hb_message_count`, `hb_doc_count`, `hb_appeal_count`)
- **SVG progress rings:** `strokeDasharray` + `requestAnimationFrame` for animated fit scores (`components/plans/PlanCards.tsx`)
- **Conditional form fields:** `showWhen` logic on onboarding steps for progressive disclosure
