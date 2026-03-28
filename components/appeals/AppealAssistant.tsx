'use client'
import { useState, useEffect } from 'react'
import { Send, Loader, CheckCircle, AlertCircle, Copy, ChevronRight, FileText } from 'lucide-react'
import type { UserProfile, EligibilityResult } from '@/types'

interface Props {
  userProfile?: UserProfile
  eligibilityResult?: EligibilityResult
}

type Step = 'entry' | 'analysis' | 'draft' | 'tracking'

interface DenialInfo {
  planName: string
  denialReason: string
  denialDate: string
  serviceDescription: string
  denialCode: string
}

interface AnalysisResult {
  denialType: string
  appealableIssues: string[]
  recommendedApproach: string
  successLikelihood: 'high' | 'medium' | 'low'
  supportingDocuments: string[]
  keyArguments: string[]
}

const EMPTY_DENIAL: DenialInfo = {
  planName: '',
  denialReason: '',
  denialDate: '',
  serviceDescription: '',
  denialCode: '',
}

export default function AppealAssistant({ userProfile, eligibilityResult }: Props) {
  const [step, setStep] = useState<Step>('entry')
  const [denialInfo, setDenialInfo] = useState<DenialInfo>(EMPTY_DENIAL)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [appealLetter, setAppealLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('hb_pending_denial')
      if (pending) {
        const data = JSON.parse(pending)
        setDenialInfo(prev => ({ ...prev, ...data }))
        sessionStorage.removeItem('hb_pending_denial')
      } else if (userProfile) {
        // Pre-fill plan name from current coverage if available
        const planLabels: Record<string, string> = {
          employer: userProfile.parentPlanInsurer ?? userProfile.employerName ?? 'Employer plan',
          aca_marketplace: 'ACA Marketplace plan',
          medicaid: 'Medicaid',
          school_plan: userProfile.university ? `${userProfile.university} SHIP` : 'University health plan',
          isp: 'International student plan',
          cobra: 'COBRA continuation',
          short_term: 'Short-term health plan',
        }
        const planName = userProfile.currentPlanType
          ? (planLabels[userProfile.currentPlanType] ?? userProfile.currentPlanType)
          : (eligibilityResult?.primaryRecommendation
              ? (planLabels[eligibilityResult.primaryRecommendation] ?? '')
              : '')
        if (planName) {
          setDenialInfo(prev => ({ ...prev, planName: prev.planName || planName }))
        }
      }
    } catch {}
  }, [userProfile, eligibilityResult])

  async function analyzeAppeal() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/appeal/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...denialInfo,
          planType: eligibilityResult?.primaryRecommendation ?? 'unknown',
          immigrationStatus: userProfile?.immigrationStatus ?? 'unknown',
          state: userProfile?.state ?? 'unknown',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed')
      setAnalysis(data)
      setStep('analysis')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze denial')
    } finally {
      setLoading(false)
    }
  }

  async function draftLetter() {
    setLoading(true)
    setError(null)
    setAppealLetter('')
    setStep('draft')
    try {
      const res = await fetch('/api/appeal/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          denialInfo,
          analysis,
          planType: eligibilityResult?.primaryRecommendation ?? 'unknown',
          state: userProfile?.state ?? 'unknown',
          age: userProfile?.age ?? null,
        }),
      })
      if (!res.ok || !res.body) throw new Error('Draft failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setAppealLetter(prev => prev + decoder.decode(value))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to draft letter')
    } finally {
      setLoading(false)
    }
  }

  function saveAndTrack() {
    try {
      const existing = JSON.parse(sessionStorage.getItem('hb_active_appeals') ?? '[]')
      existing.push({
        id: Date.now(),
        denialInfo,
        analysis,
        appealLetter,
        savedAt: new Date().toISOString(),
        status: 'draft',
      })
      sessionStorage.setItem('hb_active_appeals', JSON.stringify(existing))
    } catch {}
    setStep('tracking')
  }

  function copyLetter() {
    navigator.clipboard.writeText(appealLetter).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function reset() {
    setStep('entry')
    setDenialInfo(EMPTY_DENIAL)
    setAnalysis(null)
    setAppealLetter('')
    setError(null)
  }

  if (step === 'entry') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 mb-1">Insurance denial? You have rights.</p>
          <p className="text-xs text-amber-700">
            Most denials can be appealed. The AI will analyze your denial and write a professional appeal letter.
            Under the ACA, you have at least 180 days from the denial date to file an internal appeal.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Plan / Insurance company *</label>
            <input
              type="text"
              value={denialInfo.planName}
              onChange={e => setDenialInfo(prev => ({ ...prev, planName: e.target.value }))}
              placeholder="e.g. Blue Shield PPO, Aetna, Kaiser"
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">What was denied? *</label>
            <input
              type="text"
              value={denialInfo.serviceDescription}
              onChange={e => setDenialInfo(prev => ({ ...prev, serviceDescription: e.target.value }))}
              placeholder="e.g. MRI of left knee, physical therapy, Humira prescription"
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Denial date *</label>
              <input
                type="date"
                value={denialInfo.denialDate}
                onChange={e => setDenialInfo(prev => ({ ...prev, denialDate: e.target.value }))}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Denial code (if shown)</label>
              <input
                type="text"
                value={denialInfo.denialCode}
                onChange={e => setDenialInfo(prev => ({ ...prev, denialCode: e.target.value }))}
                placeholder="e.g. CO-4, PR-96"
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Reason given for denial *</label>
            <textarea
              value={denialInfo.denialReason}
              onChange={e => setDenialInfo(prev => ({ ...prev, denialReason: e.target.value }))}
              rows={3}
              placeholder="Copy the denial reason from your letter or EOB…"
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-400 resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={analyzeAppeal}
          disabled={loading || !denialInfo.planName || !denialInfo.serviceDescription || !denialInfo.denialReason || !denialInfo.denialDate}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 transition-all"
        >
          {loading
            ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing…</>
            : <><Send className="w-4 h-4" /> Analyze my denial</>}
        </button>
      </div>
    )
  }

  if (step === 'analysis' && analysis) {
    const likelihoodColors = {
      high: 'text-green-700 bg-green-50 border-green-200',
      medium: 'text-amber-700 bg-amber-50 border-amber-200',
      low: 'text-red-700 bg-red-50 border-red-200',
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Denial Analysis</h3>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${likelihoodColors[analysis.successLikelihood]}`}>
            {analysis.successLikelihood === 'high' ? 'Strong appeal case' : analysis.successLikelihood === 'medium' ? 'Moderate case' : 'Challenging case'}
          </span>
        </div>

        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-500 mb-1">Denial type</p>
          <p className="text-sm text-gray-800">{analysis.denialType}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Appealable issues</p>
          <div className="space-y-1.5">
            {analysis.appealableIssues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-brand-50 border border-brand-100 rounded-xl">
                <CheckCircle className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-brand-800">{issue}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Key arguments for your letter</p>
          <div className="space-y-1.5">
            {analysis.keyArguments.map((arg, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs font-bold text-brand-600 flex-shrink-0 mt-0.5">{i + 1}.</span>
                <p className="text-xs text-gray-700">{arg}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Documents to gather</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.supportingDocuments.map((doc, i) => (
              <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full">
                {doc}
              </span>
            ))}
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs font-semibold text-blue-700 mb-1">Recommended approach</p>
          <p className="text-xs text-blue-800">{analysis.recommendedApproach}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setStep('entry')}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            Edit details
          </button>
          <button
            onClick={draftLetter}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-brand-700 transition-all"
          >
            {loading
              ? <><Loader className="w-4 h-4 animate-spin" /> Writing…</>
              : <>Write appeal letter <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'draft') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Appeal Letter</h3>
          {!loading && appealLetter && (
            <button
              onClick={copyLetter}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-800"
            >
              {copied
                ? <><CheckCircle className="w-3.5 h-3.5" /> Copied!</>
                : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          )}
        </div>

        {loading && !appealLetter && (
          <div className="flex items-center gap-3 p-4 bg-brand-50 border border-brand-100 rounded-xl">
            <Loader className="w-5 h-5 text-brand-500 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-brand-800">Writing your appeal letter…</p>
              <p className="text-xs text-brand-600 mt-0.5">This takes about 30 seconds.</p>
            </div>
          </div>
        )}

        {appealLetter && (
          <div className="p-4 bg-white border border-gray-200 rounded-xl max-h-96 overflow-y-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{appealLetter}</pre>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {!loading && appealLetter && (
          <>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-700">
                <strong>Before sending:</strong> Review and personalize this letter. Add your specific medical records,
                doctor&apos;s notes, and supporting documents. Keep a copy for your records.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyLetter}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50 transition-all"
              >
                <Copy className="w-4 h-4" /> Copy letter
              </button>
              <button
                onClick={saveAndTrack}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all"
              >
                Save & track <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Tracking step
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
        <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800">Appeal saved</p>
          <p className="text-xs text-green-700 mt-0.5">Your appeal letter is ready to send.</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What to do next</p>
        <div className="space-y-2">
          {[
            { n: '1', title: 'Gather supporting documents', detail: 'Collect medical records, doctor\'s notes, and lab results that support medical necessity.' },
            { n: '2', title: 'Send via certified mail or member portal', detail: 'Use the address on your denial letter. Keep a copy and get a tracking number or confirmation.' },
            { n: '3', title: 'Follow up in 30 days', detail: 'Plans must respond to internal appeals within 30–60 days. Follow up if you hear nothing.' },
            { n: '4', title: 'External review if denied again', detail: 'If your internal appeal is denied, you have the right to an independent external review under the ACA — free of charge.' },
          ].map(ns => (
            <div key={ns.n} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl">
              <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-brand-700">{ns.n}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{ns.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ns.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={reset}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
      >
        <FileText className="w-4 h-4" /> Start a new appeal
      </button>
    </div>
  )
}
