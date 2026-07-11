import { useState, useEffect } from 'react'

function formatRemaining(ms) {
  if (ms <= 0) return null
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

/**
 * Live-ticking countdown to a target date.
 * Renders `prefix + time remaining`, or `expiredText` once the target has passed.
 * Ticks every second while under an hour remains, otherwise every 30s (cheaper re-renders).
 */
export default function Countdown({ targetDate, prefix = '', expiredText = 'Closed' }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!targetDate) return
    const remaining = new Date(targetDate).getTime() - Date.now()
    const tickMs = remaining < 60 * 60 * 1000 ? 1000 : 30000
    const id = setInterval(() => setNow(Date.now()), tickMs)
    return () => clearInterval(id)
  }, [targetDate, now])

  if (!targetDate) return null

  const remaining = new Date(targetDate).getTime() - now
  const formatted = formatRemaining(remaining)

  if (!formatted) return <>{expiredText}</>
  return <>{prefix}{formatted}</>
}
