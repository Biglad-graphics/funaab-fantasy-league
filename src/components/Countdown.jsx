import { useState, useEffect } from 'react'

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatRemaining(ms) {
  if (ms <= 0) return null
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

/**
 * Live-ticking countdown to a target date, shown as HH:MM:SS.
 * Hours roll past 24 rather than switching to a "days" unit
 * (e.g. a 2-day-out match shows as 53:24:10).
 * Renders `prefix + time remaining`, or `expiredText` once the target has passed.
 */
export default function Countdown({ targetDate, prefix = '', expiredText = 'Closed' }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!targetDate) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!targetDate) return null

  const remaining = new Date(targetDate).getTime() - now
  const formatted = formatRemaining(remaining)

  if (!formatted) return <>{expiredText}</>
  return <>{prefix}{formatted}</>
}
