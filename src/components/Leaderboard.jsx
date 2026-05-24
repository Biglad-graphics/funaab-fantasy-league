import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Leaderboard({ manager }) {
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLeaderboard()

    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'managers' }, fetchLeaderboard)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('managers')
      .select('id, full_name, team_name, department, total_points, payment_status')
      .eq('payment_status', 'confirmed')
      .order('total_points', { ascending: false })
    setManagers(data || [])
    setLoading(false)
  }

  const filtered = managers.filter(m =>
    m.team_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.department?.toLowerCase().includes(search.toLowerCase())
  )

  const myRank = managers.findIndex(m => m.id === manager?.id) + 1

  if (loading) return <div style={{ color: '#5A7A5E', padding: '2rem' }}>Loading...</div>

  return (
    <div>
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>🏆 Rankings</div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '2px', marginBottom: '1.5rem' }}>Leaderboard</h1>

      {/* My rank card */}
      {myRank > 0 && (
        <div style={{ background: 'linear-gradient(135deg,rgba(0,230,118,.07),transparent)', border: '1px solid rgba(0,230,118,.2)', borderRadius: '12px', padding: '1.2rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E' }}>Your Position</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: '#00E676', lineHeight: 1 }}>#{myRank}</div>
            <div style={{ fontSize: '.8rem', color: '#5A7A5E' }}>of {managers.length} managers</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E' }}>Total Points</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: '#FFD700', lineHeight: 1 }}>{manager?.total_points ?? 0}</div>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        style={{ width: '100%', padding: '.75rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#111A13', color: '#E8F5E9', fontSize: '.85rem', outline: 'none', marginBottom: '1rem' }}
        placeholder="Search managers or departments..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Table */}
      <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '46px 1fr 80px', padding: '.7rem 1.4rem', fontSize: '.63rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E', borderBottom: '1px solid #1E2E20' }}>
          <span>Rank</span>
          <span>Manager</span>
          <span style={{ textAlign: 'right' }}>Points</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#5A7A5E' }}>No managers found</div>
        ) : filtered.map((m, i) => {
          const rank = managers.findIndex(x => x.id === m.id) + 1
          const isMe = m.id === manager?.id
          return (
            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '46px 1fr 80px', padding: '.85rem 1.4rem', borderBottom: '1px solid rgba(30,46,32,.5)', alignItems: 'center', background: isMe ? 'rgba(0,230,118,.04)' : 'transparent', borderLeft: isMe ? '3px solid #00E676' : '3px solid transparent' }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: rank === 1 ? '#FFD700' : rank === 2 ? '#B0BEC5' : rank === 3 ? '#C97038' : '#5A7A5E' }}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1E2E20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '.7rem', color: '#00E676', flexShrink: 0 }}>
                  {(m.team_name || m.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '.85rem' }}>{m.team_name || m.full_name}</div>
                  <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>{m.department || '—'}{isMe ? ' · You' : ''}</div>
                </div>
              </div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: '#00E676', textAlign: 'right' }}>{m.total_points}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
