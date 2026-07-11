import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'

export default function Landing({ setPage }) {
  const { theme, c, toggle } = useTheme()
  const [matches, setMatches] = useState([])
  const [playerCount, setPlayerCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: matchData }, { count }] = await Promise.all([
        supabase.from('matches').select('*').order('matchday', { ascending: false }).limit(10),
        supabase.from('managers').select('*', { count: 'exact', head: true }).eq('payment_status', 'confirmed')
      ])
      setMatches(matchData || [])
      setPlayerCount(count || 0)
    }
    fetchData()

    const channel = supabase
      .channel('landing-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'managers' }, fetchData)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const prizePool = playerCount * 500
  const fmt = (n) => `₦${n.toLocaleString()}`

  const podium = [
    { medal: '🥇', place: '1st Place', pct: 40, color: c.gold, colorRgb: c.goldRgb },
    { medal: '🥈', place: '2nd Place', pct: 25, color: '#B0BEC5', colorRgb: '176,190,197' },
    { medal: '🥉', place: '3rd Place', pct: 10, color: '#C97038', colorRgb: '201,112,56' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: 'Bricolage Grotesque, sans-serif' }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', background: c.navBg, borderBottom: `1px solid ${c.border}`, backdropFilter: 'blur(10px)' }}>
        <img src="/logo.png" alt="PredictCSL" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <button onClick={toggle} style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.muted, padding: '.4rem .6rem', borderRadius: '6px', fontSize: '.88rem', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setPage('login')} style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.text, padding: '.5rem 1.2rem', borderRadius: '6px', fontSize: '.8rem', fontWeight: '700', cursor: 'pointer' }}>Login</button>
          <button onClick={() => setPage('register')} style={{ background: c.green, border: 'none', color: c.bg, padding: '.5rem 1.2rem', borderRadius: '6px', fontSize: '.8rem', fontWeight: '800', cursor: 'pointer' }}>Join Now</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '8rem 2rem 4rem', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/field.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(3px) brightness(0.25)', transform: 'scale(1.05)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,12,10,0.5), rgba(8,12,10,0.92))' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '820px' }}>
          <img src="/logo.png" alt="PredictCSL" style={{ width: '72px', height: '72px', objectFit: 'contain', marginBottom: '1.2rem' }} />

          {/* Urgency pill */}
          {playerCount > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: '100px', padding: '.35rem 1rem', marginBottom: '1.2rem', fontSize: '.75rem', fontWeight: '700', letterSpacing: '1px', color: '#00E676' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00E676', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              🔥 {playerCount} players joined · Pool grows with every signup
            </div>
          )}

          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(3.5rem, 10vw, 8rem)', lineHeight: .95, letterSpacing: '2px' }}>
            PREDICT.
            <span style={{ color: '#00E676', display: 'block' }}>WIN.</span>
            <span style={{ color: '#FFD700', display: 'block', fontSize: '.65em' }}>GET PAID.</span>
          </h1>

          <p style={{ margin: '1.5rem auto', maxWidth: '480px', color: 'rgba(255,255,255,0.6)', fontSize: '.95rem', lineHeight: 1.7 }}>
            Predict CSL match outcomes every gameweek. Top scorers at the end of the season split the prize pool.
          </p>

          {/* Live prize pool */}
          {prizePool > 0 && (
            <div style={{ margin: '1.5rem auto', display: 'inline-block', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '12px', padding: '.9rem 2rem' }}>
              <div style={{ fontSize: '.65rem', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,215,0,0.7)', marginBottom: '.2rem' }}>💰 Current Prize Pool</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: '#FFD700', lineHeight: 1, letterSpacing: '2px' }}>{fmt(prizePool)}</div>
              <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.45)', marginTop: '.2rem' }}>Increases as more players join</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <button onClick={() => setPage('register')} style={{ background: '#00E676', border: 'none', color: '#080C0A', padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px' }}>
              Join for ₦500 →
            </button>
            <button onClick={() => setPage('login')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF', padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}>
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ background: c.card, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, padding: '1.5rem 2rem', display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
        {[
          [playerCount > 0 ? `${playerCount}` : '—', 'Players In'],
          [prizePool > 0 ? fmt(prizePool) : '₦500+', 'Prize Pool'],
          ['+5 pts', 'Correct Score'],
          ['+3 pts', 'Correct Result'],
        ].map(([val, lbl]) => (
          <div key={lbl} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', color: c.green, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: '.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: c.muted }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Prize Breakdown */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem 1rem' }}>
        <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: c.gold, marginBottom: '.5rem' }}>
          💰 Prize Breakdown
        </div>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '2px', marginBottom: '.6rem', color: c.text }}>
          Top 3 Win
        </h2>
        <p style={{ fontSize: '.88rem', color: c.muted, marginBottom: '1.8rem', lineHeight: 1.6 }}>
          The prize pool is split based on final leaderboard standings at the end of the season.
          {prizePool > 0 && <strong style={{ color: c.text }}> Current pool: {fmt(prizePool)}.</strong>}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {podium.map(({ medal, place, pct, color, colorRgb }) => (
            <div key={place} style={{ background: `rgba(${colorRgb},0.06)`, border: `1px solid rgba(${colorRgb},0.2)`, borderRadius: '12px', padding: '1.4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.4rem' }}>{medal}</div>
              <div style={{ fontSize: '.7rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color, marginBottom: '.3rem' }}>{place}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', color, lineHeight: 1 }}>{pct}%</div>
              {prizePool > 0 && (
                <div style={{ fontSize: '.82rem', color: c.muted, marginTop: '.3rem', fontWeight: '700' }}>
                  {fmt(Math.floor(prizePool * pct / 100))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1rem', padding: '.8rem 1rem', background: `rgba(${c.greenRgb},0.05)`, border: `1px solid rgba(${c.greenRgb},0.15)`, borderRadius: '8px', fontSize: '.78rem', color: c.muted, lineHeight: 1.6 }}>
          💡 Entry is <strong style={{ color: c.text }}>₦500</strong> per person. The more players join, the bigger everyone's payout. Pool updates live.
        </div>
      </div>

      {/* How it works */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 2rem 1rem' }}>
        <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: c.green, marginBottom: '.5rem' }}>How It Works</div>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '2px', marginBottom: '1.5rem', color: c.text }}>Simple. Fair. Competitive.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            ['1', 'Pay ₦500', 'Register and complete your one-time entry fee to unlock predictions.'],
            ['2', 'Predict', 'Submit scores, outcomes and bonus questions for each match.'],
            ['3', 'Earn Points', 'Exact score = 5pts. Correct result = 3pts. Bonus questions = extra pts.'],
            ['4', 'Win', 'Top 3 on the leaderboard at season end split the prize pool.'],
          ].map(([num, title, desc]) => (
            <div key={num} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.2rem' }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: c.green, lineHeight: 1, marginBottom: '.5rem' }}>{num}</div>
              <div style={{ fontWeight: '800', fontSize: '.85rem', marginBottom: '.4rem', color: c.text }}>{title}</div>
              <div style={{ fontSize: '.78rem', color: c.muted, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 2rem' }}>
        <div style={{ background: `rgba(${c.greenRgb},0.06)`, border: `1px solid rgba(${c.greenRgb},0.2)`, borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center' }}>
          {playerCount > 0 && (
            <div style={{ fontSize: '.75rem', fontWeight: '800', letterSpacing: '2px', color: c.green, marginBottom: '.5rem' }}>
              🔥 {playerCount} {playerCount === 1 ? 'player has' : 'players have'} already joined
            </div>
          )}
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '2px', color: c.text, marginBottom: '.5rem' }}>
            {prizePool > 0 ? `${fmt(prizePool)} IS UP FOR GRABS` : 'JOIN THE COMPETITION'}
          </h2>
          <p style={{ color: c.muted, fontSize: '.88rem', marginBottom: '1.5rem' }}>
            Every registration grows the pot. Don't let others take your share.
          </p>
          <button onClick={() => setPage('register')} style={{ background: c.green, border: 'none', color: c.bg, padding: '1rem 3rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px' }}>
            Join for ₦500 →
          </button>
        </div>
      </div>

      {/* Scoreboard */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 2rem 3rem' }}>
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
              {(() => {
                const isLive = m.status !== 'completed' && m.kickoff_time && new Date() >= new Date(m.kickoff_time)
                const isCompleted = m.status === 'completed'
                return (
                  <span style={{ fontSize: '.6rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', padding: '.2rem .5rem', borderRadius: '100px', textAlign: 'center', background: isLive ? `rgba(${c.greenRgb},.1)` : isCompleted ? `rgba(${c.mutedRgb},.1)` : `rgba(${c.blueRgb},.1)`, color: isLive ? c.green : isCompleted ? c.muted : c.blue }}>
                    {isLive ? '🔴 Live' : isCompleted ? 'FT' : 'Soon'}
                  </span>
                )
              })()}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.8rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700', fontSize: '.88rem', textAlign: 'right', flex: 1, color: c.text }}>{m.home_team}</span>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: (m.status !== 'completed' && m.kickoff_time && new Date() >= new Date(m.kickoff_time)) ? c.green : m.status === 'completed' ? c.text : c.muted, flexShrink: 0, minWidth: '50px', textAlign: 'center' }}>
                  {m.status === 'completed' || (m.kickoff_time && new Date() >= new Date(m.kickoff_time)) ? `${m.home_score ?? 0} — ${m.away_score ?? 0}` : 'vs'}
                </span>
                <span style={{ fontWeight: '700', fontSize: '.88rem', flex: 1, color: c.text }}>{m.away_team}</span>
              </div>
              <div style={{ fontSize: '.72rem', color: c.muted, textAlign: 'right' }}>{m.venue || 'TBD'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${c.border}`, padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.72rem', color: c.muted }}>© 2025 PredictCSL · Collegiate Super League Official Prediction Platform</p>
      </div>
    </div>
  )
}
