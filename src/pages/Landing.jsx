import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Landing({ onJoin }) {
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
      .channel('matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="landing-nav">
        <img src="/funaab-fantasy-league/logo.png" alt="FFL" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
        <button className="btn-primary" style={{ padding: '.5rem 1.4rem', fontSize: '.82rem' }} onClick={onJoin}>
          Login / Register
        </button>
      </nav>

      {/* HERO */}
      <div className="landing-hero">
        <div className="hero-bg" />
        <div className="pitch-lines" />
        <div className="landing-hero-inner">
          <div className="badge">⚡ 2025/26 Season — Now Live</div>
          <h1 className="landing-title">
            FUNAAB
            <span className="lt-fantasy">FANTASY</span>
            <span className="lt-league">Football League</span>
          </h1>
          <p className="landing-sub">
            Pick your squad from real FUNAAB League players. Earn points. Climb the ranks. Win the prize.
          </p>
          <button className="btn-primary landing-cta" onClick={onJoin}>
            Join Fantasy League for ₦500
          </button>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="stats-bar">
        <div className="stat-item"><span className="stat-num">₦500</span><span className="stat-label">Entry Fee</span></div>
        <div className="stat-item"><span className="stat-num">4-3-3</span><span className="stat-label">Formation</span></div>
        <div className="stat-item"><span className="stat-num">15</span><span className="stat-label">Players</span></div>
        <div className="stat-item"><span className="stat-num">₦100M</span><span className="stat-label">Budget</span></div>
      </div>

      {/* LIVE SCOREBOARD */}
      <div className="section-wrap">
        <div className="section-tag"><span className="live-dot" />Live Scoreboard</div>
        <h2 className="section-title">Match Results</h2>

        <div className="scoreboard">
          {matches.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              No matches yet this season
            </div>
          ) : matches.map(m => (
            <div key={m.id} className="score-row">
              <div className="sr-gw">GW{m.matchday}</div>
              <div className="sr-match">
                <span className="sr-team">{m.home_team}</span>
                <span className={`sr-status ${m.status}`}>
                  {m.status === 'live' ? '🔴 LIVE' : m.status === 'completed' ? 'FT' : 'vs'}
                </span>
                <span className="sr-team">{m.away_team}</span>
              </div>
              <div className="sr-venue">{m.venue || 'TBD'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="landing-footer">
        <img src="/funaab-fantasy-league/logo.png" alt="FFL" style={{ width: '32px', opacity: .5 }} />
        <p>© 2025 FUNAAB Fantasy Football League. All rights reserved.</p>
      </div>
    </div>
  )
        }
