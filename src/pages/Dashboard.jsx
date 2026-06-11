import { useState } from 'react'
import { useTheme } from '../lib/ThemeContext'
import Admin from '../components/Admin.jsx'
import Home from '../components/Home.jsx'
import Leaderboard from '../components/Leaderboard.jsx'
import Predictions from '../components/Predictions.jsx'
import Profile from '../components/Profile.jsx'

export default function Dashboard({ session, manager, onLogout, refetchManager }) {
  const { theme, c, toggle } = useTheme()
  const [activePage, setActivePage] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

  const pages = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'predictions', label: 'Predict', icon: '🎯' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    ...(manager?.is_admin ? [{ id: 'admin', label: 'Admin', icon: '🔐' }] : [])
  ]

  const navigate = (id) => {
    setActivePage(id)
    setMenuOpen(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: 'Bricolage Grotesque, sans-serif' }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: c.navBg, borderBottom: `1px solid ${c.border}`, backdropFilter: 'blur(10px)' }}>
        <img src="/logo.png" alt="Funaabsu League Prediction" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }} className="desktop-nav">
          {pages.map(p => (
            <button key={p.id} onClick={() => navigate(p.id)} style={{ background: activePage === p.id ? `rgba(${c.greenRgb},0.09)` : 'transparent', border: activePage === p.id ? `1px solid ${c.green}` : '1px solid transparent', color: activePage === p.id ? c.green : c.muted, padding: '.4rem .8rem', borderRadius: '6px', fontSize: '.72rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>
              {p.label}
            </button>
          ))}
          <button onClick={toggle} style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.muted, padding: '.4rem .6rem', borderRadius: '6px', fontSize: '.88rem', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={onLogout} style={{ background: c.green, border: 'none', color: c.bg, padding: '.4rem .8rem', borderRadius: '6px', fontSize: '.72rem', fontWeight: '800', letterSpacing: '1px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>

        {/* Hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: `1px solid ${c.border}`, borderRadius: '8px', padding: '.5rem .7rem', cursor: 'pointer', display: 'none' }} className="hamburger">
          <div style={{ width: '18px', height: '2px', background: c.text, marginBottom: '4px', borderRadius: '2px' }} />
          <div style={{ width: '18px', height: '2px', background: c.text, marginBottom: '4px', borderRadius: '2px' }} />
          <div style={{ width: '18px', height: '2px', background: c.text, borderRadius: '2px' }} />
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: '65px', left: 0, right: 0, background: c.menuBg, borderBottom: `1px solid ${c.border}`, zIndex: 199, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          {pages.map(p => (
            <button key={p.id} onClick={() => navigate(p.id)} style={{ background: activePage === p.id ? `rgba(${c.greenRgb},0.09)` : 'transparent', border: activePage === p.id ? `1px solid ${c.green}` : `1px solid ${c.border}`, color: activePage === p.id ? c.green : c.text, padding: '.8rem 1rem', borderRadius: '8px', fontSize: '.88rem', fontWeight: '700', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
          <button onClick={toggle} style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.muted, padding: '.8rem 1rem', borderRadius: '8px', fontSize: '.88rem', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}>
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button onClick={onLogout} style={{ background: c.green, border: 'none', color: c.bg, padding: '.8rem 1rem', borderRadius: '8px', fontSize: '.88rem', fontWeight: '800', cursor: 'pointer', textAlign: 'left' }}>
            🚪 Logout
          </button>
        </div>
      )}

      {/* Bottom nav for mobile */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: c.navBg, borderTop: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-around', padding: '.5rem 0' }} className="bottom-nav">
        {pages.filter(p => p.id !== 'admin').map(p => (
          <button key={p.id} onClick={() => navigate(p.id)} style={{ background: 'transparent', border: 'none', color: activePage === p.id ? c.green : c.muted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.2rem', cursor: 'pointer', padding: '.3rem .5rem', borderRadius: '8px', fontSize: '.6rem', fontWeight: '700', letterSpacing: '.5px', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
        {manager?.is_admin && (
          <button onClick={() => navigate('admin')} style={{ background: 'transparent', border: 'none', color: activePage === 'admin' ? c.green : c.muted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.2rem', cursor: 'pointer', padding: '.3rem .5rem', borderRadius: '8px', fontSize: '.6rem', fontWeight: '700', letterSpacing: '.5px', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '1.2rem' }}>🔐</span>
            Admin
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '5.5rem 1.5rem 5rem', maxWidth: '1100px', margin: '0 auto' }}>
        {activePage === 'home' && <Home manager={manager} navigate={navigate} />}
        {activePage === 'predictions' && <Predictions manager={manager} />}
        {activePage === 'leaderboard' && <Leaderboard manager={manager} />}
        {activePage === 'profile' && <Profile manager={manager} onUpdate={refetchManager} onLogout={onLogout} />}
        {activePage === 'admin' && manager?.is_admin && <Admin />}
      </div>
    </div>
  )
}
