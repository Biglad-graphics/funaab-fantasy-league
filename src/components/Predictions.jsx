import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Predictions({ manager }) {
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('predictions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchData = async () => {
    const [{ data: matchData }, { data: predData }] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff_time', { ascending: true }),
      supabase.from('predictions').select('*').eq('manager_id', manager.id)
    ])
    setMatches(matchData || [])
    const predMap = {}
    for (const p of predData || []) predMap[p.match_id] = p
    setPredictions(predMap)
    setLoading(false)
  }

  const savePrediction = async (matchId, outcome, homeScore, awayScore) => {
    const existing = predictions[matchId]
    const payload = {
      manager_id: manager.id,
      match_id: matchId,
      predicted_outcome: outcome,
      home_score_pred: homeScore !== '' && homeScore !== null ? parseInt(homeScore) : null,
      away_score_pred: awayScore !== '' && awayScore !== null ? parseInt(awayScore) : null
    }
    let error
    if (existing) {
      ;({ error } = await supabase.from('predictions').update(payload).eq('id', existing.id))
    } else {
      ;({ error } = await supabase.from('predictions').insert(payload))
    }
    if (error) {
      console.error('Prediction save error:', error.message)
      return false
    }
    await fetchData()
    return true
  }

  // Derive display status from time — admin never needs to press "Go Live"
  const effectiveStatus = (m) => {
    if (m.status === 'completed') return 'completed'
    if (m.kickoff_time && new Date() >= new Date(m.kickoff_time)) return 'live'
    return 'scheduled'
  }

  const filtered = filter === 'all'
    ? matches
    : matches.filter(m => effectiveStatus(m) === filter)
  const live = filtered.filter(m => effectiveStatus(m) === 'live')
  const upcoming = filtered.filter(m => effectiveStatus(m) === 'scheduled')
  const completed = filtered.filter(m => effectiveStatus(m) === 'completed')

  if (loading) return <div style={{ color: '#5A7A5E', padding: '2rem' }}>Loading...</div>

  return (
    <div>
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>🎯 Predict</div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '2px', marginBottom: '.5rem' }}>Predictions</h1>
      <p style={{ color: '#5A7A5E', fontSize: '.82rem', marginBottom: '1.5rem' }}>
        Predict match outcomes before kickoff. <span style={{ color: '#00E676', fontWeight: '700' }}>Correct score = 5 pts</span> · <span style={{ color: '#64B5F6', fontWeight: '700' }}>Correct outcome = 3 pts</span>
      </p>

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['all', 'All'], ['live', '🔴 Live'], ['scheduled', 'Upcoming'], ['completed', 'Completed']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            background: filter === val ? 'rgba(0,230,118,.09)' : '#111A13',
            border: filter === val ? '1px solid #00E676' : '1px solid #1E2E20',
            color: filter === val ? '#00E676' : '#5A7A5E',
            padding: '.45rem 1rem', borderRadius: '8px', fontSize: '.75rem',
            fontWeight: '700', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.2s'
          }}>{label}</button>
        ))}
      </div>

      {(filter === 'all' || filter === 'live') && live.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '.7rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: '#00E676', marginBottom: '1rem' }}>🔴 Live Now</div>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
            {live.map(m => <PredictionCard key={m.id} match={m} prediction={predictions[m.id]} onSave={savePrediction} />)}
          </div>
        </section>
      )}

      {(filter === 'all' || filter === 'scheduled') && upcoming.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '.7rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: '#64B5F6', marginBottom: '1rem' }}>⏰ Upcoming — Submit your prediction</div>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
            {upcoming.map(m => <PredictionCard key={m.id} match={m} prediction={predictions[m.id]} onSave={savePrediction} />)}
          </div>
        </section>
      )}

      {(filter === 'all' || filter === 'completed') && completed.length > 0 && (
        <section>
          <div style={{ fontSize: '.7rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '1rem' }}>✅ Completed Results</div>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
            {completed.map(m => <PredictionCard key={m.id} match={m} prediction={predictions[m.id]} onSave={savePrediction} />)}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', color: '#5A7A5E' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
          <p>No matches found</p>
        </div>
      )}
    </div>
  )
}

function PredictionCard({ match, prediction, onSave }) {
  const now = new Date()
  const isCompleted = match.status === 'completed'
  const isLive = !isCompleted && match.kickoff_time && now >= new Date(match.kickoff_time)
  const deadlinePassed = match.prediction_deadline
    ? now > new Date(match.prediction_deadline)
    : !!isLive  // if no deadline set, lock at kickoff
  const isLocked = isCompleted || isLive || deadlinePassed

  const [outcome, setOutcome] = useState(prediction?.predicted_outcome || null)
  const [homeScore, setHomeScore] = useState(prediction?.home_score_pred != null ? String(prediction.home_score_pred) : '')
  const [awayScore, setAwayScore] = useState(prediction?.away_score_pred != null ? String(prediction.away_score_pred) : '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    setOutcome(prediction?.predicted_outcome || null)
    setHomeScore(prediction?.home_score_pred != null ? String(prediction.home_score_pred) : '')
    setAwayScore(prediction?.away_score_pred != null ? String(prediction.away_score_pred) : '')
  }, [prediction?.id, prediction?.predicted_outcome])

  const handleSave = async () => {
    if (!outcome) return
    setSaving(true)
    setSaveError(null)
    const ok = await onSave(match.id, outcome, homeScore, awayScore)
    setSaving(false)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setSaveError('Failed to save — check connection or login and try again')
    }
  }

  const matchOutcome = match.result_outcome
  const correctScore = isCompleted && prediction &&
    prediction.home_score_pred === match.home_score &&
    prediction.away_score_pred === match.away_score
  const correctOutcome = isCompleted && prediction && prediction.predicted_outcome === matchOutcome && !correctScore

  const predResultBadge = correctScore
    ? { text: '🎯 Correct Score! +5 pts', color: '#00E676', bg: 'rgba(0,230,118,.1)', border: '#00E676' }
    : correctOutcome
      ? { text: '✓ Correct Outcome +3 pts', color: '#64B5F6', bg: 'rgba(100,181,246,.1)', border: '#64B5F6' }
      : isCompleted && prediction
        ? { text: '✗ Wrong prediction — 0 pts', color: '#EF9A9A', bg: 'rgba(239,154,154,.06)', border: '#EF9A9A' }
        : null

  const cardBorder = isLive ? '1px solid rgba(0,230,118,.25)' : isCompleted ? '1px solid rgba(90,122,94,.15)' : '1px solid rgba(100,181,246,.15)'
  const cardBg = isLive ? 'rgba(0,230,118,.08)' : isCompleted ? 'rgba(90,122,94,.05)' : 'rgba(100,181,246,.05)'
  const statusTag = isLive
    ? { label: '🔴 LIVE', color: '#00E676', bg: 'rgba(0,230,118,.1)' }
    : isCompleted
      ? { label: '✅ FT', color: '#5A7A5E', bg: 'rgba(90,122,94,.1)' }
      : { label: '⏰ Soon', color: '#64B5F6', bg: 'rgba(100,181,246,.1)' }

  const homeShort = match.home_team.split(' ')[0]
  const awayShort = match.away_team.split(' ')[0]

  return (
    <div style={{ background: cardBg, border: cardBorder, borderRadius: '12px', padding: '1.2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '.65rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E' }}>GW{match.matchday}</div>
        <span style={{ fontSize: '.62rem', fontWeight: '800', letterSpacing: '1px', padding: '.25rem .7rem', borderRadius: '100px', background: statusTag.bg, color: statusTag.color, textTransform: 'uppercase' }}>{statusTag.label}</span>
      </div>

      {/* Teams & Score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.8rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, fontWeight: '700', fontSize: '.9rem', textAlign: 'right' }}>{match.home_team}</div>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: isLocked ? '2rem' : '1.2rem', color: isLive ? '#00E676' : isCompleted ? '#E8F5E9' : '#5A7A5E', fontWeight: '700', minWidth: '70px', textAlign: 'center' }}>
          {isLocked ? `${match.home_score ?? 0}—${match.away_score ?? 0}` : 'vs'}
        </div>
        <div style={{ flex: 1, fontWeight: '700', fontSize: '.9rem' }}>{match.away_team}</div>
      </div>

      {/* Venue & time */}
      <div style={{ display: 'flex', gap: '1rem', fontSize: '.7rem', color: '#5A7A5E', marginBottom: match.prediction_deadline && !isCompleted ? '.5rem' : '1rem', flexWrap: 'wrap' }}>
        <span>📍 {match.venue || 'TBD'}</span>
        {match.kickoff_time && <span>🕐 {new Date(match.kickoff_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
      </div>

      {/* Prediction deadline */}
      {match.prediction_deadline && !isCompleted && !isLive && (
        <div style={{ fontSize: '.67rem', fontWeight: '700', marginBottom: '1rem', padding: '.3rem .7rem', borderRadius: '6px', display: 'inline-block', background: deadlinePassed ? 'rgba(239,154,154,.08)' : 'rgba(255,215,0,.08)', border: `1px solid ${deadlinePassed ? 'rgba(239,154,154,.3)' : 'rgba(255,215,0,.3)'}`, color: deadlinePassed ? '#EF9A9A' : '#FFD700' }}>
          🔒 {deadlinePassed ? 'Predictions closed' : `Closes ${new Date(match.prediction_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
        </div>
      )}

      {/* Result badge (completed) */}
      {predResultBadge && (
        <div style={{ padding: '.6rem', borderRadius: '8px', marginBottom: '.8rem', background: predResultBadge.bg, border: `1px solid ${predResultBadge.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: '.7rem', fontWeight: '800', letterSpacing: '1px', color: predResultBadge.color }}>{predResultBadge.text}</div>
          <div style={{ fontSize: '.68rem', color: '#5A7A5E', marginTop: '.25rem' }}>
            Your pick: {prediction.predicted_outcome === 'HOME' ? homeShort + ' Win' : prediction.predicted_outcome === 'AWAY' ? awayShort + ' Win' : 'Draw'}
            {prediction.home_score_pred != null ? ` (${prediction.home_score_pred}—${prediction.away_score_pred})` : ''}
          </div>
        </div>
      )}

      {isCompleted && !prediction && (
        <div style={{ padding: '.6rem', borderRadius: '8px', marginBottom: '.8rem', background: 'rgba(90,122,94,.05)', border: '1px solid #1E2E20', textAlign: 'center', fontSize: '.72rem', color: '#5A7A5E' }}>
          No prediction submitted
        </div>
      )}

      {/* Deadline passed but match not live yet */}
      {deadlinePassed && !isLive && !isCompleted && (
        <div style={{ padding: '.6rem 1rem', background: 'rgba(239,154,154,.06)', border: '1px solid rgba(239,154,154,.25)', borderRadius: '8px', textAlign: 'center', fontSize: '.72rem', fontWeight: '700', color: '#EF9A9A', letterSpacing: '1px' }}>
          {prediction
            ? `Your pick: ${prediction.predicted_outcome === 'HOME' ? homeShort + ' Win' : prediction.predicted_outcome === 'AWAY' ? awayShort + ' Win' : 'Draw'}${prediction.home_score_pred != null ? ` (${prediction.home_score_pred}—${prediction.away_score_pred})` : ''} · Predictions closed 🔒`
            : 'Predictions closed — no prediction submitted'
          }
        </div>
      )}

      {/* Live lock indicator */}
      {isLive && (
        <div style={{ padding: '.6rem 1rem', background: 'rgba(0,230,118,.1)', border: '1px solid #00E676', borderRadius: '8px', textAlign: 'center', fontSize: '.72rem', fontWeight: '700', color: '#00E676', letterSpacing: '1px' }}>
          {prediction
            ? `Your pick: ${prediction.predicted_outcome === 'HOME' ? homeShort + ' Win' : prediction.predicted_outcome === 'AWAY' ? awayShort + ' Win' : 'Draw'}${prediction.home_score_pred != null ? ` (${prediction.home_score_pred}—${prediction.away_score_pred})` : ''} 🔒`
            : 'Match in progress — no prediction made'
          }
        </div>
      )}

      {/* Prediction form (upcoming only) */}
      {!isLocked && (
        <>
          <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '.5rem' }}>Pick outcome</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.4rem', marginBottom: '.8rem' }}>
            {[['HOME', homeShort + ' Win'], ['DRAW', 'Draw'], ['AWAY', awayShort + ' Win']].map(([val, label]) => (
              <button key={val} onClick={() => setOutcome(val)} style={{
                padding: '.5rem .2rem', borderRadius: '8px',
                border: outcome === val ? '2px solid #00E676' : '1px solid #1E2E20',
                background: outcome === val ? 'rgba(0,230,118,.1)' : '#111A13',
                color: outcome === val ? '#00E676' : '#5A7A5E',
                fontWeight: '800', fontSize: '.65rem', letterSpacing: '.5px',
                cursor: 'pointer', textTransform: 'uppercase', transition: 'all .15s'
              }}>{label}</button>
            ))}
          </div>

          <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '.5rem' }}>Correct score? (bonus +5 pts)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.8rem' }}>
            <input type="number" min="0" max="20" placeholder="0" value={homeScore}
              onChange={e => setHomeScore(e.target.value)}
              style={{ flex: 1, padding: '.5rem', borderRadius: '6px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '1rem', fontWeight: '700', textAlign: 'center', outline: 'none' }}
            />
            <span style={{ color: '#5A7A5E', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', fontWeight: '800' }}>—</span>
            <input type="number" min="0" max="20" placeholder="0" value={awayScore}
              onChange={e => setAwayScore(e.target.value)}
              style={{ flex: 1, padding: '.5rem', borderRadius: '6px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '1rem', fontWeight: '700', textAlign: 'center', outline: 'none' }}
            />
          </div>

          {saveError && (
            <div style={{ padding: '.5rem .7rem', borderRadius: '6px', background: 'rgba(239,154,154,.08)', border: '1px solid rgba(239,154,154,.3)', color: '#EF9A9A', fontSize: '.72rem', fontWeight: '600', textAlign: 'center', marginBottom: '.5rem' }}>
              ⚠ {saveError}
            </div>
          )}
          <button onClick={handleSave} disabled={!outcome || saving} style={{
            width: '100%', padding: '.7rem', borderRadius: '8px',
            background: saved ? 'rgba(0,230,118,.15)' : outcome ? '#00E676' : '#1E2E20',
            color: saved ? '#00E676' : outcome ? '#080C0A' : '#5A7A5E',
            border: saved ? '1px solid #00E676' : 'none',
            fontWeight: '800', fontSize: '.78rem', letterSpacing: '1px',
            cursor: outcome ? 'pointer' : 'not-allowed', transition: 'all .15s'
          }}>
            {saving ? 'Saving...' : saved ? '✅ Saved!' : prediction ? '🔄 Update Prediction' : '🎯 Submit Prediction'}
          </button>
        </>
      )}
    </div>
  )
}
