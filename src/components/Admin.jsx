import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'

const TABS = ['Matches', 'Results', 'Payments', 'Announcements', 'Season']

export default function Admin() {
  const { c } = useTheme()
  const [tab, setTab] = useState('Matches')
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [questions, setQuestions] = useState({}) // { match_id: [question, ...] }
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [mForm, setMForm] = useState({ home_team: '', away_team: '', matchday: 1, venue: '', kickoff_time: '', prediction_deadline: '' })
  const [resultForms, setResultForms] = useState({})
  const [saving, setSaving] = useState({})
  const [expandedQMatch, setExpandedQMatch] = useState(null)
  const [qForm, setQForm] = useState({ question: '', options: ['', '', '', ''], points: 2 })
  const [questionCorrects, setQuestionCorrects] = useState({}) // { question_id: selectedOption }

  const styles = {
    wrap: { padding: '2rem 0' },
    title: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '2px', marginBottom: '1.2rem', color: c.text },
    tabs: { display: 'flex', gap: '.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' },
    tab: { background: c.card, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '.5rem 1rem', fontSize: '.78rem', fontWeight: '700', letterSpacing: '1px', color: c.muted, cursor: 'pointer' },
    tabActive: { background: `rgba(${c.greenRgb},.09)`, borderColor: c.green, color: c.green },
    card: { background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.4rem' },
    cardTitle: { fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: c.text },
    form: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem' },
    input: { padding: '.75rem 1rem', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: '.85rem', outline: 'none', width: '100%' },
    btn: { padding: '.75rem 1rem', borderRadius: '8px', background: c.green, color: c.bg, fontWeight: '800', fontSize: '.82rem', border: 'none', cursor: 'pointer', letterSpacing: '1px' },
    row: { display: 'flex', alignItems: 'center', gap: '.8rem', paddingBottom: '.7rem', marginBottom: '.7rem', borderBottom: `1px solid ${c.border}` },
    badge: { fontSize: '.62rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '.2rem .6rem', borderRadius: '100px' },
    toast: { position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', background: c.card, border: `1px solid ${c.green}`, color: c.text, padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999 },
    toastBad: { borderColor: c.red, color: c.red }
  }

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: t }, { data: m }, { data: q }] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('matches').select('*').order('matchday', { ascending: false }),
      supabase.from('match_questions').select('*').order('created_at')
    ])
    setTeams(t || [])
    setMatches(m || [])
    const qMap = {}
    for (const question of q || []) {
      if (!qMap[question.match_id]) qMap[question.match_id] = []
      qMap[question.match_id].push(question)
    }
    setQuestions(qMap)
    setLoading(false)
  }

  const showToast = (msg, bad = false) => {
    setToast({ msg, bad })
    setTimeout(() => setToast(null), 3000)
  }

  const toggleQPanel = (matchId) => {
    setExpandedQMatch(prev => {
      if (prev === matchId) return null
      setQForm({ question: '', options: ['', '', '', ''], points: 2 })
      return matchId
    })
  }

  const addMatch = async () => {
    if (!mForm.home_team || !mForm.away_team) return showToast('⚠ Fill all fields', true)
    const { error } = await supabase.from('matches').insert({
      ...mForm,
      kickoff_time: mForm.kickoff_time || null,
      prediction_deadline: mForm.prediction_deadline || null
    })
    if (error) return showToast('❌ Failed to add match', true)
    showToast('✅ Match created!')
    setMForm({ home_team: '', away_team: '', matchday: 1, venue: '', kickoff_time: '', prediction_deadline: '' })
    fetchAll()
  }

  const deleteMatch = async (id) => {
    if (!confirm('Delete this match? All predictions for it will also be deleted.')) return
    await supabase.from('matches').delete().eq('id', id)
    showToast('Match deleted')
    fetchAll()
  }

  const addQuestion = async (matchId) => {
    const validOptions = qForm.options.map(o => o.trim()).filter(Boolean)
    if (!qForm.question.trim()) return showToast('⚠ Enter a question', true)
    if (validOptions.length < 2) return showToast('⚠ Add at least 2 options', true)
    const { error } = await supabase.from('match_questions').insert({
      match_id: matchId,
      question: qForm.question.trim(),
      options: validOptions,
      points: qForm.points
    })
    if (error) return showToast('❌ Failed to add question', true)
    showToast('✅ Question added!')
    setQForm({ question: '', options: ['', '', '', ''], points: 2 })
    fetchAll()
  }

  const deleteQuestion = async (id) => {
    if (!confirm('Delete this question? All user answers will also be deleted.')) return
    await supabase.from('match_questions').delete().eq('id', id)
    showToast('Question deleted')
    fetchAll()
  }

  const enterResult = async (match) => {
    const form = resultForms[match.id] || {}
    const homeScore = parseInt(form.home)
    const awayScore = parseInt(form.away)
    if (isNaN(homeScore) || isNaN(awayScore)) return showToast('⚠ Enter valid scores for both teams', true)
    if (match.result_outcome) return showToast('⚠ Result already confirmed for this match', true)

    setSaving(prev => ({ ...prev, [match.id]: true }))
    const outcome = homeScore > awayScore ? 'HOME' : awayScore > homeScore ? 'AWAY' : 'DRAW'

    const { data: updatedMatch, error: matchUpdateError } = await supabase.from('matches').update({
      home_score: homeScore,
      away_score: awayScore,
      status: 'completed',
      result_outcome: outcome
    }).eq('id', match.id).select()

    if (matchUpdateError || !updatedMatch?.length) {
      setSaving(prev => ({ ...prev, [match.id]: false }))
      const msg = matchUpdateError?.message || 'Update blocked — check Supabase RLS policies for the matches table'
      return showToast(`❌ ${msg}`, true)
    }

    const { data: preds } = await supabase.from('predictions').select('*').eq('match_id', match.id)
    const managerPointsMap = {}
    const totalGoals = homeScore + awayScore

    for (const pred of preds || []) {
      let pts = 0
      if (pred.home_score_pred === homeScore && pred.away_score_pred === awayScore) {
        pts += 5
      } else if (pred.predicted_outcome === outcome) {
        pts += 3
      }
      if (pred.goals_range_pred) {
        const goalCorrect =
          (pred.goals_range_pred === 'UNDER_1.5' && totalGoals < 2) ||
          (pred.goals_range_pred === 'OVER_1.5' && totalGoals >= 2) ||
          (pred.goals_range_pred === 'OVER_2.5' && totalGoals >= 3) ||
          (pred.goals_range_pred === 'OVER_3.5' && totalGoals >= 4)
        if (goalCorrect) pts += 2
      }
      managerPointsMap[pred.manager_id] = (managerPointsMap[pred.manager_id] || 0) + pts
      await supabase.from('predictions').update({ points_earned: pts }).eq('id', pred.id)
    }

    // Score bonus questions
    const matchQuestions = questions[match.id] || []
    for (const q of matchQuestions) {
      const correctOpt = questionCorrects[q.id]
      if (!correctOpt) continue
      await supabase.from('match_questions').update({ correct_option: correctOpt }).eq('id', q.id)
      const { data: qAnswers } = await supabase.from('question_answers').select('*').eq('question_id', q.id)
      for (const ans of qAnswers || []) {
        if (ans.selected_option === correctOpt) {
          await supabase.from('question_answers').update({ points_earned: q.points }).eq('id', ans.id)
          managerPointsMap[ans.manager_id] = (managerPointsMap[ans.manager_id] || 0) + q.points
        }
      }
    }

    for (const [managerId, pts] of Object.entries(managerPointsMap)) {
      if (pts > 0) {
        const { data: mgr } = await supabase.from('managers').select('total_points').eq('id', managerId).single()
        await supabase.from('managers').update({ total_points: (mgr?.total_points || 0) + pts }).eq('id', managerId)
      }
    }

    setSaving(prev => ({ ...prev, [match.id]: false }))
    setResultForms(prev => { const n = { ...prev }; delete n[match.id]; return n })
    setQuestionCorrects(prev => {
      const n = { ...prev }
      for (const q of matchQuestions) delete n[q.id]
      return n
    })
    const predCount = (preds || []).length
    showToast(`✅ ${homeScore}—${awayScore} confirmed. ${predCount} prediction${predCount !== 1 ? 's' : ''} processed!`)
    fetchAll()
  }

  if (loading) return <div style={{ padding: '2rem', color: c.muted }}>Loading...</div>

  const now = new Date()
  const pendingMatches = matches.filter(m => m.status !== 'completed' && m.kickoff_time && now >= new Date(m.kickoff_time))
  const upcomingMatches = matches.filter(m => m.status !== 'completed' && (!m.kickoff_time || now < new Date(m.kickoff_time)))
  const completedMatches = matches.filter(m => m.status === 'completed')

  return (
    <div style={styles.wrap}>
      {toast && <div style={{ ...styles.toast, ...(toast.bad ? styles.toastBad : {}) }}>{toast.msg}</div>}
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: c.green, marginBottom: '.5rem' }}>🔐 Admin</div>
      <h2 style={styles.title}>Control Center</h2>

      <div style={styles.tabs}>
        {TABS.map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === 'Matches' ? '📅 ' : t === 'Results' ? '🎯 ' : t === 'Season' ? '🏆 ' : t === 'Payments' ? '💳 ' : '📢 '}{t}
          </button>
        ))}
      </div>

      {tab === 'Matches' && (
        <div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Create Match</div>
            <div style={styles.form}>
              <select style={styles.input} value={mForm.home_team} onChange={e => setMForm({ ...mForm, home_team: e.target.value })}>
                <option value="">Home Team</option>
                {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              <select style={styles.input} value={mForm.away_team} onChange={e => setMForm({ ...mForm, away_team: e.target.value })}>
                <option value="">Away Team</option>
                {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              <input style={styles.input} type="number" placeholder="Matchday" value={mForm.matchday} onChange={e => setMForm({ ...mForm, matchday: parseInt(e.target.value) })} />
              <input style={styles.input} placeholder="Venue" value={mForm.venue} onChange={e => setMForm({ ...mForm, venue: e.target.value })} />
              <input style={styles.input} type="datetime-local" value={mForm.kickoff_time} onChange={e => setMForm({ ...mForm, kickoff_time: e.target.value })} />
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: c.muted, display: 'block', marginBottom: '.4rem' }}>
                  🔒 Prediction Deadline (when submissions close)
                </label>
                <input style={styles.input} type="datetime-local" value={mForm.prediction_deadline} onChange={e => setMForm({ ...mForm, prediction_deadline: e.target.value })} />
              </div>
              <button style={{ ...styles.btn, gridColumn: 'span 2' }} onClick={addMatch}>Create Match</button>
            </div>
          </div>

          <div style={{ ...styles.card, marginTop: '1rem' }}>
            <div style={styles.cardTitle}>All Matches</div>
            {matches.map(m => (
              <div key={m.id}>
                <div style={styles.row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '.88rem', color: c.text }}>{m.home_team} vs {m.away_team}</div>
                    <div style={{ fontSize: '.7rem', color: c.muted }}>
                      GW{m.matchday} · {m.venue || 'TBD'}
                      {m.status === 'completed' && ` · ${m.home_score}—${m.away_score}`}
                    </div>
                    {m.prediction_deadline && m.status === 'scheduled' && (
                      <div style={{ fontSize: '.65rem', color: new Date() > new Date(m.prediction_deadline) ? c.red : c.gold, marginTop: '.2rem' }}>
                        🔒 Deadline: {new Date(m.prediction_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {new Date() > new Date(m.prediction_deadline) ? ' · Closed' : ''}
                      </div>
                    )}
                  </div>
                  <span style={{ ...styles.badge, background: m.status === 'completed' ? `rgba(${c.mutedRgb},.1)` : m.kickoff_time && new Date() >= new Date(m.kickoff_time) ? `rgba(${c.greenRgb},.1)` : `rgba(${c.blueRgb},.1)`, color: m.status === 'completed' ? c.muted : m.kickoff_time && new Date() >= new Date(m.kickoff_time) ? c.green : c.blue }}>
                    {m.status === 'completed' ? 'completed' : m.kickoff_time && new Date() >= new Date(m.kickoff_time) ? 'live' : 'scheduled'}
                  </span>
                  <button
                    onClick={() => toggleQPanel(m.id)}
                    style={{ ...styles.btn, background: expandedQMatch === m.id ? `rgba(${c.goldRgb},.2)` : `rgba(${c.goldRgb},.08)`, border: `1px solid rgba(${c.goldRgb},.4)`, color: c.gold, padding: '.3rem .6rem', fontSize: '.72rem' }}
                  >
                    📝 {(questions[m.id] || []).length}
                  </button>
                  {m.status !== 'completed' && (
                    <button style={{ ...styles.btn, background: 'transparent', border: `1px solid ${c.red}`, color: c.red, padding: '.3rem .6rem', fontSize: '.72rem' }} onClick={() => deleteMatch(m.id)}>✕</button>
                  )}
                </div>

                {expandedQMatch === m.id && (
                  <div style={{ background: `rgba(${c.goldRgb},.03)`, border: `1px solid rgba(${c.goldRgb},.15)`, borderRadius: '10px', padding: '1rem', marginBottom: '.7rem' }}>
                    <div style={{ fontSize: '.7rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: c.gold, marginBottom: '.8rem' }}>
                      📝 Bonus Questions
                    </div>

                    {(questions[m.id] || []).length === 0 && (
                      <div style={{ fontSize: '.78rem', color: c.muted, marginBottom: '.8rem' }}>No questions yet for this match.</div>
                    )}

                    {(questions[m.id] || []).map(q => (
                      <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '.6rem 0', borderBottom: `1px solid rgba(${c.goldRgb},.1)`, gap: '.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '.82rem', fontWeight: '700', color: c.text }}>{q.question}</div>
                          <div style={{ fontSize: '.68rem', color: c.muted, marginTop: '.2rem' }}>
                            {q.options.join(' · ')} · <span style={{ color: c.gold }}>+{q.points} pts</span>
                          </div>
                          {q.correct_option && (
                            <div style={{ fontSize: '.65rem', color: c.green, marginTop: '.15rem' }}>✓ Correct: {q.correct_option}</div>
                          )}
                        </div>
                        {m.status !== 'completed' && (
                          <button onClick={() => deleteQuestion(q.id)} style={{ background: 'transparent', border: `1px solid ${c.red}`, color: c.red, borderRadius: '6px', padding: '.25rem .5rem', fontSize: '.7rem', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                        )}
                      </div>
                    ))}

                    {m.status !== 'completed' && (
                      <div style={{ marginTop: '.9rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                        <input
                          style={styles.input}
                          placeholder="Question (e.g. Who will score first?)"
                          value={qForm.question}
                          onChange={e => setQForm({ ...qForm, question: e.target.value })}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem' }}>
                          {[0, 1, 2, 3].map(i => (
                            <input
                              key={i}
                              style={styles.input}
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              value={qForm.options[i]}
                              onChange={e => {
                                const opts = [...qForm.options]
                                opts[i] = e.target.value
                                setQForm({ ...qForm, options: opts })
                              }}
                            />
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <select style={{ ...styles.input, flex: '0 0 auto', width: 'auto' }} value={qForm.points} onChange={e => setQForm({ ...qForm, points: parseInt(e.target.value) })}>
                            {[1, 2, 3, 5].map(p => <option key={p} value={p}>+{p} pts</option>)}
                          </select>
                          <button style={{ ...styles.btn, flex: 1 }} onClick={() => addQuestion(m.id)}>Add Question</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {matches.length === 0 && <div style={{ padding: '1.5rem', color: c.muted, textAlign: 'center' }}>No matches yet</div>}
          </div>
        </div>
      )}

      {tab === 'Results' && (
        <div>
          {pendingMatches.length > 0 && (
            <div style={{ ...styles.card, marginBottom: '1rem' }}>
              <div style={styles.cardTitle}>🔴 In Progress — Enter Results</div>
              <p style={{ fontSize: '.78rem', color: c.muted, marginBottom: '1.2rem', lineHeight: 1.6 }}>
                Enter the final score to automatically award prediction points. This cannot be undone.
              </p>
              {pendingMatches.map(m => {
                const form = resultForms[m.id] || {}
                const matchQuestions = questions[m.id] || []
                return (
                  <div key={m.id} style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: `1px solid ${c.border}` }}>
                    <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <div style={{ fontWeight: '700', fontSize: '.88rem', color: c.text }}>{m.home_team} vs {m.away_team}</div>
                        <div style={{ fontSize: '.7rem', color: c.muted, marginBottom: '.3rem' }}>GW{m.matchday}</div>
                        <span style={{ fontSize: '.62rem', fontWeight: '800', letterSpacing: '1px', padding: '.2rem .5rem', borderRadius: '100px', background: `rgba(${c.greenRgb},.1)`, color: c.green, textTransform: 'uppercase' }}>
                          🔴 In Progress
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                        <input
                          type="number" min="0" max="20" placeholder="0"
                          value={form.home || ''}
                          onChange={e => setResultForms(prev => ({ ...prev, [m.id]: { ...prev[m.id], home: e.target.value } }))}
                          style={{ width: '54px', padding: '.5rem', borderRadius: '6px', border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: '1rem', fontWeight: '700', textAlign: 'center', outline: 'none' }}
                        />
                        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: c.muted }}>—</span>
                        <input
                          type="number" min="0" max="20" placeholder="0"
                          value={form.away || ''}
                          onChange={e => setResultForms(prev => ({ ...prev, [m.id]: { ...prev[m.id], away: e.target.value } }))}
                          style={{ width: '54px', padding: '.5rem', borderRadius: '6px', border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: '1rem', fontWeight: '700', textAlign: 'center', outline: 'none' }}
                        />
                        <button
                          style={{ ...styles.btn, padding: '.5rem 1rem', fontSize: '.78rem' }}
                          onClick={() => enterResult(m)}
                          disabled={saving[m.id]}
                        >
                          {saving[m.id] ? '⏳' : 'Confirm'}
                        </button>
                      </div>
                    </div>

                    {matchQuestions.length > 0 && (
                      <div style={{ marginTop: '.9rem', background: `rgba(${c.goldRgb},.03)`, border: `1px solid rgba(${c.goldRgb},.15)`, borderRadius: '8px', padding: '.8rem' }}>
                        <div style={{ fontSize: '.65rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: c.gold, marginBottom: '.7rem' }}>
                          📝 Mark Correct Answers
                        </div>
                        {matchQuestions.map(q => (
                          <div key={q.id} style={{ marginBottom: '.8rem' }}>
                            <div style={{ fontSize: '.8rem', fontWeight: '700', color: c.text, marginBottom: '.4rem' }}>
                              {q.question} <span style={{ color: c.gold, fontSize: '.65rem' }}>+{q.points} pts</span>
                            </div>
                            <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                              {q.options.map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => setQuestionCorrects(prev => ({ ...prev, [q.id]: prev[q.id] === opt ? null : opt }))}
                                  style={{
                                    padding: '.35rem .75rem', borderRadius: '6px',
                                    border: questionCorrects[q.id] === opt ? `2px solid ${c.gold}` : `1px solid ${c.border}`,
                                    background: questionCorrects[q.id] === opt ? `rgba(${c.goldRgb},.15)` : c.card,
                                    color: questionCorrects[q.id] === opt ? c.gold : c.muted,
                                    fontSize: '.75rem', fontWeight: '700', cursor: 'pointer', transition: 'all .15s'
                                  }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {upcomingMatches.length > 0 && (
            <div style={{ ...styles.card, marginBottom: '1rem', background: `rgba(${c.blueRgb},.03)`, borderColor: `rgba(${c.blueRgb},.15)` }}>
              <div style={styles.cardTitle}>⏰ Upcoming — not kicked off yet</div>
              {upcomingMatches.map(m => (
                <div key={m.id} style={styles.row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '.88rem', color: c.text }}>{m.home_team} vs {m.away_team}</div>
                    <div style={{ fontSize: '.7rem', color: c.muted }}>GW{m.matchday} · {m.kickoff_time ? new Date(m.kickoff_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'TBD'}</div>
                  </div>
                  <span style={{ ...styles.badge, background: `rgba(${c.blueRgb},.1)`, color: c.blue }}>upcoming</span>
                </div>
              ))}
            </div>
          )}

          {pendingMatches.length === 0 && completedMatches.length === 0 && upcomingMatches.length === 0 && (
            <div style={styles.card}>
              <div style={{ padding: '1.5rem', color: c.muted, textAlign: 'center' }}>No matches to manage yet</div>
            </div>
          )}

          {completedMatches.length > 0 && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Confirmed Results</div>
              {completedMatches.map(m => (
                <div key={m.id} style={styles.row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '.88rem', color: c.text }}>{m.home_team} vs {m.away_team}</div>
                    <div style={{ fontSize: '.7rem', color: c.muted }}>GW{m.matchday} · {m.venue || 'TBD'}</div>
                    {(questions[m.id] || []).length > 0 && (
                      <div style={{ fontSize: '.65rem', color: c.gold, marginTop: '.2rem' }}>
                        📝 {(questions[m.id] || []).length} bonus question{(questions[m.id] || []).length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: c.text, minWidth: '64px', textAlign: 'center' }}>
                    {m.home_score}—{m.away_score}
                  </div>
                  <span style={{ ...styles.badge, background: `rgba(${c.mutedRgb},.1)`, color: c.muted }}>
                    {m.result_outcome === 'HOME' ? 'H Win' : m.result_outcome === 'AWAY' ? 'A Win' : 'Draw'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Payments' && <PaymentsTab />}
      {tab === 'Announcements' && <AnnouncementsTab />}
      {tab === 'Season' && <SeasonTab />}
    </div>
  )
}

function PaymentsTab() {
  const { c } = useTheme()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchPayments() }, [])

  const fetchPayments = async () => {
    setLoading(true)
    const { data } = await supabase.from('managers').select('*').order('created_at', { ascending: false })
    setPayments(data || [])
    setLoading(false)
  }

  const showToast = (msg, bad = false) => {
    setToast({ msg, bad })
    setTimeout(() => setToast(null), 2500)
  }

  const confirm = async (id, name) => {
    await supabase.from('managers').update({ payment_status: 'confirmed' }).eq('id', id)
    showToast(`✅ ${name} confirmed!`)
    fetchPayments()
  }

  const reject = async (id, name) => {
    await supabase.from('managers').update({ payment_status: 'rejected' }).eq('id', id)
    showToast(`❌ ${name} rejected`, true)
    fetchPayments()
  }

  if (loading) return <div style={{ padding: '2rem', color: c.muted }}>Loading...</div>

  return (
    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.4rem' }}>
      {toast && <div style={{ position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', background: c.card, border: `1px solid ${c.green}`, color: c.text, padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999 }}>{toast.msg}</div>}
      <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: c.text }}>Payment Submissions ({payments.length})</div>
      {payments.length === 0 && <div style={{ color: c.muted, fontSize: '.85rem' }}>No submissions yet</div>}
      {payments.map(m => (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.85rem 0', borderBottom: `1px solid ${c.border}`, flexWrap: 'wrap', gap: '.5rem' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '.88rem', color: c.text }}>{m.full_name || m.display_name || 'Unknown'}</div>
            <div style={{ fontSize: '.7rem', color: c.muted }}>{m.matric_number} · {m.department}</div>
            {m.transaction_id && <div style={{ fontSize: '.7rem', color: c.muted }}>TXN: {m.transaction_id}</div>}
          </div>
          <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.62rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', padding: '.2rem .6rem', borderRadius: '100px', background: m.payment_status === 'confirmed' ? `rgba(${c.greenRgb},.1)` : m.payment_status === 'rejected' ? `rgba(${c.redRgb},.1)` : `rgba(${c.goldRgb},.1)`, color: m.payment_status === 'confirmed' ? c.green : m.payment_status === 'rejected' ? c.red : c.gold }}>
              {m.payment_status}
            </span>
            {m.payment_proof && (
              <a href={m.payment_proof} target="_blank" rel="noreferrer" style={{ fontSize: '.72rem', color: c.green, fontWeight: '700' }}>View Proof</a>
            )}
            {m.payment_status === 'pending' && (
              <>
                <button style={{ padding: '.3rem .7rem', borderRadius: '6px', background: c.green, color: c.bg, fontWeight: '800', fontSize: '.72rem', border: 'none', cursor: 'pointer' }} onClick={() => confirm(m.id, m.full_name || m.display_name)}>Confirm ✅</button>
                <button style={{ padding: '.3rem .7rem', borderRadius: '6px', background: 'transparent', border: `1px solid ${c.red}`, color: c.red, fontWeight: '800', fontSize: '.72rem', cursor: 'pointer' }} onClick={() => reject(m.id, m.full_name || m.display_name)}>Reject ❌</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AnnouncementsTab() {
  const { c } = useTheme()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({ title: '', body: '', is_pinned: false })

  useEffect(() => { fetchAnnouncements() }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    const { data } = await supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
    setAnnouncements(data || [])
    setLoading(false)
  }

  const showToast = (msg, bad = false) => {
    setToast({ msg, bad })
    setTimeout(() => setToast(null), 2500)
  }

  const addAnnouncement = async () => {
    if (!form.title || !form.body) return showToast('⚠ Fill all fields', true)
    const { error } = await supabase.from('announcements').insert(form)
    if (error) return showToast('❌ Failed to post', true)
    showToast('✅ Announcement posted!')
    setForm({ title: '', body: '', is_pinned: false })
    fetchAnnouncements()
  }

  const deleteAnnouncement = async (id) => {
    if (!confirm('Delete this announcement?')) return
    await supabase.from('announcements').delete().eq('id', id)
    showToast('Announcement deleted')
    fetchAnnouncements()
  }

  const togglePin = async (id, pinned) => {
    await supabase.from('announcements').update({ is_pinned: !pinned }).eq('id', id)
    fetchAnnouncements()
  }

  if (loading) return <div style={{ padding: '2rem', color: c.muted }}>Loading...</div>

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', background: c.card, border: `1px solid ${c.green}`, color: c.text, padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999 }}>{toast.msg}</div>}
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.4rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: c.text }}>Post Announcement</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
          <input style={{ padding: '.75rem 1rem', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: '.85rem', outline: 'none' }} placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea style={{ padding: '.75rem 1rem', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: '.85rem', outline: 'none', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Message body..." value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.82rem', color: c.muted, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} />
            📌 Pin this announcement
          </label>
          <button style={{ padding: '.8rem', borderRadius: '8px', background: c.green, color: c.bg, fontWeight: '800', fontSize: '.85rem', border: 'none', cursor: 'pointer', letterSpacing: '1px' }} onClick={addAnnouncement}>POST ANNOUNCEMENT</button>
        </div>
      </div>
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.4rem' }}>
        <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: c.text }}>All Announcements ({announcements.length})</div>
        {announcements.length === 0 && <div style={{ color: c.muted, fontSize: '.85rem' }}>No announcements yet</div>}
        {announcements.map(a => (
          <div key={a.id} style={{ padding: '.85rem 0', borderBottom: `1px solid ${c.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '.88rem', color: c.text }}>{a.is_pinned && '📌 '}{a.title}</div>
                <div style={{ fontSize: '.75rem', color: c.muted, marginTop: '.3rem' }}>{a.body}</div>
                <div style={{ fontSize: '.65rem', color: c.muted, marginTop: '.3rem' }}>{new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <div style={{ display: 'flex', gap: '.4rem' }}>
                <button style={{ padding: '.3rem .6rem', borderRadius: '6px', background: a.is_pinned ? `rgba(${c.goldRgb},.1)` : 'transparent', border: `1px solid ${c.gold}`, color: c.gold, fontSize: '.7rem', fontWeight: '700', cursor: 'pointer' }} onClick={() => togglePin(a.id, a.is_pinned)}>{a.is_pinned ? 'Unpin' : 'Pin'}</button>
                <button style={{ padding: '.3rem .6rem', borderRadius: '6px', background: 'transparent', border: `1px solid ${c.red}`, color: c.red, fontSize: '.7rem', fontWeight: '700', cursor: 'pointer' }} onClick={() => deleteAnnouncement(a.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SeasonTab() {
  const { c } = useTheme()
  const [loading, setLoading] = useState(true)
  const [seasonStatus, setSeasonStatus] = useState('active')
  const [seasonName, setSeasonName] = useState('2025/26')
  const [champion, setChampion] = useState(null)
  const [topManagers, setTopManagers] = useState([])
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: settings }, { data: managers }] = await Promise.all([
      supabase.from('settings').select('*'),
      supabase.from('managers').select('*').eq('payment_status', 'confirmed').order('total_points', { ascending: false }).limit(3)
    ])
    const status = settings?.find(s => s.id === 'season_status')?.value || 'active'
    const name = settings?.find(s => s.id === 'season_name')?.value || '2025/26'
    setSeasonStatus(status)
    setSeasonName(name)
    setTopManagers(managers || [])
    if (managers?.length > 0) setChampion(managers[0])
    setLoading(false)
  }

  const showToast = (msg, bad = false) => {
    setToast({ msg, bad })
    setTimeout(() => setToast(null), 3000)
  }

  const endSeason = async () => {
    if (!confirm(`End the ${seasonName} season? This will crown the champion and lock the final standings.`)) return
    await supabase.from('settings').update({ value: 'ended' }).eq('id', 'season_status')
    if (champion) {
      await supabase.from('announcements').insert({
        title: `🏆 ${seasonName} Season Champion!`,
        body: `Congratulations to ${champion.team_name || champion.full_name} for winning the Funaabsu League Prediction ${seasonName} season with ${champion.total_points} points! 🎉`,
        is_pinned: true
      })
    }
    showToast('🏆 Season ended! Champion crowned!')
    fetchData()
  }

  const resetSeason = async () => {
    if (!confirm('Start a new season? This will reset ALL points and prediction history. This cannot be undone.')) return
    await supabase.from('managers').update({ total_points: 0 }).eq('payment_status', 'confirmed')
    await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('settings').update({ value: 'active' }).eq('id', 'season_status')
    await supabase.from('settings').update({ value: '2026/27' }).eq('id', 'season_name')
    showToast('✅ New season started!')
    fetchData()
  }

  if (loading) return <div style={{ padding: '2rem', color: c.muted }}>Loading...</div>

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', background: c.card, border: `1px solid ${c.green}`, color: c.text, padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999 }}>{toast.msg}</div>}
      <div style={{ background: seasonStatus === 'ended' ? `rgba(${c.goldRgb},.04)` : `rgba(${c.greenRgb},.04)`, border: `1px solid ${seasonStatus === 'ended' ? `rgba(${c.goldRgb},.2)` : `rgba(${c.greenRgb},.2)`}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.2rem' }}>
        <div style={{ fontSize: '.65rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: c.muted, marginBottom: '.4rem' }}>Current Season</div>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', lineHeight: 1, marginBottom: '.4rem', color: c.text }}>{seasonName}</div>
        <span style={{ fontSize: '.72rem', fontWeight: '800', letterSpacing: '1px', padding: '.3rem .8rem', borderRadius: '100px', background: seasonStatus === 'active' ? `rgba(${c.greenRgb},.1)` : `rgba(${c.goldRgb},.1)`, color: seasonStatus === 'active' ? c.green : c.gold }}>
          {seasonStatus === 'active' ? '🟢 ACTIVE' : '🏁 ENDED'}
        </span>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.4rem', marginBottom: '1.2rem' }}>
        <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: c.text }}>🏆 Current Standings</div>
        {topManagers.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.7rem 0', borderBottom: i < topManagers.length - 1 ? `1px solid ${c.border}` : 'none' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: i === 0 ? c.gold : i === 1 ? '#B0BEC5' : '#C97038' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '.88rem', color: c.text }}>{m.team_name || m.full_name}</div>
              <div style={{ fontSize: '.72rem', color: c.muted }}>{m.department}</div>
            </div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: c.green }}>{m.total_points}</div>
          </div>
        ))}
      </div>

      {seasonStatus === 'ended' && champion && (
        <div style={{ background: `linear-gradient(135deg,rgba(${c.goldRgb},.1),rgba(${c.goldRgb},.03))`, border: `1px solid rgba(${c.goldRgb},.3)`, borderRadius: '12px', padding: '2rem', marginBottom: '1.2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>🏆</div>
          <div style={{ fontSize: '.7rem', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase', color: c.gold, marginBottom: '.3rem' }}>Season Champion</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: c.gold, lineHeight: 1 }}>{champion.team_name || champion.full_name}</div>
          <div style={{ color: c.muted, fontSize: '.85rem', marginTop: '.4rem' }}>{champion.total_points} points · {champion.department}</div>
        </div>
      )}

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
        <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '.3rem', color: c.text }}>Season Actions</div>
        {seasonStatus === 'active' && (
          <button style={{ padding: '.9rem', borderRadius: '8px', background: `rgba(${c.goldRgb},.1)`, border: `1px solid ${c.gold}`, color: c.gold, fontWeight: '800', fontSize: '.85rem', cursor: 'pointer', letterSpacing: '1px' }} onClick={endSeason}>
            🏁 End Season & Crown Champion
          </button>
        )}
        <button style={{ padding: '.9rem', borderRadius: '8px', background: `rgba(${c.redRgb},.1)`, border: `1px solid ${c.red}`, color: c.red, fontWeight: '800', fontSize: '.85rem', cursor: 'pointer', letterSpacing: '1px' }} onClick={resetSeason}>
          🔄 Reset & Start New Season
        </button>
        <p style={{ fontSize: '.75rem', color: c.muted, lineHeight: 1.6 }}>
          ⚠ Ending the season crowns the current leader as champion. Resetting clears all points, predictions and matches for a fresh season.
        </p>
      </div>
    </div>
  )
}
