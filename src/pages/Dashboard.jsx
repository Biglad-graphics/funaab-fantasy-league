import { useState } from 'react'
import Admin from '../components/Admin.jsx'
import Home from '../components/Home.jsx'
import Leaderboard from '../components/Leaderboard.jsx'
import MyTeam from '../components/MyTeam.jsx'
import Fixtures from '../components/Fixtures.jsx'
import Profile from '../components/Profile.jsx'
import Players from '../components/Players.jsx'

export default function Dashboard({ session, manager, onLogout, refetchManager, isDark, setIsDark }) {
  const [activePage, setActivePage] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

  const theme = {
    dark: {
      bg: '#080C0A',
      card: '#111A13',
      border: '#1E2E20',
      text: '#E8F5E9',
      muted: '#5A7A5E',
      primary: '#00E676',
      navBg: 'rgba(8,12,10,0.97)',
      hoverBg: 'rgba(0,230,118,.09)'
    },
    light: {
      bg: '#F5F5F5',
      card: '#FFFFFF',
      border: '#E0E0E0',
      text: '#1a1a1a',
      muted: '#666666',
      primary: '#00AA55',
      navBg: 'rgba(245,245,245,0.97)',
      hoverBg: 'rgba(0,170,85,0.09)'
    }
  }

  const currentTheme = isDark ? theme.dark : theme.light

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
    <div style={{ minHeight: '100vh', background: currentTheme.bg, color: currentTheme.text, fontFamily: 'Bricolage Grotesque, sans-serif', transition: 'all 0.3s ease' }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: currentTheme.navBg, borderBottom: `1px solid ${currentTheme.border}`, backdropFilter: 'blur(10px)', transition: 'all 0.3s ease' }}>
        <img src="/funaab-fantasy-league/logo.png" alt="FFL" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }} className="desktop-nav">
          {pages.map(p => (
            <button 
              key={p.id} 
              onClick={() => navigate(p.id)} 
              style={{ 
                background: activePage === p.id ? currentTheme.hoverBg : 'transparent', 
                border: activePage === p.id ? `1px solid ${currentTheme.primary}` : '1px solid transparent', 
                color: activePage === p.id ? currentTheme.primary : currentTheme.muted, 
                padding: '.4rem .8rem', 
                borderRadius: '6px', 
                fontSize: '.72rem', 
                fontWeight: '700', 
                letterSpacing: '1px', 
                textTransform: 'uppercase', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {p.label}
            </button>
          ))}
          
          {/* Theme toggle */}
          <button 
            onClick={() => setIsDark(!isDark)}
            style={{ 
              background: 'transparent', 
              border: `1px solid ${currentTheme.border}`, 
              color: currentTheme.text,
              padding: '.4rem .8rem', 
              borderRadius: '6px', 
              fontSize: '1rem',
              cursor: 'pointer',
              marginLeft: '.5rem',
              transition: 'all 0.2s'
            }}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          <button 
            onClick={onLogout} 
            style={{ 
              background: currentTheme.primary, 
              border: 'none', 
              color: isDark ? '#080C0A' : '#FFFFFF', 
              padding: '.4rem .8rem', 
              borderRadius: '6px', 
              fontSize: '.72rem', 
              fontWeight: '800', 
              letterSpacing: '1px', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Logout
          </button>
        </div>

        {/* Hamburger */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          style={{ 
            background: 'transparent', 
            border: `1px solid ${currentTheme.border}`, 
            borderRadius: '8px', 
            padding: '.5rem .7rem', 
            cursor: 'pointer', 
            display: 'none' 
          }} 
          className="hamburger"
        >
          <div style={{ width: '18px', height: '2px', background: currentTheme.text, marginBottom: '4px', borderRadius: '2px' }} />
          <div style={{ width: '18px', height: '2px', background: currentTheme.text, marginBottom: '4px', borderRadius: '2px' }} />
          <div style={{ width: '18px', height: '2px', background: currentTheme.text, borderRadius: '2px' }} />
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: '65px', left: 0, right: 0, background: currentTheme.navBg, borderBottom: `1px solid ${currentTheme.border}`, zIndex: 199, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.4rem', transition: 'all 0.3s ease' }}>
          {pages.map(p => (
            <button 
              key={p.id} 
              onClick={() => navigate(p.id)} 
              style={{ 
                background: activePage === p.id ? currentTheme.hoverBg : 'transparent', 
                border: activePage === p.id ? `1px solid ${currentTheme.primary}` : `1px solid ${currentTheme.border}`, 
                color: activePage === p.id ? currentTheme.primary : currentTheme.text, 
                padding: '.8rem 1rem', 
                borderRadius: '8px', 
                fontSize: '.88rem', 
                fontWeight: '700', 
                cursor: 'pointer', 
                textAlign: 'left', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '.6rem',
                transition: 'all 0.2s'
              }}
            >
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
          
          {/* Theme toggle in mobile menu */}
          <button 
            onClick={() => {
              setIsDark(!isDark)
              setMenuOpen(false)
            }}
            style={{ 
              background: currentTheme.hoverBg, 
              border: `1px solid ${currentTheme.primary}`, 
              color: currentTheme.primary,
              padding: '.8rem 1rem', 
              borderRadius: '8px', 
              fontSize: '.88rem', 
              fontWeight: '700', 
              cursor: 'pointer', 
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '.6rem',
              transition: 'all 0.2s'
            }}
          >
            <span>{isDark ? '☀️' : '🌙'}</span> {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button 
            onClick={onLogout} 
            style={{ 
              background: currentTheme.primary, 
              border: 'none', 
              color: isDark ? '#080C0A' : '#FFFFFF', 
              padding: '.8rem 1rem', 
              borderRadius: '8px', 
              fontSize: '.88rem', 
              fontWeight: '800', 
              cursor: 'pointer', 
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            🚪 Logout
          </button>
        </div>
      )}

      {/* Bottom nav for mobile */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: currentTheme.navBg, borderTop: `1px solid ${currentTheme.border}`, display: 'flex', justifyContent: 'space-around', padding: '.5rem 0', transition: 'all 0.3s ease' }} className="bottom-nav">
        {pages.filter(p => p.id !== 'admin').map(p => (
          <button 
            key={p.id} 
            onClick={() => navigate(p.id)} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: activePage === p.id ? currentTheme.primary : currentTheme.muted, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '.2rem', 
              cursor: 'pointer', 
              padding: '.3rem .5rem', 
              borderRadius: '8px', 
              fontSize: '.6rem', 
              fontWeight: '700', 
              letterSpacing: '.5px', 
              textTransform: 'uppercase',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
        {manager?.is_admin && (
          <button 
            onClick={() => navigate('admin')} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: activePage === 'admin' ? currentTheme.primary : currentTheme.muted, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '.2rem', 
              cursor: 'pointer', 
              padding: '.3rem .5rem', 
              borderRadius: '8px', 
              fontSize: '.6rem', 
              fontWeight: '700', 
              letterSpacing: '.5px', 
              textTransform: 'uppercase',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🔐</span>
            Admin
          </button>
        )}
        {/* Theme toggle in bottom nav */}
        <button 
          onClick={() => setIsDark(!isDark)}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: currentTheme.muted, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '.2rem', 
            cursor: 'pointer', 
            padding: '.3rem .5rem', 
            borderRadius: '8px', 
            fontSize: '.6rem', 
            fontWeight: '700', 
            letterSpacing: '.5px', 
            textTransform: 'uppercase',
            transition: 'all 0.2s'
          }}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
          <span style={{ fontSize: '1.2rem' }}>{isDark ? '☀️' : '🌙'}</span>
          {isDark ? 'Light' : 'Dark'}
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '5.5rem 1.5rem 5rem', maxWidth: '1100px', margin: '0 auto' }}>
        {activePage === 'home' && <Home manager={manager} isDark={isDark} />}
        {activePage === 'fixtures' && <Fixtures isDark={isDark} />}
        {activePage === 'leaderboard' && <Leaderboard manager={manager} isDark={isDark} />}
        {activePage === 'myteam' && <MyTeam manager={manager} isDark={isDark} />}
        {activePage === 'profile' && <Profile manager={manager} isDark={isDark} onUpdate={refetchManager} onLogout={onLogout} />}
        {activePage === 'admin' && manager?.is_admin && <Admin isDark={isDark} />}
        {activePage === 'players' && <Players isDark={isDark} />}
      </div>
    </div>
  )
          }
