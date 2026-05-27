import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Landing({ setPage }) {
  const [matches, setMatches] = useState([])

  useEffect(() => {
    const fetchMatches = async () => {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .order('matchday', { ascending: false })
        .limit(10)
      setMatches(data || [])
    }
    fetchMatches()

    const channel = supabase
      .channel('landing-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#080C0A', color: '#E8F5E9', fontFamily: 'Bricolage Grotesque, sans-serif' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', background: 'rgba(8,12,10,0.97)', borderBottom: '1px solid #1E2E20', backdropFilter: 'blur(10px)' }}>
        <img src="/logo.png" alt="FFL" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button onClick={() => setPage('login')} style={{ background: 'transparent', border: '1px solid #1E2E20', color: '#E8F5E9', padding: '.5rem 1.2rem', borderRadius: '6px', fontSize: '.8rem', fontWeight: '700', cursor: 'pointer' }}>Login</button>
          <button onClick={() => setPage('register')} style={{ background: '#00E676', border: 'none', color: '#080C0A', padding: '.5rem 1.2rem', borderRadius: '6px', fontSize: '.8rem', fontWeight: '800', cursor: 'pointer' }}>Register</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '8rem 2rem 4rem', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/funaab-fantasy-league/field.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(3px) brightness(0.25)', transform: 'scale(1.05)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,12,10,0.5), rgba(8,12,10,0.9))' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px' }}>
          <img src="/logo.png" alt="FFL" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '1.5rem' }} />
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(3.5rem, 10vw, 8rem)', lineHeight: .95, letterSpacing: '2px' }}>
            FUNAAB
            <span style={{ color: '#00E676', display: 'block' }}>FANTASY</span>
            <span style={{ color: '#FFD700', display: 'block', fontSize: '.5em' }}>Football League</span>
          </h1>
          <p style={{ margin: '1.5rem auto', maxWidth: '480px', color: '#5A7A5E', fontSize: '.95rem', lineHeight: 1.7 }}>
            Pick your squad from real FUNAAB League players. Earn points. Climb the ranks. Win the prize.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setPage('register')} style={{ background: '#00E676', border: 'none', color: '#080C0A', padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px' }}>
              Join for ₦500
            </button>
            <button onClick={() => setPage('login')} style={{ background: 'transparent', border: '1px solid #1E2E20', color: '#E8F5E9', padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}>
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ background: '#111A13', borderTop: '1px solid #1E2E20', borderBottom: '1px solid #1E2E20', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
        {[['₦500', 'Entry Fee'], ['₦100M', 'Budget'], ['4-3-3', 'Formation'], ['15', 'Players']].map(([val, lbl]) => (
          <div key={lbl} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', color: '#00E676', lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: '.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#5A7A5E' }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Scoreboard */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
          <span style={{ display: 'inline-block', width: '7px', height: '7px', background: '#00E676', borderRadius: '50%' }} />
          Live Scoreboard
        </div>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '2px', marginBottom: '1.5rem' }}>Match Results</h2>
        <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', overflow: 'hidden' }}>
          {matches.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#5A7A5E' }}>No matches yet this season</div>
          ) : matches.map(m => (
            <div key={m.id} style={{ padding: '.9rem 1.4rem', borderBottom: '1px solid rgba(30,46,32,.5)', display: 'grid', gridTemplateColumns: '60px 1fr 100px', alignItems: 'center', gap: '1rem' }}>
              {/* Status */}
              <span style={{ fontSize: '.6rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', padding: '.2rem .5rem', borderRadius: '100px', textAlign: 'center', background: m.status === 'live' ? 'rgba(0,230,118,.1)' : m.status === 'completed' ? 'rgba(90,122,94,.1)' : 'rgba(100,181,246,.1)', color: m.status === 'live' ? '#00E676' : m.status === 'completed' ? '#5A7A5E' : '#64B5F6' }}>
                {m.status === 'live' ? '🔴 Live' : m.status === 'completed' ? 'FT' : 'Soon'}
              </span>

              {/* Match + Score */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.8rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700', fontSize: '.88rem', textAlign: 'right', flex: 1 }}>{m.home_team}</span>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: m.status === 'live' ? '#00E676' : m.status === 'completed' ? '#E8F5E9' : '#5A7A5E', flexShrink: 0, minWidth: '50px', textAlign: 'center' }}>
                  {m.status === 'scheduled' ? 'vs' : `${m.home_score ?? 0} — ${m.away_score ?? 0}`}
                </span>
                <span style={{ fontWeight: '700', fontSize: '.88rem', flex: 1 }}>{m.away_team}</span>
              </div>

              {/* Venue */}
              <div style={{ fontSize: '.72rem', color: '#5A7A5E', textAlign: 'right' }}>{m.venue || 'TBD'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1E2E20', padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.72rem', color: '#5A7A5E' }}>© 2025 FUNAAB Fantasy Football League. All rights reserved.</p>
      </div>
    </div>
  )
      }
