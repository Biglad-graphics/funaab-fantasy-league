import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Pending from './pages/Pending'

function App() {
  const [session, setSession] = useState(null)
  const [manager, setManager] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  const fetchManager = async (userId) => {
    const { data } = await supabase
      .from('managers')
      .select('*')
      .eq('id', userId)
      .single()
    setManager(data || null)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchManager(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchManager(session.user.id)
      else { setManager(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080C0A', color: '#00E676', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', letterSpacing: '3px' }}>
      LOADING...
    </div>
  )

  if (!session) {
    if (showAuth) return <Auth onBack={() => setShowAuth(false)} />
    return <Landing onJoin={() => setShowAuth(true)} />
  }

  if (!manager) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080C0A', color: '#5A7A5E', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '3px' }}>
      SETTING UP YOUR ACCOUNT...
    </div>
  )

  if (manager.payment_status === 'pending') {
    return <Pending onLogout={() => supabase.auth.signOut()} />
  }

  if (manager.payment_status === 'rejected') {
    return <Pending rejected onLogout={() => supabase.auth.signOut()} />
  }

  return <Dashboard session={session} manager={manager} />
}

export default App
