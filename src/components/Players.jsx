import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Players() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState('ALL')
  const [teamFilter, setTeamFilter] = useState('ALL')
  const [teams, setTeams] = useState([])
  const [sortBy, setSortBy] = useState('goals')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [{ data: playerData }, { data: teamData }] = await Promise.all([
      supabase.from('players').select('*').eq('is_active', true),
      supabase.from('teams').select('*').order('name')
    ])
    setPlayers(playerData || [])
    setTeams(teamData || [])
    setLoading(false)
  }

  const filtered = players
    .filter(p =>
      (posFilter === 'ALL' || p.position === posFilter) &&
      (teamFilter === 'ALL' || p.team === teamFilter) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0))

  const posColor = (pos) => pos === 'GK' ? { bg: 'rgba(255,215,0,.1)', color: '#FFD700' } : pos === 'DF' ? { bg: 'rgba(0,230,118,.1)', color: '#00E676' } : pos === 'MF' ? { bg: 'rgba(100,181,246,.1)', color: '#64B5F6' } : { bg: 'rgba(239,154,154,.1)', color: '#EF9A9A' }

  if (loading) return <div style={{ color: '#5A7A5E', padding: '2rem' }}>Loading...</div>

  return (
    <div>
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>📊 Stats</div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '2px', marginBottom: '1.5rem' }}>Player Stats</h1>

      {/* Top 3 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Top Scorer', player: [...players].sort((a,b) => (b.goals||0)-(a.goals||0))[0], stat: 'goals', icon: '⚽' },
          { label: 'Top Assists', player: [...players].sort((a,b) => (b.assists||0)-(a.assists||0))[0], stat: 'assists', icon: '🅰' },
          { label: 'Most Players', player: null, stat: null, icon: '👥', custom: `${players.length} total` }
        ].map(s => (
          <div key={s.label} style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.2rem' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '.4rem' }}>{s.icon}</div>
            <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '.3rem' }}>{s.label}</div>
            {s.player ? (
              <>
                <div style={{ fontWeight: '700', fontSize: '.82rem' }}>{s.player.name}</div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: '#00E676' }}>{s.player[s.stat] ?? 0}</div>
                <div style={{ fontSize: '.68rem', color: '#5A7A5E' }}>{s.player.team}</div>
              </>
            ) : (
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: '#00E676' }}>{s.custom}</div>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1rem 1.4rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
        <input
          style={{ width: '100%', padding: '.6rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '.82rem', outline: 'none' }}
          placeholder="Search players or teams..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'GK', 'DF', 'MF', 'FW'].map(pos => (
            <button key={pos} onClick={() => setPosFilter(pos)} style={{ padding: '.3rem .7rem', borderRadius: '6px', border: `1px solid ${posFilter === pos ? '#00E676' : '#1E2E20'}`, background: posFilter === pos ? 'rgba(0,230,118,.1)' : 'transparent', color: posFilter === pos ? '#00E676' : '#5A7A5E', fontSize: '.72rem', fontWeight: '700', cursor: 'pointer' }}>
              {pos}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <select
            style={{ flex: 1, padding: '.5rem .8rem', borderRadius: '6px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '.78rem', outline: 'none' }}
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
          >
            <option value="ALL">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
          <select
            style={{ flex: 1, padding: '.5rem .8rem', borderRadius: '6px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '.78rem', outline: 'none' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="goals">Sort by Goals</option>
            <option value="assists">Sort by Assists</option>
            <option value="price">Sort by Price</option>
          </select>
        </div>
      </div>

      {/* Player List */}
      <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 50px 50px 60px', padding: '.7rem 1.2rem', fontSize: '.6rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E', borderBottom: '1px solid #1E2E20', gap: '.5rem' }}>
          <span>#</span>
          <span>Player</span>
          <span style={{ textAlign: 'center' }}>⚽</span>
          <span style={{ textAlign: 'center' }}>🅰</span>
          <span style={{ textAlign: 'right' }}>Price</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#5A7A5E' }}>No players found</div>
        ) : filtered.map((p, i) => {
          const pc = posColor(p.position)
          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 50px 50px 60px', padding: '.75rem 1.2rem', borderBottom: '1px solid rgba(30,46,32,.4)', alignItems: 'center', gap: '.5rem', transition: 'background .15s' }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#5A7A5E' }}>{i + 1}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <div style={{ ...pc, width: '26px', height: '26px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', fontWeight: '800', flexShrink: 0, background: pc.bg }}>
                  {p.position}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '.82rem' }}>{p.name}</div>
                  <div style={{ fontSize: '.65rem', color: '#5A7A5E' }}>{p.team}</div>
                </div>
              </div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: '#00E676', textAlign: 'center' }}>{p.goals ?? 0}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: '#64B5F6', textAlign: 'center' }}>{p.assists ?? 0}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#FFD700', textAlign: 'right' }}>₦{p.price}M</div>
            </div>
          )
        })}
      </div>

      <div style={{ textAlign: 'center', padding: '1rem', fontSize: '.72rem', color: '#5A7A5E' }}>
        Showing {filtered.length} of {players.length} players
      </div>
    </div>
  )
  }
