# HealthBridge

A health insurance navigator for immigrants and visa holders in the United States — powered by Gemma 4, running entirely on your device.

## The problem

There are 45 million immigrants in the US — on green cards, work visas, DACA, TPS, and many without documentation. Every single one faces a different set of health insurance eligibility rules. Most have no idea where to start.

My grandfather came to the US on a green card with End-Stage Renal Disease. He needed dialysis every other day. My family spent months trying to find insurance that would cover his condition. After all that work, the coverage was still too expensive or didn't cover what he needed. He went back to China after six months.

HealthBridge is built so the next family doesn't have to go through that.

## What makes it different

**Everything runs locally on your device.** HealthBridge uses Gemma 4 via Ollama — no data is ever sent to an external AI API. For immigrants in vulnerable situations, this matters. Your immigration status, income, and health information never leave your laptop.

**It actually knows immigration law.** The eligibility engine covers 14+ immigration status categories with full USC and CFR citations behind every decision node — H-1B, F-1/OPT, J-1, L-1, DACA, TPS, green card, refugee/asylee, undocumented, parolee, and more.

**It works offline.** After the initial setup, HealthBridge runs with no internet connection. Gemma 4 continues to answer questions, draft appeal letters, and generate personalized recommendations entirely on-device.

## Features

- **Eligibility engine** — 14+ immigration status categories, 40+ profile fields, full legal citations
- **Plan recommendations** — ACA marketplace, Medicaid, CHIP, Medicare, employer coverage, COBRA, university SHIP, and more with 0–100 fit scores
- **Gemma 4 reasoning** — background verification of eligibility decisions with step-by-step reasoning and regulatory citations
- **AI chat assistant** — streaming responses with markdown formatting, session-persisted
- **Cost estimator** — premium tax credit and subsidy calculations using 2026 FPL tables
- **Appeal assistant** — upload a denial letter → extract policy language → draft a formal appeal letter
- **Document parser** — vision-based extraction from insurance cards, EOBs, and prior authorization letters
- **Provider network checker** — check if your doctor is in-network before enrolling
- **Enrollment timeline** — personalized deadlines based on your immigration status and state
- **Offline fallback** — Healthcare.gov plan data cached locally, app fully functional without internet
- **Spanish language support** — EN/ES toggle across onboarding and dashboard
- **Privacy badge** — persistent indicator confirming no data is transmitted

## How it uses Gemma 4

HealthBridge uses Gemma 4 (via Ollama) for all AI-powered features:

| Feature | Model usage |
|---|---|
| Chat assistant | Streaming inference, session context |
| Eligibility reasoning | Thinking mode (`think: true`) with keyword-triggered step detection |
| Appeal letter drafting | Streaming plain text generation |
| Document parsing | Vision/multimodal — image input, structured JSON output |
| Checklist generation | JSON-mode inference |
| Timeline generation | JSON-mode inference with profile context |
| Network checker | Fallback estimation when CMS API unavailable |

The eligibility reasoning feature specifically uses Gemma 4's configurable thinking mode — a deliberate tradeoff of latency for accuracy on the highest-stakes output in the app. The reasoning runs in the background after the user receives their recommendation, streaming step completions as the model works through each eligibility rule.

## Setup

### Prerequisites

- Node.js 18+
- [Ollama](https://ollama.com) installed and running
- 10GB free disk space
- 16GB unified memory recommended (Apple Silicon)

### 1. Install Ollama and pull Gemma 4

Download Ollama from [ollama.com](https://ollama.com), then:

```bash
ollama pull gemma4:e4b
```

Verify it's running:

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "gemma4:e4b",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": false
}'
```

### 2. Clone and install

```bash
git clone https://github.com/appleorange/healthbridge-gemma
cd healthbridge-gemma
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

`.env` should contain:OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e4b
OLLAMA_TIMEOUT_MS=120000
OLLAMA_STREAM_TIMEOUT_MS=300000
OLLAMA_THINKING_TIMEOUT_MS=180000

### 4. Run

The launcher scripts start the dev server and open the app automatically in your browser.

Mac/Linux:
```bash
chmod +x start.sh
./start.sh
```

Windows:
```bat
start.bat
```

Or manually:
```bash
npm run dev
```

Open http://localhost:3000

## Testing offline mode

1. Complete onboarding to generate your profile
2. Turn off WiFi
3. The app continues to function — Gemma 4 runs locally, plan data serves from cache
4. The sidebar badge switches to amber "● Offline mode"

## Architecture
User input
→ Zod validation
→ Next.js API route
→ lib/ai/client.ts
→ Ollama (localhost:11434)
→ Gemma 4 (gemma4:e4b)
→ Structured or streamed response
→ UI component

All AI calls route through `lib/ai/client.ts` — a centralized Ollama wrapper with streaming, vision, JSON extraction, thinking mode, and `AbortSignal` timeouts. No route file calls Ollama directly.

The eligibility engine (`lib/eligibility/engine.ts`) is pure TypeScript with no AI dependency — all immigration status logic, 5-year bar calculations, state Medicaid waivers, and subsidy eligibility are deterministic rule-based computations with full legal citations.

## Testing & known limitations

The eligibility engine was validated against a 25-case test matrix covering the most common immigration status and income combinations. All 10 profiles in the core test matrix returned correct results after two bug fixes identified during testing:

- CHIP for US-citizen children of undocumented parents (Zod schema gap — `dependentsHaveUSCitizenChild` was stripped before reaching the engine)
- Medicare APTC suppression for enrollees 65+ (IRC § 36B prohibits APTC for Medicare months)

Known limitations:
- California Premium Tax Credit (CalPTC) for DACA enrollees not yet modeled
- Medicare Savings Programs (QMB/SLMB/QI) not yet modeled
- PDF document parsing not supported — upload JPEG or PNG images
- 2027 APTC eligibility changes documented in codebase but not yet implemented

## Tech stack

- **Framework**: Next.js 14, App Router, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI inference**: Ollama, Gemma 4 (gemma4:e4b)
- **Validation**: Zod on all API routes
- **External data**: Healthcare.gov CMS API with local cache fallback
- **Language support**: English, Spanish

## Hackathon

Built for the [Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/gemma-4-good). Submitted under the Digital Equity & Inclusivity impact track.

## Disclaimer

HealthBridge is for informational purposes only and does not constitute legal or insurance advice. Eligibility rules are based on current ACA and federal guidelines verified against NILC/KFF 2025 sources. Always verify your specific situation with a licensed navigator or attorney.
