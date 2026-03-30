# HealthBridge Tech Stack

## Language & Runtime
- **Language:** TypeScript 6.0.2
- **Runtime:** Node.js (Next.js serverless/self-hosted)
- **Target:** ES2017

## Framework & Major Libraries

### Frontend Framework
- **Next.js** 14.2.35 — React SSR/SSG framework with App Router
- **React** 18.3.1 — Core UI library
- **React DOM** 18.3.1 — React rendering engine

### Styling & UI
- **@tailwindcss/postcss** 4.2.2 — Tailwind CSS v4 (PostCSS-based)
- **autoprefixer** 10.4.27 — Vendor prefix automation
- **postcss** 8.5.8 — CSS transformation pipeline
- **clsx** 2.1.1 — Conditional className utility
- **lucide-react** 1.7.0 — Vector icon library

### Animation & Graphics
- **framer-motion** 12.38.0 — Production motion library (DOM animations)
- **gsap** 3.14.2 — GreenSock Animation Platform (timeline/advanced animations)
- **number-flow** 0.6.0 — Animated number transitions
- **ogl** 1.0.11 — WebGL 3D graphics renderer

### AI/LLM Integration
- **@anthropic-ai/sdk** 0.80.0 — Anthropic Claude API client with streaming support

### Type Definitions
- **@types/node** 25.5.0 — Node.js type definitions
- **@types/react** 19.2.14 — React type definitions

## Build Tooling & Configuration

### TypeScript
- **tsconfig.json** location: `tsconfig.json`
  - Target: ES2017
  - Module: ESNext
  - Module resolution: bundler
  - Strict mode: enabled
  - JSX: preserve (handled by Next.js)
  - Incremental builds enabled
  - Path alias: `@/*` → root directory

### Next.js
- **`next.config.js`**
  - Experimental server components external packages: marks `@anthropic-ai/sdk` as external

### CSS Pipeline
- **`tailwind.config.js`**
  - Content paths: `./pages/**`, `./components/**`, `./app/**`
- **`postcss.config.js`**
  - Plugins: `@tailwindcss/postcss`, `autoprefixer`

## Environment Variables

### Configuration Files
- `.env.local.example` — Template for local development
- `.env.local` — Local environment secrets (git-ignored)

### Required/Used Variables
- `ANTHROPIC_API_KEY` — Claude API authentication (required for all AI endpoints)
- `NEXT_PUBLIC_APP_URL` — Public application base URL (exposed to client)
- `HEALTHCARE_GOV_API_KEY` — CMS Healthcare.gov Marketplace API key (optional; fallback demo key included)

### Notes
- `NEXT_PUBLIC_*` variables are embedded in client-side JavaScript bundles
- All variables read at runtime via `process.env`

## Styling Approach

- **Tailwind CSS v4** (utility-first CSS)
- PostCSS-based compilation with vendor prefixing via Autoprefixer
- No CSS-in-JS framework
- No pre-built UI component library (all components built from scratch)
- Icon system via `lucide-react` SVG icons
- Motion via Framer Motion and GSAP

## Dev Dependencies
- No testing framework configured
- No explicit devDependencies in package.json (all in dependencies)

## Server/Runtime Configuration

- **App Router:** `app/` directory
- **Runtime:** `export const runtime = 'nodejs'` on specific API routes
- **Server vs Client:** Server Components default; Client Components via `'use client'`
- **Module Resolution:** Bundler-based (Next.js webpack), ESM + CommonJS interop
