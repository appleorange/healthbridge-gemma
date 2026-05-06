'use client'
import type { Language } from '@/lib/i18n/es'

interface Props {
  lang: Language
  onChange: (lang: Language) => void
}

export default function LanguageToggle({ lang, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
      {(['en', 'es'] as Language[]).map(l => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`px-2.5 py-1 rounded-md transition-all ${
            lang === l
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
