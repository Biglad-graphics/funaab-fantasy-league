import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import Home from '../components/Home'
import Status from '../components/Status'
import PickTeam from '../components/PickTeam'
import Transfers from '../components/Transfers'

export default function Dashboard({ session }) {
  const [manager, setManager] = useState(null)
  const [activePage, setActivePage] = useState('home')

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
    <>
      <Nav
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
      />
      {activePage === 'home' && <Home />}
      {activePage === 'status' && <Status manager={manager} />}
      {activePage === 'pickteam' && <PickTeam session={session} />}
      {activePage === 'transfers' && <Transfers session={session} />}
    </>
  )
}
