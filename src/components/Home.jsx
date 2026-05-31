import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home({ manager }) {
  const [matches, setMatches] = useState([])
  const [topPlayers, setTopPlayers] = useState([])
  const [rank, setRank] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [squad, setSquad] = useState([])
  const [allManagers, setAllManagers] = useState([])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('home-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squads' }, fetchData)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const fetchData = async () => {
    const [{ data: matchData }, { data: playerData }, { data: rankData }, { data: announcementData }, { data: squadData }] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff_time', { ascending: true }),
      supabase.from('players').select('*').order('goals', { ascending: false }).limit(5),
      supabase.from('managers').select('id, total_points').order('total_points', { ascending: false }),
      supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(5),
      supabase.from('squads').select('*, players(*)').eq('manager_id', manager?.id)
    ])

    setMatches(matchData || [])
    setTopPlayers(playerData || [])
    setAnnouncements(announcementData || [])
    setAllManagers(rankData || [])
    setSquad(squadData || [])

    if (rankData) {
      const idx = rankData.findIndex(m => m.id === manager?.id)
      setRank(idx + 1)
    }
    setLoading(false)
  }

  if (loading) return <div style={{ color: '#5A7A5E', padding: '2rem' }}>Loading...</div>

  const liveMatch = matches.find(m => m.status === 'live')
  const nextMatch = matches.find(m => m.status === 'scheduled')
  const upcoming = matches.filter(m => m.status === 'scheduled')
  const completed = matches.filter(m => m.status === 'completed')

  // Calculate squad value
  const squadValue = squad.reduce((sum, s) => sum + (s.players?.price || 0), 0)
  const budgetSpent = squadValue
  const budgetRemaining = 100 - budgetSpent

  // Get manager stats
  const totalManagers = allManagers.length
  const managerAbove = rank ? rank - 1 : 0
  const managerBelow = totalManagers - rank

  return (
    <div>
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>⚡ Home</div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '2px', marginBottom: '1.5rem' }}>
        {manager?.team_name || manager?.full_name}
      </h1>

      {/* Live Match Banner */}
      {liveMatch && (
        <div style={styles.liveBanner}>
          <div style={styles.liveTag}>🔴 LIVE NOW</div>
          <div style={styles.liveFixture}>
            {liveMatch.home_team} <span style={{ color: '#00E676' }}>{liveMatch.home_score ?? 0} — {liveMatch.away_score ?? 0}</span> {liveMatch.away_team}
          </div>
          <div style={styles.liveMeta}>GW{liveMatch.matchday} · {liveMatch.venue || 'TBD'}</div>
        </div>
      )}

      {/* Manager Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🏆</div>
          <div style={styles.statLabel}>Overall Rank</div>
          <div style={{ ...styles.statValue, color: '#FFD700' }}>#{rank || '—'}</div>
          <div style={{ fontSize: '.6rem', color: '#5A7A5E', marginTop: '.3rem' }}>of {totalManagers}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⚡</div>
          <div style={styles.statLabel}>Total Points</div>
          <div style={{ ...styles.statValue, color: '#00E676' }}>{manager?.total_points ?? 0}</div>
          <div style={{ fontSize: '.6rem', color: '#5A7A5E', marginTop: '.3rem' }}>Points earned</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⚽</div>
          <div style={styles.statLabel}>Squad Value</div>
          <div style={{ ...styles.statValue, color: '#64B5F6' }}>₦{squadValue.toFixed(1)}M</div>
          <div style={{ fontSize: '.6rem', color: '#5A7A5E', marginTop: '.3rem' }}>/ ₦100M</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div style={styles.statLabel}>Squad</div>
          <div style={{ ...styles.statValue, color: '#E8F5E9' }}>{squad.length}/15</div>
          <div style={{ fontSize: '.6rem', color: '#5A7A5E', marginTop: '.3rem' }}>Players picked</div>
        </div>
      </div>

      {/* Next Match */}
      {nextMatch && (
        <div style={{ ...styles.card, background: 'linear-gradient(135deg,rgba(100,181,246,.07),transparent)', border: '1px solid rgba(100,181,246,.15)', marginBottom: '1.5rem' }}>
          <div style={styles.cardTitle}>📅 Next Fixture</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', marginBottom: '.3rem' }}>
                {nextMatch.home_team} vs {nextMatch.away_team}
              </div>
              <div style={{ fontSize: '.8rem', color: '#5A7A5E', marginBottom: '.3rem' }}>
                Gameweek {nextMatch.matchday}
              </div>
              <div style={{ fontSize: '.75rem', color: '#5A7A5E' }}>
                📍 {nextMatch.venue || 'TBD'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '1px', color: '#64B5F6', textTransform: 'uppercase', marginBottom: '.3rem' }}>Kickoff</div>
              <div style={{ fontSize: '.85rem', fontWeight: '700' }}>
                {nextMatch.kickoff_time ? new Date(nextMatch.kickoff_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'TBD'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.twoCol}>
        {/* Upcoming & Recent Matches */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>📋 Recent Matches</div>
          {upcoming.length === 0 && completed.length === 0 ? (
            <div style={styles.empty}>No matches scheduled</div>
          ) : (
            <>
              {upcoming.slice(0, 3).map(m => (
                <div key={m.id} style={styles.matchRow}>
                  <div style={styles.gwBadge}>GW{m.matchday}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.matchTeams}>{m.home_team} vs {m.away_team}</div>
                    <div style={styles.matchMeta}>{m.venue || 'TBD'}</div>
                  </div>
                  <span style={{ ...styles.statusBadge, background: 'rgba(100,181,246,.1)', color: '#64B5F6' }}>Soon</span>
                </div>
              ))}
              {completed.slice(0, 2).map(m => (
                <div key={m.id} style={styles.matchRow}>
                  <div style={styles.gwBadge}>GW{m.matchday}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.matchTeams}>{m.home_team} <span style={{ color: '#E8F5E9', fontFamily: 'Bebas Neue, sans-serif', fontWeight: '700' }}>{m.home_score ?? 0}—{m.away_score ?? 0}</span> {m.away_team}</div>
                    <div style={styles.matchMeta}>{m.venue || 'TBD'}</div>
                  </div>
                  <span style={{ ...styles.statusBadge, background: 'rgba(90,122,94,.1)', color: '#5A7A5E' }}>FT</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Top Players */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>⭐ Top Scorers</div>
          {topPlayers.length === 0 ? (
            <div style={styles.empty}>No players yet</div>
          ) : topPlayers.map((p, i) => (
            <div key={p.id} style={styles.playerRow}>
              <div style={styles.playerRank}>{i + 1}</div>
              <div style={{ ...styles.posBadge, background: p.position === 'GK' ? 'rgba(255,215,0,.1)' : p.position === 'DF' ? 'rgba(0,230,118,.1)' : p.position === 'MF' ? 'rgba(100,181,246,.1)' : 'rgba(239,154,154,.1)', color: p.position === 'GK' ? '#FFD700' : p.position === 'DF' ? '#00E676' : p.position === 'MF' ? '#64B5F6' : '#EF9A9A' }}>{p.position}</div>
              <div style={{ flex: 1 }}>
                <div style={styles.playerName}>{p.name}</div>
                <div style={styles.playerTeam}>{p.team}</div>
              </div>
              <div style={styles.playerStats}>{p.goals ?? 0}⚽ {p.assists ?? 0}🅰</div>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div style={{ ...styles.card, marginTop: '1.2rem', background: 'linear-gradient(135deg,rgba(0,230,118,.05),transparent)', border: '1px solid rgba(0,230,118,.15)' }}>
          <div style={styles.cardTitle}>📢 Announcements</div>
          {announcements.map(a => (
            <div key={a.id} style={{ paddingBottom: '.8rem', marginBottom: '.8rem', borderBottom: '1px solid rgba(30,46,32,.5)' }}>
              <div style={{ fontWeight: '700', fontSize: '.85rem', marginBottom: '.3rem' }}>
                {a.is_pinned && '📌 '}{a.title}
              </div>
              <div style={{ color: '#5A7A5E', fontSize: '.82rem', lineHeight: 1.6 }}>
                {a.body}
              </div>
              <div style={{ fontSize: '.65rem', color: '#5A7A5E', marginTop: '.3rem' }}>
                {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  liveBanner: { background: 'linear-gradient(135deg,rgba(0,230,118,.08),transparent)', border: '1px solid rgba(0,230,118,.25)', borderRadius: '12px', padding: '1.2rem 1.5rem', marginBottom: '1.5rem' },
  liveTag: { fontSize: '.65rem', fontWeight: '800', letterSpacing: '2px', color: '#00E676', marginBottom: '.3rem' },
  liveFixture: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', lineHeight: 1 },
  liveMeta: { fontSize: '.72rem', color: '#5A7A5E', marginTop: '.2rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '.8rem', marginBottom: '1.5rem' },
  statCard: { background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1rem' },
  statIcon: { fontSize: '1.2rem', marginBottom: '.3rem' },
  statLabel: { fontSize: '.62rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '.3rem' },
  statValue: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', lineHeight: 1 },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.2rem', marginBottom: '1.2rem' },
  card: { background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem' },
  cardTitle: { fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: '#E8F5E9' },
  empty: { color: '#5A7A5E', fontSize: '.85rem', padding: '.5rem 0' },
  matchRow: { display: 'flex', alignItems: 'center', gap: '.8rem', paddingBottom: '.7rem', marginBottom: '.7rem', borderBottom: '1px solid #1E2E20' },
  gwBadge: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#5A7A5E', width: '36px', flexShrink: 0 },
  matchTeams: { fontWeight: '700', fontSize: '.85rem' },
  matchMeta: { fontSize: '.7rem', color: '#5A7A5E', marginTop: '.1rem' },
  statusBadge: { fontSize: '.62rem', fontWeight: '800', letterSpacing: '1px', padding: '.2rem .6rem', borderRadius: '100px', textTransform: 'uppercase' },
  playerRow: { display: 'flex', alignItems: 'center', gap: '.7rem', paddingBottom: '.7rem', marginBottom: '.7rem', borderBottom: '1px solid #1E2E20' },
  playerRank: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: '#5A7A5E', width: '20px', flexShrink: 0 },
  posBadge: { width: '26px', height: '26px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', fontWeight: '800', flexShrink: 0 },
  playerName: { fontWeight: '700', fontSize: '.82rem' },
  playerTeam: { fontSize: '.68rem', color: '#5A7A5E' },
  playerStats: { fontSize: '.72rem', color: '#5A7A5E' }
}
