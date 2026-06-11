import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'

export default function Landing({ setPage }) {
  const { theme, c, toggle } = useTheme()
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
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: 'Bricolage Grotesque, sans-serif' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', background: c.navBg, borderBottom: `1px solid ${c.border}`, backdropFilter: 'blur(10px)' }}>
        <img src="/logo.png" alt="Funaabsu League Prediction" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <button onClick={toggle} style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.muted, padding: '.4rem .6rem', borderRadius: '6px', fontSize: '.88rem', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setPage('login')} style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.text, padding: '.5rem 1.2rem', borderRadius: '6px', fontSize: '.8rem', fontWeight: '700', cursor: 'pointer' }}>Login</button>
          <button onClick={() => setPage('register')} style={{ background: c.green, border: 'none', color: c.bg, padding: '.5rem 1.2rem', borderRadius: '6px', fontSize: '.8rem', fontWeight: '800', cursor: 'pointer' }}>Register</button>
        </div>
      </nav>

      {/* Hero — keep overlay hardcoded dark since bg image is always dark */}
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '8rem 2rem 4rem', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/funaab-fantasy-league/field.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(3px) brightness(0.25)', transform: 'scale(1.05)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,12,10,0.5), rgba(8,12,10,0.9))' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px' }}>
          <img src="/logo.png" alt="Funaabsu League Prediction" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '1.5rem' }} />
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(3.5rem, 10vw, 8rem)', lineHeight: .95, letterSpacing: '2px' }}>
            FUNAABSU
            <span style={{ color: '#00E676', display: 'block' }}>LEAGUE</span>
            <span style={{ color: '#FFD700', display: 'block', fontSize: '.5em' }}>Prediction</span>
          </h1>
          <p style={{ margin: '1.5rem auto', maxWidth: '480px', color: '#5A7A5E', fontSize: '.95rem', lineHeight: 1.7 }}>
            Predict FUNAABSU match outcomes. Earn points. Climb the ranks. Win the prize.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setPage('register')} style={{ background: '#00E676', border: 'none', color: '#080C0A', padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px' }}>
              Join for ₦500
            </button>
            <button onClick={() => setPage('login')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#E8F5E9', padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}>
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ background: c.card, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, padding: '1.5rem 2rem', display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
        {[['₦500', 'Entry Fee'], ['+5 pts', 'Correct Score'], ['+3 pts', 'Correct Outcome'], ['🏆', 'Win the Prize']].map(([val, lbl]) => (
          <div key={lbl} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', color: c.green, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: '.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: c.muted }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Scoreboard */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: c.green, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
          <span style={{ display: 'inline-block', width: '7px', height: '7px', background: c.green, borderRadius: '50%' }} />
          Live Scoreboard
        </div>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '2px', marginBottom: '1.5rem', color: c.text }}>Match Results</h2>
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          {matches.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: c.muted }}>No matches yet this season</div>
          ) : matches.map(m => (
            <div key={m.id} style={{ padding: '.9rem 1.4rem', borderBottom: `1px solid rgba(${c.borderRgb},.5)`, display: 'grid', gridTemplateColumns: '60px 1fr 100px', alignItems: 'center', gap: '1rem' }}>
              {/* Status */}
              {(() => {
                const isLive = m.status !== 'completed' && m.kickoff_time && new Date() >= new Date(m.kickoff_time)
                const isCompleted = m.status === 'completed'
                return (
                  <span style={{ fontSize: '.6rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', padding: '.2rem .5rem', borderRadius: '100px', textAlign: 'center', background: isLive ? `rgba(${c.greenRgb},.1)` : isCompleted ? `rgba(${c.mutedRgb},.1)` : `rgba(${c.blueRgb},.1)`, color: isLive ? c.green : isCompleted ? c.muted : c.blue }}>
                    {isLive ? '🔴 Live' : isCompleted ? 'FT' : 'Soon'}
                  </span>
                )
              })()}

              {/* Match + Score */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.8rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700', fontSize: '.88rem', textAlign: 'right', flex: 1, color: c.text }}>{m.home_team}</span>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: (m.status !== 'completed' && m.kickoff_time && new Date() >= new Date(m.kickoff_time)) ? c.green : m.status === 'completed' ? c.text : c.muted, flexShrink: 0, minWidth: '50px', textAlign: 'center' }}>
                  {m.status === 'completed' || (m.kickoff_time && new Date() >= new Date(m.kickoff_time)) ? `${m.home_score ?? 0} — ${m.away_score ?? 0}` : 'vs'}
                </span>
                <span style={{ fontWeight: '700', fontSize: '.88rem', flex: 1, color: c.text }}>{m.away_team}</span>
              </div>

              {/* Venue */}
              <div style={{ fontSize: '.72rem', color: c.muted, textAlign: 'right' }}>{m.venue || 'TBD'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${c.border}`, padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.72rem', color: c.muted }}>© 2025 Funaabsu League Prediction. All rights reserved.</p>
      </div>
    </div>
  )
}
