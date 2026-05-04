'use client'
import { Info } from 'lucide-react'

interface Props {
  text: string
  verifyUrl?: string
  verifyLabel?: string
}

export default function TrustBanner({ text, verifyUrl, verifyLabel = 'Verify →' }: Props) {
  return (
    <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span className="flex-1 leading-relaxed">{text}</span>
      {verifyUrl && (
        <a
          href={verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap ml-2"
        >
          {verifyLabel}
        </a>
      )}
    </div>
  )
}
