'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ChevronRight, ChevronLeft } from 'lucide-react'
import { ONBOARDING_STEPS, US_STATES } from '@/lib/eligibility/onboarding-steps'
import type { UserProfile } from '@/types'

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    householdSize: 1,
    annualIncome: 0,
    age: 25,
    hasEmployerInsurance: false,
    isStudent: false,
    currentlyInsured: false,
    hasDependents: false,
  })
  const [loading, setLoading] = useState(false)

  const step = ONBOARDING_STEPS[currentStep]
  const isLast = currentStep === ONBOARDING_STEPS.length - 1

  // Filter fields based on showWhen conditions
  const visibleFields = step.fields.filter(field => {
    if (!field.showWhen) return true
    return (profile as Record<string, unknown>)[field.showWhen.field] === field.showWhen.value
  })

  // Deduplicate fields with same id that are both visible (e.g. employerName for ft and pt)
  const seen = new Set<string>()
  const deduplicatedFields = visibleFields.filter(field => {
    const key = field.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  function update(field: string, value: unknown) {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  async function handleNext() {
    if (isLast) {
      setLoading(true)
      try {
        const res = await fetch('/api/eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile }),
        })
        const result = await res.json()
        sessionStorage.setItem('hb_profile', JSON.stringify(profile))
        sessionStorage.setItem('hb_eligibility', JSON.stringify(result))
        // Clear old chat history when starting fresh
        sessionStorage.removeItem('hb_chat_messages')
        router.push('/dashboard')
      } catch (e) {
        console.error(e)
        setLoading(false)
      }
    } else {
      setCurrentStep(s => s + 1)
    }
  }

  function handleBack() {
    if (currentStep === 0) router.push('/')
    else setCurrentStep(s => s - 1)
  }

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
          <Shield className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-semibold text-gray-900">HealthBridge</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-1 bg-brand-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Step counter */}
          <p className="text-sm text-gray-400 mb-2">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </p>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h1>
          <p className="text-gray-500 mb-8">{step.subtitle}</p>

          {/* Fields */}
          <div className="space-y-6">
            {deduplicatedFields.map(field => (
              <div key={field.id + (field.showWhen ? JSON.stringify(field.showWhen) : '')}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {field.label}
                  {!field.required && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
                </label>

                {field.type === 'select' && (
                  <div className="space-y-2">
                    {field.options?.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => update(field.id, opt.value)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          (profile as Record<string, unknown>)[field.id] === opt.value
                            ? 'border-brand-500 bg-brand-50 text-brand-800'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-sm">{opt.label}</div>
                        {opt.description && (
                          <div className="text-xs text-gray-400 mt-0.5">{opt.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {field.type === 'state_select' && (
                  <select
                    className="input-base"
                    value={(profile as Record<string, unknown>)[field.id] as string || ''}
                    onChange={e => update(field.id, e.target.value)}
                  >
                    <option value="">Select your state...</option>
                    {US_STATES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                )}

                {field.type === 'text' && (
                  <input
                    type="text"
                    className="input-base"
                    placeholder={field.placeholder}
                    value={(profile as Record<string, unknown>)[field.id] as string || ''}
                    onChange={e => update(field.id, e.target.value)}
                  />
                )}

                {field.type === 'multiselect' && (
                  <div className="flex flex-wrap gap-2">
                    {field.options?.map(opt => {
                      const current = ((profile as Record<string, unknown>)[field.id] as string[]) || []
                      const selected = current.includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            const next = selected
                              ? current.filter(v => v !== opt.value)
                              : [...current, opt.value]
                            update(field.id, next)
                          }}
                          className={`text-left px-3 py-2 rounded-xl border transition-all text-sm ${
                            selected
                              ? 'border-brand-500 bg-brand-50 text-brand-800'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    className="input-base"
                    placeholder={field.placeholder}
                    value={(profile as Record<string, unknown>)[field.id] as number || ''}
                    onChange={e => update(field.id, Number(e.target.value))}
                  />
                )}

                {field.type === 'toggle' && (
                  <div className="flex items-center gap-3">
                    {['Yes', 'No'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => update(field.id, opt === 'Yes')}
                        className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${
                          (profile as Record<string, unknown>)[field.id] === (opt === 'Yes')
                            ? 'border-brand-500 bg-brand-50 text-brand-800'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {field.helpText && (
                  <p className="text-xs text-gray-400 mt-2">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-10">
            <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Analyzing your profile...</span>
              ) : isLast ? (
                <>See my options <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Continue <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
