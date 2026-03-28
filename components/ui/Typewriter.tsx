'use client'
import { useEffect, useState } from 'react'

interface Props {
  text: string
  speed?: number
  delay?: number
  className?: string
  onComplete?: () => void
}

export default function Typewriter({
  text,
  speed = 18,
  delay = 300,
  className = '',
  onComplete,
}: Props) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (displayed.length >= text.length) {
      onComplete?.()
      return
    }
    const t = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1))
    }, speed)
    return () => clearTimeout(t)
  }, [started, displayed, text, speed, onComplete])

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  )
}
