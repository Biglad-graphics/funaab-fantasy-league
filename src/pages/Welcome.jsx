import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Welcome({ manager, onDone }) {
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    if (!teamName) { setError('Enter a team name'); return }
    setLoading(true)
    const { error } = await supabase
      .from('managers')
      .update({ team_name: teamName, is_new_user: false })
      .eq('id', manager.id)
    if (error) { setError(error.message); setLoading(false); return }
    onDone()
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={{ fontSize: '3rem', textAlign: 'center' }}>🏆</div>
        <h1 style={styles.title}>WELCOME TO FFL!</h1>
        <p style={styles.sub}>Your account has been confirmed. Let's set up your fantasy team.</p>
        {error && <div style={styles.error}>{error}</div>}
        <input
          style={styles.input}
          placeholder="Enter your team name"
          value={teamName}
          onChange={e => setTeamName(e.target.value)}
        />
        <button style={styles.button} onClick={handleSave} disabled={loading}>
          {loading ? 'SAVING...' : 'CREATE MY TEAM →'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080C0A', padding: '2rem' },
  card: { background: '#0D1410', border: '1px solid #1E2E20', borderRadius: '16px', padding: '2.5rem 2rem', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' },
  title: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '3px', color: '#E8F5E9', textAlign: 'center' },
  sub: { color: '#5A7A5E', fontSize: '.88rem', textAlign: 'center', lineHeight: 1.7 },
  input: { padding: '.8rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '.88rem', outline: 'none', width: '100%' },
  button: { padding: '.9rem', borderRadius: '8px', background: '#00E676', color: '#080C0A', fontWeight: '800', fontSize: '.88rem', border: 'none', cursor: 'pointer', letterSpacing: '2px' },
  error: { color: '#EF9A9A', fontSize: '.78rem', textAlign: 'center', background: 'rgba(239,154,154,0.08)', border: '1px solid rgba(239,154,154,0.2)', padding: '.6rem', borderRadius: '7px' }
}
