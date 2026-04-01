import { useRef } from 'react'
import { useScroll, useTransform } from 'framer-motion'

export function useScrollReveal() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center start'] })
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])
  const y = useTransform(scrollYProgress, [0, 0.3], [40, 0])
  return { ref, opacity, y }
}
