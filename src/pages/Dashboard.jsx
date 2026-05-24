import { useState } from 'react'
import Admin from '../components/Admin.jsx'
import Home from '../components/Home.jsx'

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
      {/* Nav */}
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

      {/* Content */}
      <div style={{ paddingTop: '5rem', padding: '6rem 2rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        {activePage === 'home' && <Home manager={manager} />}
            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '2px', marginBottom: '1.5rem' }}>
              Welcome, {manager?.team_name || manager?.full_name}!
            </h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Total Points', value: manager?.total_points ?? 0, color: '#00E676' },
                { label: 'Team Name', value: manager?.team_name || '—', color: '#E8F5E9' },
                { label: 'Free Transfers', value: manager?.free_transfers ?? 1, color: '#FFD700' },
                { label: 'Budget Left', value: `₦${manager?.budget ?? 100}M`, color: '#64B5F6' }
              ].map(s => (
                <div key={s.label} style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.2rem' }}>
                  <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '.4rem' }}>{s.label}</div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === 'admin' && manager?.is_admin && <Admin />}
      
  )
}
