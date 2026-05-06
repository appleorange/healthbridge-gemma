'use client'
import { useState, useEffect } from 'react'
import type { Language } from '@/lib/i18n/es'

const STORAGE_KEY = 'hb_lang'

export function useLanguage(): [Language, (lang: Language) => void] {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored === 'es') setLangState('es')
    } catch {}
  }, [])

  function setLang(l: Language) {
    setLangState(l)
    try {
      sessionStorage.setItem(STORAGE_KEY, l)
    } catch {}
  }

  return [lang, setLang]
}
