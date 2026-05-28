import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getFormStatus, formatRating } from '../lib/ratingEngine'

export default function Players() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState('ALL')
  const [teamFilter, setTeamFilter] = useState('ALL')
  const [teams, setTeams] = useState([])
  const [sortBy, setSortBy] = useState('current_rating')
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerHistory, setPlayerHistory] = useState([])

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

  const fetchPlayerHistory = async (playerId) => {
    const { data } = await supabase
      .from('player_match_ratings')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(10)
    setPlayerHistory(data || [])
  }

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player)
    fetchPlayerHistory(player.id)
  }

  const filtered = players
    .filter(p =>
      (posFilter === 'ALL' || p.position === posFilter) &&
      (teamFilter === 'ALL' || p.team === teamFilter) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'current_rating') return (b.current_rating ?? 5) - (a.current_rating ?? 5)
      if (sortBy === 'form_status') {
        const formOrder = { 'in-form': 3, 'average': 2, 'out-of-form': 1, 'new': 0 }
        return (formOrder[b.form_status] || 0) - (formOrder[a.form_status] || 0)
      }
      return (b[sortBy] ?? 0) - (a[sortBy] ?? 0)
    })

  const posColor = (pos) => pos === 'GK' ? { bg: 'rgba(255,215,0,.1)', color: '#FFD700' } : pos === 'DF' ? { bg: 'rgba(0,230,118,.1)', color: '#00E676' } : pos === 'MF' ? { bg: 'rgba(100,181,246,.1)', color: '#64B5F6' } : { bg: 'rgba(239,154,154,.1)', color: '#EF9A9A' }

  if (loading) return <div style={{ color: '#5A7A5E', padding: '2rem' }}>Loading...</div>

  return (
    <div>
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>📊 Stats</div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '2px', marginBottom: '1.5rem' }}>Player Stats</h1>

      {/* Top 5 stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Top Scorer', player: [...players].sort((a,b) => (b.goals||0)-(a.goals||0))[0], stat: 'goals', icon: '⚽', color: '#00E676' },
          { label: 'Top Assists', player: [...players].sort((a,b) => (b.assists||0)-(a.assists||0))[0], stat: 'assists', icon: '🅰', color: '#64B5F6' },
          { label: 'Best Form', player: [...players].sort((a,b) => (b.current_rating||5)-(a.current_rating||5))[0], stat: 'current_rating', icon: '⭐', color: '#FFD700' },
          { label: 'In Form', player: null, stat: null, icon: '🟢', custom: `${players.filter(p => (p.current_rating || 5) >= 7).length} players` },
          { label: 'Total Players', player: null, stat: null, icon: '👥', custom: `${players.length} active` }
        ].map(s => (
          <div key={s.label} style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '.3rem' }}>{s.icon}</div>
            <div style={{ fontSize: '.6rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '.3rem' }}>{s.label}</div>
            {s.player ? (
              <>
                <div style={{ fontWeight: '700', fontSize: '.76rem', lineHeight: 1.2 }}>{s.player.name}</div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: s.color }}>{s.stat === 'current_rating' ? formatRating(s.player[s.stat] || 5) : (s.player[s.stat] ?? 0)}</div>
              </>
            ) : (
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: s.color }}>{s.custom}</div>
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
            <option value="current_rating">Sort by Rating ⭐</option>
            <option value="form_status">Sort by Form 🎯</option>
            <option value="goals">Sort by Goals ⚽</option>
            <option value="assists">Sort by Assists 🅰</option>
            <option value="price">Sort by Price 💰</option>
          </select>
        </div>
      </div>

      {/* Player List - FIXED FOR MOBILE */}
      <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
        {/* Header - Hide on mobile, show on larger screens */}
        <div style={{ display: 'none', '@media (min-width: 768px)': { display: 'grid' }, gridTemplateColumns: '32px 1fr 50px 50px 60px 70px 80px', padding: '.8rem 1.2rem', fontSize: '.65rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E', borderBottom: '1px solid #1E2E20', gap: '.5rem', alignItems: 'center' }}>
          <span>#</span>
          <span>Player</span>
          <span style={{ textAlign: 'center' }}>⚽</span>
          <span style={{ textAlign: 'center' }}>🅰</span>
          <span style={{ textAlign: 'right' }}>Price</span>
          <span style={{ textAlign: 'center' }}>Rating</span>
          <span style={{ textAlign: 'center' }}>Form</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#5A7A5E' }}>No players found</div>
        ) : filtered.map((p, i) => {
          const pc = posColor(p.position)
          const form = getFormStatus(p.current_rating || 5.0)
          
          return (
            <div 
              key={p.id}
              onClick={() => handlePlayerClick(p)}
              style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr',
                padding: '1rem 1.2rem',
                borderBottom: '1px solid rgba(30,46,32,.4)',
                gap: '.8rem',
                transition: 'background .15s',
                cursor: 'pointer',
                background: selectedPlayer?.id === p.id ? 'rgba(0,230,118,.05)' : 'transparent'
              }}
            >
              {/* Top row: Rank + Player Info + Form Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#5A7A5E', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ ...pc, width: '26px', height: '26px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', fontWeight: '800', flexShrink: 0, background: pc.bg }}>
                    {p.position}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '.82rem' }}>{p.name}</div>
                    <div style={{ fontSize: '.65rem', color: '#5A7A5E' }}>{p.team}</div>
                  </div>
                </div>
                <span style={{ ...styles.formBadge, borderColor: form.color, background: `${form.color}20`, color: form.color, flexShrink: 0 }}>
                  {form.label}
                </span>
              </div>

              {/* Bottom row: Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.8rem', fontSize: '.8rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '.65rem', color: '#5A7A5E', marginBottom: '.2rem' }}>Goals</div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#00E676' }}>{p.goals ?? 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '.65rem', color: '#5A7A5E', marginBottom: '.2rem' }}>Assists</div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#64B5F6' }}>{p.assists ?? 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '.65rem', color: '#5A7A5E', marginBottom: '.2rem' }}>Price</div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#FFD700' }}>₦{p.price?.toFixed(1) || 5.0}M</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '.65rem', color: '#5A7A5E', marginBottom: '.2rem' }}>Rating</div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#FFD700' }}>{formatRating(p.current_rating || 5.0)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div style={styles.modal} onClick={() => setSelectedPlayer(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setSelectedPlayer(null)}>✕</button>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ ...posColor(selectedPlayer.position), width: '50px', height: '50px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: '800', flexShrink: 0, background: posColor(selectedPlayer.position).bg }}>
                {selectedPlayer.position}
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '.3rem' }}>{selectedPlayer.name}</h2>
                <div style={{ fontSize: '.85rem', color: '#5A7A5E' }}>{selectedPlayer.team}</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.8rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Current Rating', value: formatRating(selectedPlayer.current_rating || 5.0), icon: '⭐', color: '#FFD700' },
                { label: 'Form Status', value: getFormStatus(selectedPlayer.current_rating || 5.0).label, icon: '🎯', color: getFormStatus(selectedPlayer.current_rating || 5.0).color },
                { label: 'Goals', value: selectedPlayer.goals || 0, icon: '⚽', color: '#00E676' },
                { label: 'Assists', value: selectedPlayer.assists || 0, icon: '🅰', color: '#64B5F6' },
                { label: 'Price', value: `₦${selectedPlayer.price?.toFixed(1) || 5.0}M`, icon: '💰', color: '#FFD700' },
                { label: 'Matches Rated', value: selectedPlayer.rating_count || 0, icon: '🎮', color: '#E8F5E9' }
              ].map((stat, i) => (
                <div key={i} style={{ background: 'rgba(0,230,118,.05)', border: '1px solid rgba(0,230,118,.15)', borderRadius: '8px', padding: '.8rem' }}>
                  <div style={{ fontSize: '.65rem', color: '#5A7A5E', fontWeight: '700', marginBottom: '.3rem' }}>{stat.icon} {stat.label}</div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Rating History */}
            {playerHistory.length > 0 && (
              <div>
                <h3 style={{ fontSize: '.9rem', fontWeight: '800', marginBottom: '.8rem', color: '#E8F5E9' }}>📊 Recent Ratings (Last 10)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {playerHistory.map((record, i) => (
                    <div key={record.id} style={{ background: 'rgba(0,230,118,.05)', border: '1px solid rgba(0,230,118,.15)', borderRadius: '6px', padding: '.7rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.3rem' }}>
                        <span style={{ fontSize: '.75rem', color: '#5A7A5E' }}>Match {playerHistory.length - i}</span>
                        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '.9rem', color: '#FFD700' }}>{formatRating(record.rating)}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem', fontSize: '.65rem' }}>
                        <div style={{ color: '#5A7A5E' }}>Points: <span style={{ color: '#00E676' }}>{record.points_earned}</span></div>
                        <div style={{ color: '#5A7A5E' }}>Price: <span style={{ color: record.price_change_percent > 0 ? '#00E676' : '#EF9A9A' }}>₦{record.price_after?.toFixed(1) || 0}M</span></div>
                        {record.price_change_percent !== 0 && (
                          <div style={{ color: '#5A7A5E' }}>Change: <span style={{ color: record.price_change_percent > 0 ? '#00E676' : '#EF9A9A' }}>{record.price_change_percent > 0 ? '+' : ''}{record.price_change_percent.toFixed(1)}%</span></div>
                        )}
                        <div style={{ color: '#5A7A5E' }}>Date: <span style={{ color: '#E8F5E9' }}>{new Date(record.created_at).toLocaleDateString('en-GB', { day: 'short', month: 'short' })}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '1rem', fontSize: '.72rem', color: '#5A7A5E' }}>
        Showing {filtered.length} of {players.length} players • Click any player to see details
      </div>
    </div>
  )
}

const styles = {
  formBadge: {
    display: 'inline-block',
    padding: '.35rem .5rem',
    borderRadius: '4px',
    border: '1px solid',
    fontSize: '.6rem',
    fontWeight: '700'
  },
  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.7)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 9999,
    padding: '1rem'
  },
  modalContent: {
    background: '#111A13',
    border: '1px solid #1E2E20',
    borderRadius: '16px 16px 0 0',
    padding: '1.5rem',
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #1E2E20',
    background: 'transparent',
    color: '#E8F5E9',
    cursor: 'pointer',
    fontSize: '1.2rem',
    fontWeight: 'bold'
  }
    }
