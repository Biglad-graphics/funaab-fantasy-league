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
    const { data: predData } = await supabase
      .from('predictions')
      .select('*, matches(home_team, away_team, home_score, away_score, matchday, result_outcome, status)')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false })
    setManagerDetails({ predictions: predData || [] })
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
    const preds = managerDetails?.predictions || []
    const completedPreds = preds.filter(p => p.matches?.status === 'completed')
    const correctScores = completedPreds.filter(p => p.points_earned === 5).length
    const correctOutcomes = completedPreds.filter(p => p.points_earned === 3).length
    const accuracy = completedPreds.length > 0
      ? Math.round(((correctScores + correctOutcomes) / completedPreds.length) * 100)
      : 0

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
            <div><span style={{ fontWeight: '700' }}>Rank:</span> #{managers.findIndex(m => m.id === selectedManager.id) + 1}</div>
            <div><span style={{ fontWeight: '700' }}>Points:</span> {selectedManager.total_points}</div>
            <div><span style={{ fontWeight: '700' }}>Department:</span> {selectedManager.department}</div>
          </div>
        </div>

        {detailsLoading ? (
          <div style={{ color: '#5A7A5E', padding: '2rem', textAlign: 'center' }}>Loading details...</div>
        ) : (
          <>
            {/* Prediction Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '.8rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Predictions', value: preds.length, color: '#E8F5E9' },
                { label: 'Correct Scores', value: correctScores, color: '#00E676' },
                { label: 'Correct Outcome', value: correctOutcomes, color: '#64B5F6' },
                { label: 'Accuracy', value: completedPreds.length > 0 ? accuracy + '%' : '—', color: '#FFD700' }
              ].map(s => (
                <div key={s.label} style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#5A7A5E', marginTop: '.3rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Prediction History */}
            {preds.length > 0 ? (
              <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem' }}>
                <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: '#E8F5E9' }}>🎯 Prediction History</div>
                {preds.map(p => {
                  const m = p.matches
                  if (!m) return null
                  const pts = p.points_earned ?? 0
                  const resultColor = pts === 5 ? '#00E676' : pts === 3 ? '#64B5F6' : m.status === 'completed' ? '#EF9A9A' : '#5A7A5E'
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '.8rem', padding: '.7rem 0', borderBottom: '1px solid #1E2E20' }}>
                      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#5A7A5E', width: '34px', flexShrink: 0 }}>GW{m.matchday}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '.82rem' }}>{m.home_team} vs {m.away_team}</div>
                        <div style={{ fontSize: '.68rem', color: '#5A7A5E', marginTop: '.15rem' }}>
                          Pick: {p.predicted_outcome === 'HOME' ? m.home_team + ' Win' : p.predicted_outcome === 'AWAY' ? m.away_team + ' Win' : 'Draw'}
                          {p.home_score_pred != null ? ` (${p.home_score_pred}—${p.away_score_pred})` : ''}
                          {m.status === 'completed' ? ` · Result: ${m.home_score}—${m.away_score}` : ''}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: resultColor }}>
                        {m.status === 'completed' ? (pts > 0 ? `+${pts}` : '0') : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#5A7A5E' }}>
                No predictions submitted yet
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
            <div style={{ fontSize: '.8rem', color: '#5A7A5E' }}>of {managers.length} predictors</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E' }}>Total Points</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: '#FFD700', lineHeight: 1 }}>{manager?.total_points ?? 0}</div>
          </div>
        </div>
      )}

      <input
        style={{ width: '100%', padding: '.75rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#111A13', color: '#E8F5E9', fontSize: '.85rem', outline: 'none', marginBottom: '1rem' }}
        placeholder="Search predictors or departments..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '46px 1fr 80px', padding: '.7rem 1.4rem', fontSize: '.63rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E', borderBottom: '1px solid #1E2E20' }}>
          <span>Rank</span>
          <span>Predictor</span>
          <span style={{ textAlign: 'right' }}>Points</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#5A7A5E' }}>No predictors found</div>
        ) : filtered.map(m => {
          const rank = managers.findIndex(x => x.id === m.id) + 1
          const isMe = m.id === manager?.id
          return (
            <div
              key={m.id}
              onClick={() => { setSelectedManager(m); fetchManagerDetails(m.id) }}
              style={{ display: 'grid', gridTemplateColumns: '46px 1fr 80px', padding: '.85rem 1.4rem', borderBottom: '1px solid rgba(30,46,32,.5)', alignItems: 'center', background: isMe ? 'rgba(0,230,118,.04)' : 'transparent', borderLeft: isMe ? '3px solid #00E676' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = isMe ? 'rgba(0,230,118,.08)' : 'rgba(100,181,246,.03)'}
              onMouseLeave={e => e.currentTarget.style.background = isMe ? 'rgba(0,230,118,.04)' : 'transparent'}
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
