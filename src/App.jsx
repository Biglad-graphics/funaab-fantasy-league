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

  const fetchManager = async (userId) => {
    const { data } = await supabase
      .from('managers')
      .select('*')
      .eq('id', userId)
      .single()
    setManager(data)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080C0A', color: '#00E676', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', letterSpacing: '3px' }}>
      LOADING...
    </div>
  )

  // Not logged in
  if (!session) {
    if (showAuth) return <Auth onBack={() => setShowAuth(false)} />
    return <Landing onJoin={() => setShowAuth(true)} />
  }

  // Logged in but payment pending
  if (manager?.payment_status === 'pending') {
    return <Pending onLogout={() => supabase.auth.signOut()} />
  }

  // Logged in but payment rejected
  if (manager?.payment_status === 'rejected') {
    return <Pending rejected onLogout={() => supabase.auth.signOut()} />
  }

  // Fully confirmed
  return <Dashboard session={session} manager={manager} />
}

export default App
