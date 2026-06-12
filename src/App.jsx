import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ThemeProvider } from './lib/ThemeContext'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Pending from './pages/Pending'
import Welcome from './pages/Welcome'
import Dashboard from './pages/Dashboard'
import Payment from './pages/Payment'

export default function App() {
  const [session, setSession] = useState(null)
  const [manager, setManager] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('landing')

  useEffect(() => {
    // Handle email confirmation redirect
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession(session)
          fetchManager(session.user.id)
        } else {
          setLoading(false)
        }
      })
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchManager(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (session) fetchManager(session.user.id)
      else { setManager(null); setLoading(false); setPage('landing') }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchManager = async (userId) => {
    try {
      const { data } = await supabase
        .from('managers')
        .select('*')
        .eq('id', userId)
        .single()
      setManager(data)
    } catch {
      setManager(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setPage('landing')
  }

  if (loading) return (
    <ThemeProvider>
      <style>{`
        @keyframes logoPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.12); opacity: 0.85; }
        }
        @keyframes spinRing {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080C0A', gap: '1.5rem' }}>
        <img
          src="/logo.png"
          alt="Loading"
          style={{ width: '80px', height: '80px', objectFit: 'contain', animation: 'logoPulse 1.6s ease-in-out infinite' }}
        />
        <div style={{ position: 'relative', width: '36px', height: '36px' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid rgba(0,230,118,0.15)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#00E676',
            animation: 'spinRing 0.9s linear infinite',
          }} />
        </div>
      </div>
    </ThemeProvider>
  )

  // Not logged in
  if (!session) {
    if (page === 'register') return <ThemeProvider><Auth setPage={setPage} /></ThemeProvider>
    if (page === 'login') return <ThemeProvider><Auth isLogin setPage={setPage} /></ThemeProvider>
    return <ThemeProvider><Landing setPage={setPage} /></ThemeProvider>
  }

  // Logged in but no manager profile yet → Payment page
  if (!manager) return <ThemeProvider><Payment session={session} onDone={() => fetchManager(session.user.id)} onLogout={logout} /></ThemeProvider>

  // Payment pending
  if (manager.payment_status === 'pending') return <ThemeProvider><Pending manager={manager} onLogout={logout} /></ThemeProvider>

  // Payment rejected
  if (manager.payment_status === 'rejected') return <ThemeProvider><Pending rejected manager={manager} onLogout={logout} /></ThemeProvider>

  // First time — no team set up yet
  if (manager.is_new_user) return <ThemeProvider><Welcome manager={manager} onDone={() => fetchManager(session.user.id)} /></ThemeProvider>

  // Fully confirmed
  return <ThemeProvider><Dashboard session={session} manager={manager} onLogout={logout} refetchManager={() => fetchManager(session.user.id)} /></ThemeProvider>
}
