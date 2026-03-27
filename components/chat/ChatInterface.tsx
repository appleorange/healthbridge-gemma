'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Trash2 } from 'lucide-react'
import type { UserProfile, ChatMessage } from '@/types'

interface Props {
  userProfile: UserProfile
  initialContext?: string
  autoSendPrompt?: string
  onAutoPromptSent?: () => void
}

const SUGGESTED_QUESTIONS = [
  'What does my deductible mean?',
  'When is open enrollment?',
  'Can I keep my doctor?',
  'What is a Special Enrollment Period?',
  'How do I appeal a denied claim?',
]

const STORAGE_KEY = 'hb_chat_messages'

function makeWelcome(userProfile: UserProfile): ChatMessage {
  return {
    id: '0',
    role: 'assistant',
    content: `Hi! I'm your HealthBridge navigator. I've already loaded your profile — I know you're ${formatStatus(userProfile.immigrationStatus)} living in ${userProfile.state || 'the US'}. Ask me anything about your health insurance options, coverage terms, or next steps.`,
    timestamp: new Date(),
  }
}

export default function ChatInterface({ userProfile, autoSendPrompt, onAutoPromptSent }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [makeWelcome(userProfile)]
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[]
        // Restore dates
        return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
      }
    } catch {
      // ignore parse errors
    }
    return [makeWelcome(userProfile)]
  })

  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Persist messages to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // ignore storage errors
    }
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const autoSentRef = useRef(false)
  useEffect(() => {
    if (autoSendPrompt && !autoSentRef.current) {
      autoSentRef.current = true
      sendMessage(autoSendPrompt)
      onAutoPromptSent?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSendPrompt])

  function clearHistory() {
    const welcome = makeWelcome(userProfile)
    setMessages([welcome])
    sessionStorage.removeItem(STORAGE_KEY)
  }

  async function sendMessage(text?: string) {
    const content = text || input.trim()
    if (!content || streaming) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }])

    try {
      const apiMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, userProfile }),
      })

      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: full } : m
        ))
      }
    } catch (e) {
      console.error(e)
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
          : m
      ))
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const hasUserMessages = messages.some(m => m.role === 'user')

  return (
    <div className="flex flex-col h-full">
      {/* Chat header with clear button */}
      {hasUserMessages && (
        <div className="flex items-center justify-end px-4 py-2 border-b border-gray-100">
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear history
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
              msg.role === 'assistant' ? 'bg-brand-100' : 'bg-gray-100'
            }`}>
              {msg.role === 'assistant'
                ? <Bot className="w-3.5 h-3.5 text-brand-600" />
                : <User className="w-3.5 h-3.5 text-gray-600" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'assistant'
                ? 'bg-white border border-gray-100 text-gray-800'
                : 'bg-brand-600 text-white'
            }`}>
              {msg.content || (
                <span className="flex gap-1 items-center text-gray-400">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions - only if no user messages yet */}
      {!hasUserMessages && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs bg-gray-50 hover:bg-brand-50 hover:text-brand-700 text-gray-600 border border-gray-200 hover:border-brand-200 px-3 py-1.5 rounded-full transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about your coverage..."
            className="flex-1 input-base resize-none text-sm py-2.5 min-h-[42px] max-h-32"
            style={{ height: 'auto' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            className="btn-primary py-2.5 px-4 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    us_citizen: 'a US Citizen',
    green_card: 'a Green Card holder',
    h1b: 'on an H-1B visa',
    h4: 'on an H-4 visa',
    f1_student: 'an F-1 student',
    f1_opt: 'on F-1 OPT',
    j1_scholar: 'a J-1 scholar',
    daca: 'a DACA recipient',
    refugee_asylee: 'a refugee or asylee',
    undocumented: 'currently undocumented',
  }
  return map[status] || 'on a visa'
}
