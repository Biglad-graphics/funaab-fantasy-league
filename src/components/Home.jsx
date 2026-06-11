import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'

export default function Home({ manager, navigate }) {
  const { c } = useTheme()
  const [matches, setMatches] = useState([])
  const [rank, setRank] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [predictions, setPredictions] = useState([])
  const [allManagers, setAllManagers] = useState([])

  const styles = {
    liveBanner: { background: `linear-gradient(135deg,rgba(${c.greenRgb},.08),transparent)`, border: `1px solid rgba(${c.greenRgb},.25)`, borderRadius: '12px', padding: '1.2rem 1.5rem', marginBottom: '1.5rem' },
    liveTag: { fontSize: '.65rem', fontWeight: '800', letterSpacing: '2px', color: c.green, marginBottom: '.3rem' },
    liveFixture: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', lineHeight: 1, color: c.text },
    liveMeta: { fontSize: '.72rem', color: c.muted, marginTop: '.2rem' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '.8rem', marginBottom: '1.5rem' },
    statCard: { background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1rem' },
    statIcon: { fontSize: '1.2rem', marginBottom: '.3rem' },
    statLabel: { fontSize: '.62rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: c.muted, marginBottom: '.3rem' },
    statValue: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', lineHeight: 1 },
    twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.2rem', marginBottom: '1.2rem' },
    card: { background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.4rem' },
    cardTitle: { fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: c.text },
    empty: { color: c.muted, fontSize: '.85rem', padding: '.5rem 0' },
    matchRow: { display: 'flex', alignItems: 'center', gap: '.8rem', paddingBottom: '.7rem', marginBottom: '.7rem', borderBottom: `1px solid ${c.border}` },
    gwBadge: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: c.muted, width: '36px', flexShrink: 0 },
    matchTeams: { fontWeight: '700', fontSize: '.85rem', color: c.text },
    matchMeta: { fontSize: '.7rem', color: c.muted, marginTop: '.1rem' },
    statusBadge: { fontSize: '.62rem', fontWeight: '800', letterSpacing: '1px', padding: '.2rem .6rem', borderRadius: '100px', textTransform: 'uppercase' }
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('home-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchData = async () => {
    const [{ data: matchData }, { data: rankData }, { data: announcementData }, { data: predData }] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff_time', { ascending: true }),
      supabase.from('managers').select('id, total_points').order('total_points', { ascending: false }),
      supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(5),
      supabase.from('predictions')
        .select('*, matches(home_team, away_team, home_score, away_score, matchday, result_outcome, status)')
        .eq('manager_id', manager?.id)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    setMatches(matchData || [])
    setAnnouncements(announcementData || [])
    setAllManagers(rankData || [])
    setPredictions(predData || [])

    if (rankData) {
      const idx = rankData.findIndex(m => m.id === manager?.id)
      setRank(idx + 1)
    }
    setLoading(false)
  }

  if (loading) return <div style={{ color: c.muted, padding: '2rem' }}>Loading...</div>

  const now = new Date()
  const effectiveStatus = (m) => {
    if (m.status === 'completed') return 'completed'
    if (m.kickoff_time && now >= new Date(m.kickoff_time)) return 'live'
    return 'scheduled'
  }
  const liveMatch = matches.find(m => effectiveStatus(m) === 'live')
  const nextMatch = matches.find(m => effectiveStatus(m) === 'scheduled')
  const completedMatches = matches.filter(m => effectiveStatus(m) === 'completed')
  const upcomingMatches = matches.filter(m => effectiveStatus(m) === 'scheduled')
  const totalManagers = allManagers.length
  const correctPredictions = predictions.filter(p => (p.points_earned ?? 0) > 0).length

  return (
    <div>
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: c.green, marginBottom: '.5rem' }}>⚡ Home</div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '2px', marginBottom: '1.5rem', color: c.text }}>
        {manager?.team_name || manager?.full_name}
      </h1>

      {/* Live Match Banner */}
      {liveMatch && (
        <div style={styles.liveBanner}>
          <div style={styles.liveTag}>🔴 LIVE NOW</div>
          <div style={styles.liveFixture}>
            {liveMatch.home_team} <span style={{ color: c.green }}>{liveMatch.home_score ?? 0} — {liveMatch.away_score ?? 0}</span> {liveMatch.away_team}
          </div>
          <div style={styles.liveMeta}>GW{liveMatch.matchday} · {liveMatch.venue || 'TBD'}</div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🏆</div>
          <div style={styles.statLabel}>Overall Rank</div>
          <div style={{ ...styles.statValue, color: c.gold }}>#{rank || '—'}</div>
          <div style={{ fontSize: '.6rem', color: c.muted, marginTop: '.3rem' }}>of {totalManagers}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⚡</div>
          <div style={styles.statLabel}>Total Points</div>
          <div style={{ ...styles.statValue, color: c.green }}>{manager?.total_points ?? 0}</div>
          <div style={{ fontSize: '.6rem', color: c.muted, marginTop: '.3rem' }}>pts earned</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎯</div>
          <div style={styles.statLabel}>Predictions</div>
          <div style={{ ...styles.statValue, color: c.blue }}>{predictions.length}</div>
          <div style={{ fontSize: '.6rem', color: c.muted, marginTop: '.3rem' }}>submitted</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✓</div>
          <div style={styles.statLabel}>Correct</div>
          <div style={{ ...styles.statValue, color: c.text }}>{correctPredictions}</div>
          <div style={{ fontSize: '.6rem', color: c.muted, marginTop: '.3rem' }}>predictions</div>
        </div>
      </div>

      {/* Next Match CTA */}
      {nextMatch && (
        <div style={{ ...styles.card, background: `linear-gradient(135deg,rgba(${c.blueRgb},.07),transparent)`, border: `1px solid rgba(${c.blueRgb},.15)`, marginBottom: '1.5rem' }}>
          <div style={styles.cardTitle}>📅 Next Fixture</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', marginBottom: '.3rem', color: c.text }}>
                {nextMatch.home_team} vs {nextMatch.away_team}
              </div>
              <div style={{ fontSize: '.8rem', color: c.muted, marginBottom: '.3rem' }}>Gameweek {nextMatch.matchday}</div>
              <div style={{ fontSize: '.75rem', color: c.muted }}>📍 {nextMatch.venue || 'TBD'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '1px', color: c.blue, textTransform: 'uppercase', marginBottom: '.3rem' }}>Kickoff</div>
              <div style={{ fontSize: '.85rem', fontWeight: '700', color: c.text }}>
                {nextMatch.kickoff_time ? new Date(nextMatch.kickoff_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'TBD'}
              </div>
              {navigate && (
                <button onClick={() => navigate('predictions')} style={{ marginTop: '.6rem', padding: '.4rem .9rem', borderRadius: '6px', background: c.green, border: 'none', color: c.bg, fontWeight: '800', fontSize: '.72rem', cursor: 'pointer', letterSpacing: '.5px' }}>
                  Make Prediction →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={styles.twoCol}>
        {/* Recent Matches */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>📋 Recent Results</div>
          {completedMatches.length === 0 && upcomingMatches.length === 0 ? (
            <div style={styles.empty}>No matches yet</div>
          ) : (
            <>
              {completedMatches.slice(0, 3).map(m => (
                <div key={m.id} style={styles.matchRow}>
                  <div style={styles.gwBadge}>GW{m.matchday}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.matchTeams}>
                      {m.home_team} <span style={{ color: c.text, fontFamily: 'Bebas Neue, sans-serif' }}>{m.home_score ?? 0}—{m.away_score ?? 0}</span> {m.away_team}
                    </div>
                    <div style={styles.matchMeta}>{m.venue || 'TBD'}</div>
                  </div>
                  <span style={{ ...styles.statusBadge, background: `rgba(${c.mutedRgb},.1)`, color: c.muted }}>FT</span>
                </div>
              ))}
              {upcomingMatches.slice(0, 2).map(m => (
                <div key={m.id} style={styles.matchRow}>
                  <div style={styles.gwBadge}>GW{m.matchday}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.matchTeams}>{m.home_team} vs {m.away_team}</div>
                    <div style={styles.matchMeta}>{m.venue || 'TBD'}</div>
                  </div>
                  <span style={{ ...styles.statusBadge, background: `rgba(${c.blueRgb},.1)`, color: c.blue }}>Soon</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Recent Predictions */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🎯 My Recent Predictions</div>
          {predictions.length === 0 ? (
            <div style={styles.empty}>
              No predictions yet.{' '}
              {navigate && (
                <span onClick={() => navigate('predictions')} style={{ color: c.green, cursor: 'pointer', fontWeight: '700' }}>
                  Start predicting →
                </span>
              )}
            </div>
          ) : predictions.map((p, i) => {
            const m = p.matches
            if (!m) return null
            const pts = p.points_earned ?? 0
            const isCorrectScore = pts === 5
            const isCorrectOutcome = pts === 3
            const resultColor = isCorrectScore ? c.green : isCorrectOutcome ? c.blue : m.status === 'completed' ? c.red : c.muted
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', paddingBottom: '.7rem', marginBottom: '.7rem', borderBottom: i < predictions.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: c.muted, width: '34px', flexShrink: 0 }}>GW{m.matchday}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '.8rem', color: c.text }}>{m.home_team} vs {m.away_team}</div>
                  <div style={{ fontSize: '.68rem', color: c.muted, marginTop: '.1rem' }}>
                    {p.predicted_outcome === 'HOME' ? m.home_team + ' Win' : p.predicted_outcome === 'AWAY' ? m.away_team + ' Win' : 'Draw'}
                    {p.home_score_pred != null ? ` · ${p.home_score_pred}—${p.away_score_pred}` : ''}
                  </div>
                </div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: resultColor }}>
                  {m.status === 'completed' ? (pts > 0 ? `+${pts}` : '0') : '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div style={{ ...styles.card, marginTop: '1.2rem', background: `linear-gradient(135deg,rgba(${c.greenRgb},.05),transparent)`, border: `1px solid rgba(${c.greenRgb},.15)` }}>
          <div style={styles.cardTitle}>📢 Announcements</div>
          {announcements.map(a => (
            <div key={a.id} style={{ paddingBottom: '.8rem', marginBottom: '.8rem', borderBottom: `1px solid rgba(${c.borderRgb},.5)` }}>
              <div style={{ fontWeight: '700', fontSize: '.85rem', marginBottom: '.3rem', color: c.text }}>
                {a.is_pinned && '📌 '}{a.title}
              </div>
              <div style={{ color: c.muted, fontSize: '.82rem', lineHeight: 1.6 }}>{a.body}</div>
              <div style={{ fontSize: '.65rem', color: c.muted, marginTop: '.3rem' }}>
                {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
