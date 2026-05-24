import { useState } from 'react'
import Admin from '../components/Admin.jsx'
import Home from '../components/Home.jsx'
import Leaderboard from '../components/Leaderboard.jsx'
import MyTeam from '../components/MyTeam.jsx'

export default function Dashboard({ session, manager, onLogout, refetchManager }) {
  const [activePage, setActivePage] = useState('home')

  const pages = [
    { id: 'home', label: 'Home' },
    { id: 'fixtures', label: 'Fixtures' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'myteam', label: 'My Team' },
    { id: 'profile', label: 'Profile' },
    ...(manager?.is_admin ? [{ id: 'admin', label: '🔐 Admin' }] : [])
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#080C0A', color: '#E8F5E9', fontFamily: 'Bricolage Grotesque, sans-serif' }}>
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', background: 'rgba(8,12,10,0.97)', borderBottom: '1px solid #1E2E20', backdropFilter: 'blur(10px)' }}>
        <img src="/funaab-fantasy-league/logo.png" alt="FFL" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          {pages.map(p => (
            <button key={p.id} onClick={() => setActivePage(p.id)} style={{ background: activePage === p.id ? 'rgba(0,230,118,.09)' : 'transparent', border: activePage === p.id ? '1px solid #00E676' : '1px solid transparent', color: activePage === p.id ? '#00E676' : '#5A7A5E', padding: '.4rem .8rem', borderRadius: '6px', fontSize: '.72rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>
              {p.label}
            </button>
          ))}
          <button onClick={onLogout} style={{ background: '#00E676', border: 'none', color: '#080C0A', padding: '.4rem .8rem', borderRadius: '6px', fontSize: '.72rem', fontWeight: '800', letterSpacing: '1px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ paddingTop: '5rem', padding: '6rem 2rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        {activePage === 'home' && <Home manager={manager} />}
        {activePage === 'leaderboard' && <Leaderboard manager={manager} />}
        {activePage === 'admin' && manager?.is_admin && <Admin />}
        {activePage === 'myteam' && <MyTeam manager={manager} />}
        {!['home', 'admin'].includes(activePage) && (
          <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '2px', marginBottom: '.5rem' }}>COMING SOON</h2>
            <p style={{ color: '#5A7A5E', fontSize: '.88rem' }}>This section is being built.</p>
          </div>
        )}
      </div>
    </div>
  )
}
