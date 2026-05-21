import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ session }) {
  const [manager, setManager] = useState(null)

  useEffect(() => {
    const fetchManager = async () => {
      const { data } = await supabase
        .from('managers')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setManager(data)
    }
    fetchManager()
  }, [session])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>⚽ Funaab Fantasy League</h1>
        <button style={styles.logout} onClick={handleLogout}>Logout</button>
      </div>

      {manager && (
        <div style={styles.welcome}>
          <h2>Welcome, {manager.display_name} 👋</h2>
          <p style={styles.sub}>Points: {manager.total_points} | {manager.department}</p>
        </div>
      )}

      <div style={styles.grid}>
        <div style={styles.card}>🧑‍💼 My Squad</div>
        <div style={styles.card}>🏆 Leaderboard</div>
        <div style={styles.card}>📅 Fixtures</div>
        <div style={styles.card}>🔄 Transfers</div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0f1e',
    padding: '1.5rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  title: {
    fontSize: '1.3rem',
    color: '#ffffff'
  },
  logout: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    background: '#dc2626',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer'
  },
  welcome: {
    background: '#111827',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '1.5rem'
  },
  sub: {
    color: '#9ca3af',
    marginTop: '0.5rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  card: {
    background: '#111827',
    padding: '2rem 1rem',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '1rem',
    color: '#ffffff',
    cursor: 'pointer'
  }
          }
