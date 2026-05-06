'use client'
import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'

export default function NetworkStatusBadge() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="mx-2 mb-2 px-3 py-2 rounded-xl bg-green-50 border border-green-100">
      <div className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
        <Lock className="w-3 h-3 shrink-0" />
        <span>Local AI — your data stays on this device</span>
      </div>
      {!online && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 inline-block" />
          <span>Offline mode</span>
        </div>
      )}
    </div>
  )
}
