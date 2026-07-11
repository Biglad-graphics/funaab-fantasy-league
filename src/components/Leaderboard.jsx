import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'
import ShareSheet from './ShareSheet'

export default function Leaderboard({ manager }) {
  const { c } = useTheme()
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedManager, setSelectedManager] = useState(null)
  const [managerDetails, setManagerDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [showShare, setShowShare] = useState(false)

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

  if (loading) return <div style={{ color: c.muted, padding: '2rem' }}>Loading...</div>

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
          style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.muted, padding: '.4rem .8rem', borderRadius: '6px', cursor: 'pointer', marginBottom: '1rem', fontSize: '.75rem', fontWeight: '700' }}
        >
          ← Back to Leaderboard
        </button>

        <div style={{ background: `linear-gradient(135deg,rgba(${c.greenRgb},.07),transparent)`, border: `1px solid rgba(${c.greenRgb},.2)`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', marginBottom: '.5rem', color: c.text }}>
            {selectedManager.team_name || selectedManager.full_name}
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '.85rem', color: c.muted }}>
            <div><span style={{ fontWeight: '700' }}>Rank:</span> #{managers.findIndex(m => m.id === selectedManager.id) + 1}</div>
            <div><span style={{ fontWeight: '700' }}>Points:</span> {selectedManager.total_points}</div>
            <div><span style={{ fontWeight: '700' }}>Department:</span> {selectedManager.department}</div>
          </div>
        </div>

        {detailsLoading ? (
          <div style={{ color: c.muted, padding: '2rem', textAlign: 'center' }}>Loading details...</div>
        ) : (
          <>
            {/* Prediction Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '.8rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Predictions', value: preds.length, color: c.text },
                { label: 'Correct Scores', value: correctScores, color: c.green },
                { label: 'Correct Outcome', value: correctOutcomes, color: c.blue },
                { label: 'Accuracy', value: completedPreds.length > 0 ? accuracy + '%' : '—', color: c.gold }
              ].map(s => (
                <div key={s.label} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: c.muted, marginTop: '.3rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Prediction History */}
            {preds.length > 0 ? (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.4rem' }}>
                <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: c.text }}>🎯 Prediction History</div>
                {preds.map(p => {
                  const m = p.matches
                  if (!m) return null
                  const pts = p.points_earned ?? 0
                  const resultColor = pts === 5 ? c.green : pts === 3 ? c.blue : m.status === 'completed' ? c.red : c.muted
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '.8rem', padding: '.7rem 0', borderBottom: `1px solid ${c.border}` }}>
                      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: c.muted, width: '34px', flexShrink: 0 }}>GW{m.matchday}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '.82rem', color: c.text }}>{m.home_team} vs {m.away_team}</div>
                        <div style={{ fontSize: '.68rem', color: c.muted, marginTop: '.15rem' }}>
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
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '2rem', textAlign: 'center', color: c.muted }}>
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
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: c.green, marginBottom: '.5rem' }}>🏆 Rankings</div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '2px', marginBottom: '1.5rem', color: c.text }}>Leaderboard</h1>

      {myRank > 0 && (
        <div style={{ background: `linear-gradient(135deg,rgba(${c.greenRgb},.07),transparent)`, border: `1px solid rgba(${c.greenRgb},.2)`, borderRadius: '12px', padding: '1.2rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: c.muted }}>Your Position</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: c.green, lineHeight: 1 }}>#{myRank}</div>
            <div style={{ fontSize: '.8rem', color: c.muted }}>of {managers.length} predictors</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.6rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: c.muted }}>Total Points</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: c.gold, lineHeight: 1 }}>{manager?.total_points ?? 0}</div>
            </div>
            <button
              onClick={() => setShowShare(true)}
              style={{ background: `rgba(${c.greenRgb},.1)`, border: `1px solid rgba(${c.greenRgb},.3)`, color: c.green, padding: '.4rem .9rem', borderRadius: '8px', fontSize: '.75rem', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px' }}
            >
              📤 Share Rank
            </button>
          </div>
        </div>
      )}

      {showShare && (
        <ShareSheet
          message={`🔥 I'm ranked #${myRank} in PredictCSL with ${manager?.total_points ?? 0} pts 🏆\n\nThink you can beat me?\n\nJoin for ₦500 👇\nhttps://predictfl.vercel.app`}
          onClose={() => setShowShare(false)}
        />
      )}

      <input
        style={{ width: '100%', padding: '.75rem 1rem', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.card, color: c.text, fontSize: '.85rem', outline: 'none', marginBottom: '1rem' }}
        placeholder="Search predictors or departments..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '46px 1fr 80px', padding: '.7rem 1.4rem', fontSize: '.63rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: c.muted, borderBottom: `1px solid ${c.border}` }}>
          <span>Rank</span>
          <span>Predictor</span>
          <span style={{ textAlign: 'right' }}>Points</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: c.muted }}>No predictors found</div>
        ) : filtered.map(m => {
          const rank = managers.findIndex(x => x.id === m.id) + 1
          const isMe = m.id === manager?.id
          return (
            <div
              key={m.id}
              onClick={() => { setSelectedManager(m); fetchManagerDetails(m.id) }}
              style={{ display: 'grid', gridTemplateColumns: '46px 1fr 80px', padding: '.85rem 1.4rem', borderBottom: `1px solid rgba(${c.borderRgb},.5)`, alignItems: 'center', background: isMe ? `rgba(${c.greenRgb},.04)` : 'transparent', borderLeft: isMe ? `3px solid ${c.green}` : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = isMe ? `rgba(${c.greenRgb},.08)` : `rgba(${c.blueRgb},.03)`}
              onMouseLeave={e => e.currentTarget.style.background = isMe ? `rgba(${c.greenRgb},.04)` : 'transparent'}
            >
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: rank === 1 ? c.gold : rank === 2 ? '#B0BEC5' : rank === 3 ? '#C97038' : c.muted }}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: c.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '.7rem', color: c.green, flexShrink: 0 }}>
                  {(m.team_name || m.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '.85rem', color: c.text }}>{m.team_name || m.full_name}</div>
                  <div style={{ fontSize: '.7rem', color: c.muted }}>{m.department || '—'}{isMe ? ' · You' : ''}</div>
                </div>
              </div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: c.green, textAlign: 'right' }}>{m.total_points}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
