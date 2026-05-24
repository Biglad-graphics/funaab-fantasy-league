import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080C0A', color: '#00E676', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', letterSpacing: '3px' }}>
      LOADING...
    </div>
  )

  // Not logged in
  if (!session) {
    if (page === 'register') return <Auth setPage={setPage} />
    if (page === 'login') return <Auth isLogin setPage={setPage} />
    return <Landing setPage={setPage} />
  }

  // Logged in but no manager profile yet → Payment page
  if (!manager) return <Payment session={session} onDone={() => fetchManager(session.user.id)} onLogout={logout} />

  // Payment pending
  if (manager.payment_status === 'pending') return <Pending manager={manager} onLogout={logout} />

  // Payment rejected
  if (manager.payment_status === 'rejected') return <Pending rejected manager={manager} onLogout={logout} />

  // First time — no team set up yet
  if (manager.is_new_user) return <Welcome manager={manager} onDone={() => fetchManager(session.user.id)} />

  // Fully confirmed
  return <Dashboard session={session} manager={manager} onLogout={logout} refetchManager={() => fetchManager(session.user.id)} />
}
