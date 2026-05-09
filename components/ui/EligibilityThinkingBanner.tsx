'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { CheckCircle, Circle, Minus, Brain, RefreshCw } from 'lucide-react'
import type { UserProfile, EligibilityResult } from '@/types'

const STEP_META: Record<number, { label: string; citation: string; cite_short: string }> = {
  1: {
    label: 'Marketplace eligibility',
    citation: 'ACA § 1312(f) — immigration status and marketplace access',
    cite_short: 'ACA § 1312(f)',
  },
  2: {
    label: 'Medicaid & CHIP rules',
    citation: '42 USC § 1396b — federal Medicaid participation requirements',
    cite_short: '42 USC § 1396b',
  },
  3: {
    label: '5-year immigration bar',
    citation: 'PRWORA § 403(a) — 5-year waiting period for federal benefit programs',
    cite_short: 'PRWORA § 403(a)',
  },
  4: {
    label: 'Subsidy / APTC calculation',
    citation: 'IRC § 36B — Premium Tax Credit eligibility and income thresholds',
    cite_short: 'IRC § 36B',
  },
  5: {
    label: 'Plan recommendation',
    citation: '45 CFR § 155.305 — ACA eligibility determination standards',
    cite_short: '45 CFR § 155.305',
  },
}

const ALL_STEPS = [1, 2, 3, 4, 5]
const TIMEOUT_MS = 180_000

type BannerState = 'idle' | 'loading' | 'done' | 'error'

export default function EligibilityThinkingBanner() {
  const [bannerState, setBannerState] = useState<BannerState>('idle')
  const [firedSteps, setFiredSteps] = useState<Set<number>>(new Set())
  const abortRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startThinking = useCallback(() => {
    // Abort any in-progress request
    abortRef.current?.abort()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    let profile: UserProfile
    try {
      const raw = sessionStorage.getItem('hb_profile')
      if (!raw) { setBannerState('idle'); return }
      profile = JSON.parse(raw) as UserProfile
    } catch { setBannerState('idle'); return }

    const lang = (sessionStorage.getItem('hb_lang') ?? 'en') as 'en' | 'es'

    setBannerState('loading')
    setFiredSteps(new Set())

    const controller = new AbortController()
    abortRef.current = controller

    timeoutRef.current = setTimeout(() => {
      controller.abort()
      setBannerState('error')
    }, TIMEOUT_MS)

    ;(async () => {
      try {
        const res = await fetch('/api/eligibility/thinking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, language: lang }),
          signal: controller.signal,
        })
        if (!res.ok || !res.body) throw new Error(`status ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        const localSteps = new Set<number>()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const msg = JSON.parse(line.slice(6)) as { type: string; step?: number; eligibility?: EligibilityResult }
              if (msg.type === 'step' && typeof msg.step === 'number') {
                localSteps.add(msg.step)
                setFiredSteps(prev => { const n = new Set(prev); n.add(msg.step!); return n })
              } else if (msg.type === 'result') {
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                sessionStorage.setItem('hb_thinking_steps', JSON.stringify([...localSteps]))
                // Persist the AI-generated summary back so dashboard shows it on next visit
                if (msg.eligibility?.visaEligibilitySummary) {
                  try {
                    const stored = sessionStorage.getItem('hb_eligibility')
                    if (stored) {
                      const el = JSON.parse(stored) as EligibilityResult
                      el.visaEligibilitySummary = msg.eligibility.visaEligibilitySummary
                      sessionStorage.setItem('hb_eligibility', JSON.stringify(el))
                    }
                  } catch {}
                }
                setFiredSteps(new Set(localSteps))
                setBannerState('done')
              }
            } catch { /* malformed SSE chunk — skip */ }
          }
        }
      } catch (err) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if ((err as { name?: string }).name !== 'AbortError') setBannerState('error')
      }
    })()
  }, [])

  useEffect(() => {
    // If we already have verified steps from a prior run, show done state immediately
    try {
      const raw = sessionStorage.getItem('hb_thinking_steps')
      if (raw) {
        const steps = JSON.parse(raw) as number[]
        if (steps.length > 0) {
          setFiredSteps(new Set(steps))
          setBannerState('done')
          return
        }
      }
    } catch {}

    startThinking()

    return () => {
      abortRef.current?.abort()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [startThinking])

  if (bannerState === 'idle') return null

  if (bannerState === 'error') {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-gray-300" />
            <p className="text-sm text-gray-400">Verification unavailable — tap to retry</p>
          </div>
          <button
            onClick={startThinking}
            className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    )
  }

  if (bannerState === 'loading') {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-brand-50 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Verifying with Gemma 4 reasoning</p>
            <p className="text-xs text-gray-400">Running locally in the background — no data sent</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {ALL_STEPS.map(step => {
            const fired = firedSteps.has(step)
            const meta = STEP_META[step]
            return (
              <div key={step} className="flex items-start gap-2.5">
                {fired ? (
                  <CheckCircle className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-200 mt-0.5 shrink-0" />
                )}
                <span className={`text-sm transition-colors duration-300 ${fired ? 'text-gray-800 font-medium' : 'text-gray-300'}`}>
                  {meta.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // done state
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-brand-50 rounded-full flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-brand-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Verified by Gemma 4 reasoning</p>
          <p className="text-xs text-gray-400">Rules checked during your eligibility analysis — running locally, no data sent</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {ALL_STEPS.map(step => {
          const meta = STEP_META[step]
          const fired = firedSteps.has(step)
          return (
            <div key={step} className="flex items-start gap-2.5">
              {fired ? (
                <CheckCircle className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
              ) : (
                <Minus className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <span className={`text-sm ${fired ? 'text-gray-800' : 'text-gray-400'}`}>
                  {meta.label}
                </span>
                {fired ? (
                  <p className="text-xs text-gray-400 mt-0.5 truncate" title={meta.citation}>
                    {meta.cite_short}
                  </p>
                ) : (
                  <p className="text-xs text-gray-300 mt-0.5">not applicable for your profile</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
