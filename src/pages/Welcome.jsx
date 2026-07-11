import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'

export default function Welcome({ manager, onDone }) {
  const { c } = useTheme()
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const styles = {
    wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, padding: '2rem' },
    card: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '2.5rem 2rem', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' },
    title: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '3px', color: c.text, textAlign: 'center' },
    sub: { color: c.muted, fontSize: '.88rem', textAlign: 'center', lineHeight: 1.7 },
    input: { padding: '.8rem 1rem', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: '.88rem', outline: 'none', width: '100%' },
    button: { padding: '.9rem', borderRadius: '8px', background: c.green, color: c.bg, fontWeight: '800', fontSize: '.88rem', border: 'none', cursor: 'pointer', letterSpacing: '2px' },
    error: { color: c.red, fontSize: '.78rem', textAlign: 'center', background: `rgba(${c.redRgb},0.08)`, border: `1px solid rgba(${c.redRgb},0.2)`, padding: '.6rem', borderRadius: '7px' }
  }

  const handleSave = async () => {
    if (!displayName) { setError('Enter a display name'); return }
    setLoading(true)
    const { error } = await supabase
      .from('managers')
      .update({ team_name: displayName, is_new_user: false })
      .eq('id', manager.id)
    if (error) { setError(error.message); setLoading(false); return }
    onDone()
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={{ fontSize: '3rem', textAlign: 'center' }}>🎯</div>
        <h1 style={styles.title}>WELCOME TO COLLEGIATE SUPER LEAGUE!</h1>
        <p style={styles.sub}>Your account is confirmed. Pick a display name — this is how you'll appear on the leaderboard.</p>
        {error && <div style={styles.error}>{error}</div>}
        <input
          style={styles.input}
          placeholder="Your display name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <button style={styles.button} onClick={handleSave} disabled={loading}>
          {loading ? 'SAVING...' : 'START PREDICTING →'}
        </button>
      </div>
    </div>
  )
}
