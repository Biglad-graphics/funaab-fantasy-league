import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav.jsx'
import Home from '../components/Home.jsx'
import Status from '../components/Status.jsx'
import PickTeam from '../components/PickTeam.jsx'
import Transfers from '../components/Transfers.jsx'

export default function Dashboard({ session }) {
  const [manager, setManager] = useState(null)
  const [activePage, setActivePage] = useState('home')
  const [darkMode, setDarkMode] = useState(true)

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

  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      <Nav
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />
      {activePage === 'home' && <Home />}
      {activePage === 'status' && <Status manager={manager} />}
      {activePage === 'pickteam' && <PickTeam session={session} />}
      {activePage === 'transfers' && <Transfers session={session} />}
    </>
  )
}
