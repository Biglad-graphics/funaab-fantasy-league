import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TABS = ['Matches', 'Results', 'Payments', 'Announcements', 'Season']

export default function Admin() {
  const [tab, setTab] = useState('Matches')
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [mForm, setMForm] = useState({ home_team: '', away_team: '', matchday: 1, venue: '', kickoff_time: '', prediction_deadline: '' })
  const [resultForms, setResultForms] = useState({})
  const [saving, setSaving] = useState({})

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('matches').select('*').order('matchday', { ascending: false })
    ])
    setTeams(t || [])
    setMatches(m || [])
    setLoading(false)
  }

  const showToast = (msg, bad = false) => {
    setToast({ msg, bad })
    setTimeout(() => setToast(null), 3000)
  }

  const addMatch = async () => {
    if (!mForm.home_team || !mForm.away_team) return showToast('⚠ Fill all fields', true)
    const { error } = await supabase.from('matches').insert(mForm)
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

  const enterResult = async (match) => {
    const form = resultForms[match.id] || {}
    const homeScore = parseInt(form.home)
    const awayScore = parseInt(form.away)
    if (isNaN(homeScore) || isNaN(awayScore)) return showToast('⚠ Enter valid scores for both teams', true)
    if (match.result_outcome) return showToast('⚠ Result already confirmed for this match', true)

    setSaving(prev => ({ ...prev, [match.id]: true }))
    const outcome = homeScore > awayScore ? 'HOME' : awayScore > homeScore ? 'AWAY' : 'DRAW'

    await supabase.from('matches').update({
      home_score: homeScore,
      away_score: awayScore,
      status: 'completed',
      result_outcome: outcome
    }).eq('id', match.id)

    const { data: preds } = await supabase.from('predictions').select('*').eq('match_id', match.id)
    const managerPointsMap = {}

    for (const pred of preds || []) {
      let pts = 0
      if (pred.home_score_pred === homeScore && pred.away_score_pred === awayScore) {
        pts = 5
      } else if (pred.predicted_outcome === outcome) {
        pts = 3
      }
      managerPointsMap[pred.manager_id] = (managerPointsMap[pred.manager_id] || 0) + pts
      await supabase.from('predictions').update({ points_earned: pts }).eq('id', pred.id)
    }

    for (const [managerId, pts] of Object.entries(managerPointsMap)) {
      if (pts > 0) {
        const { data: mgr } = await supabase.from('managers').select('total_points').eq('id', managerId).single()
        await supabase.from('managers').update({ total_points: (mgr?.total_points || 0) + pts }).eq('id', managerId)
      }
    }

    setSaving(prev => ({ ...prev, [match.id]: false }))
    setResultForms(prev => { const n = { ...prev }; delete n[match.id]; return n })
    const predCount = (preds || []).length
    showToast(`✅ ${homeScore}—${awayScore} confirmed. ${predCount} prediction${predCount !== 1 ? 's' : ''} processed!`)
    fetchAll()
  }

  if (loading) return <div style={{ padding: '2rem', color: '#5A7A5E' }}>Loading...</div>

  const now = new Date()
  // Matches whose kickoff has passed but result not yet entered
  const pendingMatches = matches.filter(m => m.status !== 'completed' && m.kickoff_time && now >= new Date(m.kickoff_time))
  // Matches not yet kicked off (still upcoming)
  const upcomingMatches = matches.filter(m => m.status !== 'completed' && (!m.kickoff_time || now < new Date(m.kickoff_time)))
  const completedMatches = matches.filter(m => m.status === 'completed')

  return (
    <div style={styles.wrap}>
      {toast && <div style={{ ...styles.toast, ...(toast.bad ? styles.toastBad : {}) }}>{toast.msg}</div>}
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>🔐 Admin</div>
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
                <label style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#5A7A5E', display: 'block', marginBottom: '.4rem' }}>
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
              <div key={m.id} style={styles.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{m.home_team} vs {m.away_team}</div>
                  <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>
                    GW{m.matchday} · {m.venue || 'TBD'}
                    {m.status === 'completed' && ` · ${m.home_score}—${m.away_score}`}
                  </div>
                  {m.prediction_deadline && m.status === 'scheduled' && (
                    <div style={{ fontSize: '.65rem', color: new Date() > new Date(m.prediction_deadline) ? '#EF9A9A' : '#FFD700', marginTop: '.2rem' }}>
                      🔒 Deadline: {new Date(m.prediction_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {new Date() > new Date(m.prediction_deadline) ? ' · Closed' : ''}
                    </div>
                  )}
                </div>
                <span style={{ ...styles.badge, background: m.status === 'completed' ? 'rgba(90,122,94,.1)' : m.kickoff_time && new Date() >= new Date(m.kickoff_time) ? 'rgba(0,230,118,.1)' : 'rgba(100,181,246,.1)', color: m.status === 'completed' ? '#5A7A5E' : m.kickoff_time && new Date() >= new Date(m.kickoff_time) ? '#00E676' : '#64B5F6' }}>
                  {m.status === 'completed' ? 'completed' : m.kickoff_time && new Date() >= new Date(m.kickoff_time) ? 'live' : 'scheduled'}
                </span>
                {m.status !== 'completed' && (
                  <button style={{ ...styles.btn, background: 'transparent', border: '1px solid #EF9A9A', color: '#EF9A9A', padding: '.3rem .6rem', fontSize: '.72rem' }} onClick={() => deleteMatch(m.id)}>✕</button>
                )}
              </div>
            ))}
            {matches.length === 0 && <div style={{ padding: '1.5rem', color: '#5A7A5E', textAlign: 'center' }}>No matches yet</div>}
          </div>
        </div>
      )}

      {tab === 'Results' && (
        <div>
          {pendingMatches.length > 0 && (
            <div style={{ ...styles.card, marginBottom: '1rem' }}>
              <div style={styles.cardTitle}>🔴 In Progress — Enter Results</div>
              <p style={{ fontSize: '.78rem', color: '#5A7A5E', marginBottom: '1.2rem', lineHeight: 1.6 }}>
                Enter the final score to automatically award prediction points. This cannot be undone.
              </p>
              {pendingMatches.map(m => {
                const form = resultForms[m.id] || {}
                return (
                  <div key={m.id} style={{ display: 'flex', gap: '.8rem', paddingBottom: '1.2rem', marginBottom: '1.2rem', borderBottom: '1px solid #1E2E20', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{m.home_team} vs {m.away_team}</div>
                      <div style={{ fontSize: '.7rem', color: '#5A7A5E', marginBottom: '.3rem' }}>GW{m.matchday}</div>
                      <span style={{ fontSize: '.62rem', fontWeight: '800', letterSpacing: '1px', padding: '.2rem .5rem', borderRadius: '100px', background: 'rgba(0,230,118,.1)', color: '#00E676', textTransform: 'uppercase' }}>
                        🔴 In Progress
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                      <input
                        type="number" min="0" max="20" placeholder="0"
                        value={form.home || ''}
                        onChange={e => setResultForms(prev => ({ ...prev, [m.id]: { ...prev[m.id], home: e.target.value } }))}
                        style={{ width: '54px', padding: '.5rem', borderRadius: '6px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '1rem', fontWeight: '700', textAlign: 'center', outline: 'none' }}
                      />
                      <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: '#5A7A5E' }}>—</span>
                      <input
                        type="number" min="0" max="20" placeholder="0"
                        value={form.away || ''}
                        onChange={e => setResultForms(prev => ({ ...prev, [m.id]: { ...prev[m.id], away: e.target.value } }))}
                        style={{ width: '54px', padding: '.5rem', borderRadius: '6px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '1rem', fontWeight: '700', textAlign: 'center', outline: 'none' }}
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
                )
              })}
            </div>
          )}

          {upcomingMatches.length > 0 && (
            <div style={{ ...styles.card, marginBottom: '1rem', background: 'rgba(100,181,246,.03)', borderColor: 'rgba(100,181,246,.15)' }}>
              <div style={styles.cardTitle}>⏰ Upcoming — not kicked off yet</div>
              {upcomingMatches.map(m => (
                <div key={m.id} style={styles.row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{m.home_team} vs {m.away_team}</div>
                    <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>GW{m.matchday} · {m.kickoff_time ? new Date(m.kickoff_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'TBD'}</div>
                  </div>
                  <span style={{ ...styles.badge, background: 'rgba(100,181,246,.1)', color: '#64B5F6' }}>upcoming</span>
                </div>
              ))}
            </div>
          )}

          {pendingMatches.length === 0 && completedMatches.length === 0 && upcomingMatches.length === 0 && (
            <div style={styles.card}>
              <div style={{ padding: '1.5rem', color: '#5A7A5E', textAlign: 'center' }}>No matches to manage yet</div>
            </div>
          )}

          {completedMatches.length > 0 && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Confirmed Results</div>
              {completedMatches.map(m => (
                <div key={m.id} style={styles.row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{m.home_team} vs {m.away_team}</div>
                    <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>GW{m.matchday} · {m.venue || 'TBD'}</div>
                  </div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: '#E8F5E9', minWidth: '64px', textAlign: 'center' }}>
                    {m.home_score}—{m.away_score}
                  </div>
                  <span style={{ ...styles.badge, background: 'rgba(90,122,94,.1)', color: '#5A7A5E' }}>
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

  if (loading) return <div style={{ padding: '2rem', color: '#5A7A5E' }}>Loading...</div>

  return (
    <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem' }}>
      {toast && <div style={{ position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', background: '#111A13', border: '1px solid #00E676', color: '#E8F5E9', padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999 }}>{toast.msg}</div>}
      <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: '#E8F5E9' }}>Payment Submissions ({payments.length})</div>
      {payments.length === 0 && <div style={{ color: '#5A7A5E', fontSize: '.85rem' }}>No submissions yet</div>}
      {payments.map(m => (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.85rem 0', borderBottom: '1px solid #1E2E20', flexWrap: 'wrap', gap: '.5rem' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{m.full_name || m.display_name || 'Unknown'}</div>
            <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>{m.matric_number} · {m.department}</div>
            {m.transaction_id && <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>TXN: {m.transaction_id}</div>}
          </div>
          <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.62rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', padding: '.2rem .6rem', borderRadius: '100px', background: m.payment_status === 'confirmed' ? 'rgba(0,230,118,.1)' : m.payment_status === 'rejected' ? 'rgba(239,154,154,.1)' : 'rgba(255,215,0,.1)', color: m.payment_status === 'confirmed' ? '#00E676' : m.payment_status === 'rejected' ? '#EF9A9A' : '#FFD700' }}>
              {m.payment_status}
            </span>
            {m.payment_proof && (
              <a href={m.payment_proof} target="_blank" rel="noreferrer" style={{ fontSize: '.72rem', color: '#00E676', fontWeight: '700' }}>View Proof</a>
            )}
            {m.payment_status === 'pending' && (
              <>
                <button style={{ padding: '.3rem .7rem', borderRadius: '6px', background: '#00E676', color: '#080C0A', fontWeight: '800', fontSize: '.72rem', border: 'none', cursor: 'pointer' }} onClick={() => confirm(m.id, m.full_name || m.display_name)}>Confirm ✅</button>
                <button style={{ padding: '.3rem .7rem', borderRadius: '6px', background: 'transparent', border: '1px solid #EF9A9A', color: '#EF9A9A', fontWeight: '800', fontSize: '.72rem', cursor: 'pointer' }} onClick={() => reject(m.id, m.full_name || m.display_name)}>Reject ❌</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AnnouncementsTab() {
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

  if (loading) return <div style={{ padding: '2rem', color: '#5A7A5E' }}>Loading...</div>

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', background: '#111A13', border: '1px solid #00E676', color: '#E8F5E9', padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999 }}>{toast.msg}</div>}
      <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: '#E8F5E9' }}>Post Announcement</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
          <input style={{ padding: '.75rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '.85rem', outline: 'none' }} placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea style={{ padding: '.75rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '.85rem', outline: 'none', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Message body..." value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.82rem', color: '#5A7A5E', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} />
            📌 Pin this announcement
          </label>
          <button style={{ padding: '.8rem', borderRadius: '8px', background: '#00E676', color: '#080C0A', fontWeight: '800', fontSize: '.85rem', border: 'none', cursor: 'pointer', letterSpacing: '1px' }} onClick={addAnnouncement}>POST ANNOUNCEMENT</button>
        </div>
      </div>
      <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem' }}>
        <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: '#E8F5E9' }}>All Announcements ({announcements.length})</div>
        {announcements.length === 0 && <div style={{ color: '#5A7A5E', fontSize: '.85rem' }}>No announcements yet</div>}
        {announcements.map(a => (
          <div key={a.id} style={{ padding: '.85rem 0', borderBottom: '1px solid #1E2E20' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{a.is_pinned && '📌 '}{a.title}</div>
                <div style={{ fontSize: '.75rem', color: '#5A7A5E', marginTop: '.3rem' }}>{a.body}</div>
                <div style={{ fontSize: '.65rem', color: '#5A7A5E', marginTop: '.3rem' }}>{new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <div style={{ display: 'flex', gap: '.4rem' }}>
                <button style={{ padding: '.3rem .6rem', borderRadius: '6px', background: a.is_pinned ? 'rgba(255,215,0,.1)' : 'transparent', border: '1px solid #FFD700', color: '#FFD700', fontSize: '.7rem', fontWeight: '700', cursor: 'pointer' }} onClick={() => togglePin(a.id, a.is_pinned)}>{a.is_pinned ? 'Unpin' : 'Pin'}</button>
                <button style={{ padding: '.3rem .6rem', borderRadius: '6px', background: 'transparent', border: '1px solid #EF9A9A', color: '#EF9A9A', fontSize: '.7rem', fontWeight: '700', cursor: 'pointer' }} onClick={() => deleteAnnouncement(a.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SeasonTab() {
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
        body: `Congratulations to ${champion.team_name || champion.full_name} for winning the FUNAAB Prediction League ${seasonName} season with ${champion.total_points} points! 🎉`,
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

  if (loading) return <div style={{ padding: '2rem', color: '#5A7A5E' }}>Loading...</div>

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', background: '#111A13', border: '1px solid #00E676', color: '#E8F5E9', padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999 }}>{toast.msg}</div>}
      <div style={{ background: seasonStatus === 'ended' ? 'rgba(255,215,0,.04)' : 'rgba(0,230,118,.04)', border: `1px solid ${seasonStatus === 'ended' ? 'rgba(255,215,0,.2)' : 'rgba(0,230,118,.2)'}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.2rem' }}>
        <div style={{ fontSize: '.65rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '.4rem' }}>Current Season</div>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', lineHeight: 1, marginBottom: '.4rem' }}>{seasonName}</div>
        <span style={{ fontSize: '.72rem', fontWeight: '800', letterSpacing: '1px', padding: '.3rem .8rem', borderRadius: '100px', background: seasonStatus === 'active' ? 'rgba(0,230,118,.1)' : 'rgba(255,215,0,.1)', color: seasonStatus === 'active' ? '#00E676' : '#FFD700' }}>
          {seasonStatus === 'active' ? '🟢 ACTIVE' : '🏁 ENDED'}
        </span>
      </div>

      <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem', marginBottom: '1.2rem' }}>
        <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: '#E8F5E9' }}>🏆 Current Standings</div>
        {topManagers.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.7rem 0', borderBottom: i < topManagers.length - 1 ? '1px solid #1E2E20' : 'none' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: i === 0 ? '#FFD700' : i === 1 ? '#B0BEC5' : '#C97038' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{m.team_name || m.full_name}</div>
              <div style={{ fontSize: '.72rem', color: '#5A7A5E' }}>{m.department}</div>
            </div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: '#00E676' }}>{m.total_points}</div>
          </div>
        ))}
      </div>

      {seasonStatus === 'ended' && champion && (
        <div style={{ background: 'linear-gradient(135deg,rgba(255,215,0,.1),rgba(255,215,0,.03))', border: '1px solid rgba(255,215,0,.3)', borderRadius: '12px', padding: '2rem', marginBottom: '1.2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>🏆</div>
          <div style={{ fontSize: '.7rem', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase', color: '#FFD700', marginBottom: '.3rem' }}>Season Champion</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: '#FFD700', lineHeight: 1 }}>{champion.team_name || champion.full_name}</div>
          <div style={{ color: '#5A7A5E', fontSize: '.85rem', marginTop: '.4rem' }}>{champion.total_points} points · {champion.department}</div>
        </div>
      )}

      <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
        <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '.3rem', color: '#E8F5E9' }}>Season Actions</div>
        {seasonStatus === 'active' && (
          <button style={{ padding: '.9rem', borderRadius: '8px', background: 'rgba(255,215,0,.1)', border: '1px solid #FFD700', color: '#FFD700', fontWeight: '800', fontSize: '.85rem', cursor: 'pointer', letterSpacing: '1px' }} onClick={endSeason}>
            🏁 End Season & Crown Champion
          </button>
        )}
        <button style={{ padding: '.9rem', borderRadius: '8px', background: 'rgba(239,154,154,.1)', border: '1px solid #EF9A9A', color: '#EF9A9A', fontWeight: '800', fontSize: '.85rem', cursor: 'pointer', letterSpacing: '1px' }} onClick={resetSeason}>
          🔄 Reset & Start New Season
        </button>
        <p style={{ fontSize: '.75rem', color: '#5A7A5E', lineHeight: 1.6 }}>
          ⚠ Ending the season crowns the current leader as champion. Resetting clears all points, predictions and matches for a fresh season.
        </p>
      </div>
    </div>
  )
}

const styles = {
  wrap: { padding: '2rem 0' },
  title: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '2px', marginBottom: '1.2rem' },
  tabs: { display: 'flex', gap: '.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' },
  tab: { background: '#111A13', border: '1px solid #1E2E20', borderRadius: '8px', padding: '.5rem 1rem', fontSize: '.78rem', fontWeight: '700', letterSpacing: '1px', color: '#5A7A5E', cursor: 'pointer' },
  tabActive: { background: 'rgba(0,230,118,.09)', borderColor: '#00E676', color: '#00E676' },
  card: { background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem' },
  cardTitle: { fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: '#E8F5E9' },
  form: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem' },
  input: { padding: '.75rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '.85rem', outline: 'none', width: '100%' },
  btn: { padding: '.75rem 1rem', borderRadius: '8px', background: '#00E676', color: '#080C0A', fontWeight: '800', fontSize: '.82rem', border: 'none', cursor: 'pointer', letterSpacing: '1px' },
  row: { display: 'flex', alignItems: 'center', gap: '.8rem', paddingBottom: '.7rem', marginBottom: '.7rem', borderBottom: '1px solid #1E2E20' },
  badge: { fontSize: '.62rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '.2rem .6rem', borderRadius: '100px' },
  toast: { position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', background: '#111A13', border: '1px solid #00E676', color: '#E8F5E9', padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999 },
  toastBad: { borderColor: '#EF9A9A', color: '#EF9A9A' }
}
