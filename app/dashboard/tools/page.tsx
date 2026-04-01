'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, FileText, Scale } from 'lucide-react'
import ChatInterface from '@/components/chat/ChatInterface'
import DocumentHub from '@/components/documents/DocumentHub'
import AppealAssistant from '@/components/appeals/AppealAssistant'
import type { UserProfile, EligibilityResult, ParsedDocument } from '@/types'

type ToolsTab = 'chat' | 'documents' | 'appeals'

const SUB_TABS: { id: ToolsTab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: 'chat', icon: MessageCircle, label: 'AI Navigator' },
  { id: 'documents', icon: FileText, label: 'Documents' },
  { id: 'appeals', icon: Scale, label: 'Appeals' },
]

export default function ToolsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null)
  const [tab, setTab] = useState<ToolsTab>('chat')
  const [chatAutoPrompt, setChatAutoPrompt] = useState<string | undefined>(undefined)

  const [documents, setDocuments] = useState<ParsedDocument[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(sessionStorage.getItem('hb_documents') ?? '[]') } catch { return [] }
  })

  useEffect(() => {
    const p = sessionStorage.getItem('hb_profile')
    const e = sessionStorage.getItem('hb_eligibility')
    if (!p || !e) { router.push('/onboarding'); return }
    setProfile(JSON.parse(p))
    setEligibility(JSON.parse(e))

    // Restore pending auto-prompt from sessionStorage
    const prompt = sessionStorage.getItem('hb_chat_prompt')
    if (prompt) {
      setChatAutoPrompt(prompt)
      sessionStorage.removeItem('hb_chat_prompt')
    }
  }, [router])

  useEffect(() => {
    sessionStorage.setItem('hb_documents', JSON.stringify(documents))
  }, [documents])

  function handleDenialDetected(denial: { planName: string; denialReason: string; denialDate: string; serviceDescription: string }) {
    try { sessionStorage.setItem('hb_pending_denial', JSON.stringify(denial)) } catch {}
    setTab('appeals')
  }

  if (!profile || !eligibility) {
    return (
      <div className="min-h-full flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${tab === 'chat' ? 'h-full' : ''}`}>
      {/* Sub-tab bar */}
      <div className="bg-white border-b border-gray-100 px-4 sticky top-0 z-10">
        <div className="flex gap-0 max-w-2xl mx-auto">
          {SUB_TABS.map(st => (
            <button
              key={st.id}
              onClick={() => setTab(st.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-all ${
                tab === st.id
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <st.icon className="w-3.5 h-3.5" />
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'chat' && (
        <div className="flex-1 flex flex-col" style={{ height: 'calc(100dvh - 120px)' }}>
          <ChatInterface
            userProfile={profile}
            autoSendPrompt={chatAutoPrompt}
            onAutoPromptSent={() => setChatAutoPrompt(undefined)}
          />
        </div>
      )}

      {tab === 'documents' && (
        <div className="max-w-2xl mx-auto px-6 py-8 w-full">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Documents</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload insurance cards, EOBs, or plan summaries. The AI extracts key details, deadlines, and flags potential issues.
          </p>
          <DocumentHub
            userProfile={profile}
            documents={documents}
            onDocumentsChange={setDocuments}
            onDenialDetected={handleDenialDetected}
          />
        </div>
      )}

      {tab === 'appeals' && (
        <div className="max-w-2xl mx-auto px-6 py-8 w-full">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-4 h-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Appeal Assistant</h2>
          </div>
          <AppealAssistant userProfile={profile} eligibilityResult={eligibility} />
        </div>
      )}
    </div>
  )
}
