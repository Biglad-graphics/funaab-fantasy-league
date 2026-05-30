import { useState } from 'react'
import Admin from '../components/Admin.jsx'
import Home from '../components/Home.jsx'
import Leaderboard from '../components/Leaderboard.jsx'
import MyTeam from '../components/MyTeam.jsx'
import Fixtures from '../components/Fixtures.jsx'
import Profile from '../components/Profile.jsx'
import Players from '../components/Players.jsx'

export default function Dashboard({ session, manager, onLogout, refetchManager }) {
  const [activePage, setActivePage] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

  const pages = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'fixtures', label: 'Fixtures', icon: '📅' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'myteam', label: 'My Team', icon: '⚽' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'players', label: 'Players', icon: '📊' },
    ...(manager?.is_admin ? [{ id: 'admin', label: 'Admin', icon: '🔐' }] : [])
  ]

  const navigate = (id) => {
    setActivePage(id)
    setMenuOpen(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080C0A', color: '#E8F5E9', fontFamily: 'Bricolage Grotesque, sans-serif' }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'rgba(8,12,10,0.97)', borderBottom: '1px solid #1E2E20', backdropFilter: 'blur(10px)' }}>
        <img src="/logo.png" alt="FFL" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', '@media(maxWidth:640px)': { display: 'none' } }} className="desktop-nav">
          {pages.map(p => (
            <button key={p.id} onClick={() => navigate(p.id)} style={{ background: activePage === p.id ? 'rgba(0,230,118,.09)' : 'transparent', border: activePage === p.id ? '1px solid #00E676' : '1px solid transparent', color: activePage === p.id ? '#00E676' : '#5A7A5E', padding: '.4rem .8rem', borderRadius: '6px', fontSize: '.72rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>
              {p.label}
            </button>
          ))}
          <button onClick={onLogout} style={{ background: '#00E676', border: 'none', color: '#080C0A', padding: '.4rem .8rem', borderRadius: '6px', fontSize: '.72rem', fontWeight: '800', letterSpacing: '1px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>

        {/* Hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: '1px solid #1E2E20', borderRadius: '8px', padding: '.5rem .7rem', cursor: 'pointer', display: 'none' }} className="hamburger">
          <div style={{ width: '18px', height: '2px', background: '#E8F5E9', marginBottom: '4px', borderRadius: '2px' }} />
          <div style={{ width: '18px', height: '2px', background: '#E8F5E9', marginBottom: '4px', borderRadius: '2px' }} />
          <div style={{ width: '18px', height: '2px', background: '#E8F5E9', borderRadius: '2px' }} />
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: '65px', left: 0, right: 0, background: 'rgba(8,12,10,0.99)', borderBottom: '1px solid #1E2E20', zIndex: 199, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          {pages.map(p => (
            <button key={p.id} onClick={() => navigate(p.id)} style={{ background: activePage === p.id ? 'rgba(0,230,118,.09)' : 'transparent', border: activePage === p.id ? '1px solid #00E676' : '1px solid #1E2E20', color: activePage === p.id ? '#00E676' : '#E8F5E9', padding: '.8rem 1rem', borderRadius: '8px', fontSize: '.88rem', fontWeight: '700', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
          <button onClick={onLogout} style={{ background: '#00E676', border: 'none', color: '#080C0A', padding: '.8rem 1rem', borderRadius: '8px', fontSize: '.88rem', fontWeight: '800', cursor: 'pointer', textAlign: 'left' }}>
            🚪 Logout
          </button>
        </div>
      )}

      {/* Bottom nav for mobile */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(8,12,10,0.97)', borderTop: '1px solid #1E2E20', display: 'flex', justifyContent: 'space-around', padding: '.5rem 0' }} className="bottom-nav">
        {pages.filter(p => p.id !== 'admin').map(p => (
          <button key={p.id} onClick={() => navigate(p.id)} style={{ background: 'transparent', border: 'none', color: activePage === p.id ? '#00E676' : '#5A7A5E', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.2rem', cursor: 'pointer', padding: '.3rem .5rem', borderRadius: '8px', fontSize: '.6rem', fontWeight: '700', letterSpacing: '.5px', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
        {manager?.is_admin && (
          <button onClick={() => navigate('admin')} style={{ background: 'transparent', border: 'none', color: activePage === 'admin' ? '#00E676' : '#5A7A5E', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.2rem', cursor: 'pointer', padding: '.3rem .5rem', borderRadius: '8px', fontSize: '.6rem', fontWeight: '700', letterSpacing: '.5px', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '1.2rem' }}>🔐</span>
            Admin
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '5.5rem 1.5rem 5rem', maxWidth: '1100px', margin: '0 auto' }}>
        {activePage === 'home' && <Home manager={manager} />}
        {activePage === 'fixtures' && <Fixtures />}
        {activePage === 'leaderboard' && <Leaderboard manager={manager} />}
        {activePage === 'myteam' && <MyTeam manager={manager} />}
        {activePage === 'profile' && <Profile manager={manager} onUpdate={refetchManager} onLogout={onLogout} />}
        {activePage === 'admin' && manager?.is_admin && <Admin />}
        {activePage === 'players' && <Players />}
      </div>
    </div>
  )
                   }
