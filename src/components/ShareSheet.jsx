import { useState } from 'react'
import { useTheme } from '../lib/ThemeContext'

export default function ShareSheet({ message, onClose }) {
  const { c } = useTheme()
  const [copied, setCopied] = useState(false)
  const encoded = encodeURIComponent(message)

  const copyText = async () => {
    try { await navigator.clipboard.writeText(message) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001, background: c.surface, borderTop: `1px solid ${c.border}`, borderRadius: '16px 16px 0 0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '2px', textTransform: 'uppercase', color: c.text }}>Share with Friends</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: c.muted, fontSize: '1.2rem', cursor: 'pointer', padding: '.2rem .4rem' }}>✕</button>
        </div>

        {/* Message preview */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '.9rem', fontSize: '.8rem', color: c.muted, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
          {message}
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.7rem' }}>
          <a
            href={`https://wa.me/?text=${encoded}`}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', padding: '.9rem .5rem', borderRadius: '10px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', textDecoration: 'none' }}
          >
            <span style={{ fontSize: '1.4rem' }}>💬</span>
            <span style={{ fontSize: '.7rem', fontWeight: '800', color: '#25D366', letterSpacing: '.5px' }}>WhatsApp</span>
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encoded}`}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', padding: '.9rem .5rem', borderRadius: '10px', background: `rgba(${c.mutedRgb},0.06)`, border: `1px solid ${c.border}`, textDecoration: 'none' }}
          >
            <span style={{ fontSize: '1.4rem', fontWeight: '900', color: c.text, fontFamily: 'serif' }}>𝕏</span>
            <span style={{ fontSize: '.7rem', fontWeight: '800', color: c.muted, letterSpacing: '.5px' }}>Twitter</span>
          </a>

          <button
            onClick={copyText}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', padding: '.9rem .5rem', borderRadius: '10px', background: copied ? `rgba(${c.greenRgb},0.1)` : c.card, border: `1px solid ${copied ? c.green : c.border}`, cursor: 'pointer' }}
          >
            <span style={{ fontSize: '1.4rem' }}>{copied ? '✅' : '🔗'}</span>
            <span style={{ fontSize: '.7rem', fontWeight: '800', color: copied ? c.green : c.muted, letterSpacing: '.5px' }}>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </>
  )
}
