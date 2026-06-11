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
        }
      })
      // Clean URL
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
    const { data } = await supabase
      .from('managers')
      .select('*')
      .eq('id', userId)
      .single()
    setManager(data)
    setLoading(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setPage('landing')
  }

  if (loading) return (
    <ThemeProvider>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)', color: '#00E676', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', letterSpacing: '3px' }}>
        LOADING...
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
