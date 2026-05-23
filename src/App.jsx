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
    let data = null
    let attempts = 0
    while (!data && attempts < 5) {
      const { data: result } = await supabase
        .from('managers')
        .select('*')
        .eq('id', userId)
        .single()
      if (result) { data = result; break }
      attempts++
      await new Promise(r => setTimeout(r, 1500))
    }
    if (!data) {
      await supabase.auth.signOut()
      return
    }
    setManager(data)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080C0A', color: '#00E676', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', letterSpacing: '3px' }}>
      LOADING...
    </div>
  )

  if (!session) {
    if (showAuth) return <Auth onBack={() => setShowAuth(false)} />
    return <Landing onJoin={() => setShowAuth(true)} />
  }

  if (manager?.payment_status === 'pending') {
    return <Pending onLogout={() => supabase.auth.signOut()} />
  }

  if (manager?.payment_status === 'rejected') {
    return <Pending rejected onLogout={() => supabase.auth.signOut()} />
  }

  return <Dashboard session={session} manager={manager} />
}

export default App
