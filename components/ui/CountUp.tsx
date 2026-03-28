'use client'
import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface Props {
  to: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export default function CountUp({
  to,
  duration = 1.2,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [value, setValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!isInView) return

    startTime.current = null

    function animate(ts: number) {
      if (startTime.current === null) startTime.current = ts
      const elapsed = (ts - startTime.current) / 1000
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(parseFloat((eased * to).toFixed(decimals)))
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate)
      } else {
        setValue(to)
      }
    }

    raf.current = requestAnimationFrame(animate)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [isInView, to, duration, decimals])

  return (
    <span ref={ref} className={className}>
      {prefix}{value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  )
}
