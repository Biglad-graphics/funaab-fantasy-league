import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Leaderboard({ manager }) {
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedManager, setSelectedManager] = useState(null)
  const [managerDetails, setManagerDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

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

  const fetchManagerDetails = async (managerId) => {
    setDetailsLoading(true)
    
    // Fetch squad
    const { data: squadData } = await supabase
      .from('squads')
      .select('*, players(*)')
      .eq('manager_id', managerId)
    
    // Fetch matchday points
    const { data: matchdayData } = await supabase
      .from('matchday_points')
      .select('*')
      .eq('manager_id', managerId)
      .order('matchday', { ascending: false })

    setManagerDetails({
      squad: squadData || [],
      matchdays: matchdayData || []
    })
    setDetailsLoading(false)
  }

  const filtered = managers.filter(m =>
    m.team_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.department?.toLowerCase().includes(search.toLowerCase())
  )

  const myRank = managers.findIndex(m => m.id === manager?.id) + 1

  if (loading) return <div style={{ color: '#5A7A5E', padding: '2rem' }}>Loading...</div>

  if (selectedManager) {
    return (
      <div>
        <button 
          onClick={() => setSelectedManager(null)}
          style={{ background: 'transparent', border: '1px solid #1E2E20', color: '#5A7A5E', padding: '.4rem .8rem', borderRadius: '6px', cursor: 'pointer', marginBottom: '1rem', fontSize: '.75rem', fontWeight: '700' }}
        >
          ← Back to Leaderboard
        </button>

        <div style={{ background: 'linear-gradient(135deg,rgba(0,230,118,.07),transparent)', border: '1px solid rgba(0,230,118,.2)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', marginBottom: '.5rem' }}>
            {selectedManager.team_name || selectedManager.full_name}
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '.85rem', color: '#5A7A5E' }}>
            <div>
              <span style={{ fontWeight: '700' }}>Rank:</span> #{managers.findIndex(m => m.id === selectedManager.id) + 1}
            </div>
            <div>
              <span style={{ fontWeight: '700' }}>Points:</span> {selectedManager.total_points}
            </div>
            <div>
              <span style={{ fontWeight: '700' }}>Department:</span> {selectedManager.department}
            </div>
          </div>
        </div>

        {detailsLoading ? (
          <div style={{ color: '#5A7A5E', padding: '2rem', textAlign: 'center' }}>Loading details...</div>
        ) : (
          <>
            {/* Weekly Points */}
            {managerDetails?.matchdays.length > 0 && (
              <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: '#E8F5E9' }}>📊 Weekly Points</div>
                {managerDetails.matchdays.map((md) => (
                  <div key={md.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.6rem 0', borderBottom: '1px solid #1E2E20' }}>
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '.88rem' }}>Gameweek {md.matchday}</span>
                    </div>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: md.points > 0 ? '#00E676' : '#EF9A9A' }}>
                      {md.points > 0 ? '+' : ''}{md.points}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Squad */}
            {managerDetails?.squad.length > 0 && (
              <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem' }}>
                <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: '#E8F5E9' }}>⚽ Current Squad ({managerDetails.squad.length})</div>
                
                {/* Starters */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '.75rem', fontWeight: '700', color: '#00E676', marginBottom: '.5rem' }}>Starting XI</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '.5rem' }}>
                    {managerDetails.squad.filter(s => s.is_starting).map((s) => (
                      <div key={s.id} style={{ background: '#1E2E20', border: s.is_captain ? '2px solid #FFD700' : '1px solid #1E2E20', borderRadius: '8px', padding: '.6rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '.55rem', fontWeight: '800', color: posColor(s.players.position).color, marginBottom: '.2rem' }}>
                          {s.players.position}
                        </div>
                        <div style={{ fontSize: '.7rem', fontWeight: '700', marginBottom: '.2rem' }}>
                          {s.players.name.split(' ').pop()}
                        </div>
                        <div style={{ fontSize: '.6rem', color: '#5A7A5E' }}>
                          ₦{s.players.price}M
                        </div>
                        {s.is_captain && <div style={{ fontSize: '.6rem', color: '#FFD700', marginTop: '.2rem' }}>⭐ CAP</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bench */}
                {managerDetails.squad.filter(s => !s.is_starting).length > 0 && (
                  <div>
                    <div style={{ fontSize: '.75rem', fontWeight: '700', color: '#64B5F6', marginBottom: '.5rem' }}>Substitutes</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '.5rem' }}>
                      {managerDetails.squad.filter(s => !s.is_starting).map((s) => (
                        <div key={s.id} style={{ background: '#1E2E20', border: '1px solid #1E2E20', borderRadius: '8px', padding: '.6rem', textAlign: 'center', opacity: 0.7 }}>
                          <div style={{ fontSize: '.55rem', fontWeight: '800', color: posColor(s.players.position).color, marginBottom: '.2rem' }}>
                            {s.players.position}
                          </div>
                          <div style={{ fontSize: '.7rem', fontWeight: '700', marginBottom: '.2rem' }}>
                            {s.players.name.split(' ').pop()}
                          </div>
                          <div style={{ fontSize: '.6rem', color: '#5A7A5E' }}>
                            ₦{s.players.price}M
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>🏆 Rankings</div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '2px', marginBottom: '1.5rem' }}>Leaderboard</h1>

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

      <input
        style={{ width: '100%', padding: '.75rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#111A13', color: '#E8F5E9', fontSize: '.85rem', outline: 'none', marginBottom: '1rem' }}
        placeholder="Search managers or departments..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', overflow: 'hidden' }}>
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
            <div 
              key={m.id} 
              onClick={() => {
                setSelectedManager(m)
                fetchManagerDetails(m.id)
              }}
              style={{ display: 'grid', gridTemplateColumns: '46px 1fr 80px', padding: '.85rem 1.4rem', borderBottom: '1px solid rgba(30,46,32,.5)', alignItems: 'center', background: isMe ? 'rgba(0,230,118,.04)' : 'transparent', borderLeft: isMe ? '3px solid #00E676' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = isMe ? 'rgba(0,230,118,.08)' : 'rgba(100,181,246,.03)'}
              onMouseLeave={(e) => e.currentTarget.style.background = isMe ? 'rgba(0,230,118,.04)' : 'transparent'}
            >
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

const posColor = (pos) => 
  pos === 'GK' ? { bg: 'rgba(255,215,0,.1)', color: '#FFD700' } : 
  pos === 'DF' ? { bg: 'rgba(0,230,118,.1)', color: '#00E676' } : 
  pos === 'MF' ? { bg: 'rgba(100,181,246,.1)', color: '#64B5F6' } : 
  { bg: 'rgba(239,154,154,.1)', color: '#EF9A9A' }
