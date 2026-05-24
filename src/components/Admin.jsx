import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TABS = ['Players', 'Matches', 'Live Match', 'Payments']
const POSITION_PRICES = { GK: 5.0, DF: 6.0, MF: 7.0, FW: 8.0 }

export default function Admin() {
  const [tab, setTab] = useState('Payments')
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [pForm, setPForm] = useState({ name: '', position: 'GK', team: '', price: 5.0 })
  const [mForm, setMForm] = useState({ home_team: '', away_team: '', matchday: 1, venue: '', kickoff_time: '' })
  const [liveMatch, setLiveMatch] = useState(null)
  const [matchPlayers, setMatchPlayers] = useState([])
  const [eventForm, setEventForm] = useState({ player_id: '', event_type: 'goal', minute: '' })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from('players').select('*').order('position'),
      supabase.from('matches').select('*').order('matchday', { ascending: false })
    ])
    setPlayers(p || [])
    setMatches(m || [])
    setLoading(false)
  }

  const showToast = (msg, bad = false) => {
    setToast({ msg, bad })
    setTimeout(() => setToast(null), 2500)
  }

  const addPlayer = async () => {
    if (!pForm.name || !pForm.team) return showToast('⚠ Fill all fields', true)
    const { error } = await supabase.from('players').insert(pForm)
    if (error) return showToast('❌ Failed to add player', true)
    showToast(`✅ ${pForm.name} added!`)
    setPForm({ name: '', position: 'GK', team: '', price: 5.0 })
    fetchAll()
  }

  const deletePlayer = async (id, name) => {
    if (!confirm(`Remove ${name}?`)) return
    await supabase.from('players').delete().eq('id', id)
    showToast(`${name} removed`)
    fetchAll()
  }

  const addMatch = async () => {
    if (!mForm.home_team || !mForm.away_team) return showToast('⚠ Fill all fields', true)
    const { error } = await supabase.from('matches').insert(mForm)
    if (error) return showToast('❌ Failed to add match', true)
    showToast('✅ Match created!')
    setMForm({ home_team: '', away_team: '', matchday: 1, venue: '', kickoff_time: '' })
    fetchAll()
  }

  const goLive = async (match) => {
    await supabase.from('matches').update({ status: 'live' }).eq('id', match.id)
    setLiveMatch(match)
    const { data } = await supabase.from('players').select('*').order('position')
    setMatchPlayers(data || [])
    showToast(`🔴 ${match.home_team} vs ${match.away_team} is LIVE`)
    fetchAll()
  }

  const endMatch = async () => {
    if (!liveMatch) return
    await supabase.from('matches').update({ status: 'completed' }).eq('id', liveMatch.id)
    showToast('✅ Match ended')
    setLiveMatch(null)
    fetchAll()
  }

  const addEvent = async () => {
    if (!eventForm.player_id || !liveMatch) return showToast('⚠ Select a player', true)
    const { error } = await supabase.from('match_events').insert({
      match_id: liveMatch.id,
      player_id: eventForm.player_id,
      event_type: eventForm.event_type,
      minute: eventForm.minute ? parseInt(eventForm.minute) : null
    })
    if (error) return showToast('❌ Failed to add event', true)
    const player = matchPlayers.find(p => p.id === eventForm.player_id)
    showToast(`✅ ${eventForm.event_type} — ${player?.name}`)
    setEventForm({ player_id: '', event_type: 'goal', minute: '' })
  }

  if (loading) return <div style={{ padding: '2rem', color: '#5A7A5E' }}>Loading...</div>

  return (
    <div style={styles.wrap}>
      {toast && <div style={{ ...styles.toast, ...(toast.bad ? styles.toastBad : {}) }}>{toast.msg}</div>}

      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>🔐 Admin</div>
      <h2 style={styles.title}>Control Center</h2>

      <div style={styles.tabs}>
        {TABS.map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === 'Players' ? '👤 ' : t === 'Matches' ? '📅 ' : t === 'Live Match' ? '🔴 ' : '💳 '}{t}
          </button>
        ))}
      </div>

      {/* PLAYERS */}
      {tab === 'Players' && (
        <div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Add New Player</div>
            <div style={styles.form}>
              <input style={styles.input} placeholder="Player Name" value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} />
              <select style={styles.input} value={pForm.position} onChange={e => setPForm({ ...pForm, position: e.target.value, price: POSITION_PRICES[e.target.value] })}>
                <option>GK</option><option>DF</option><option>MF</option><option>FW</option>
              </select>
              <input style={styles.input} placeholder="Team Name" value={pForm.team} onChange={e => setPForm({ ...pForm, team: e.target.value })} />
              <input style={styles.input} type="number" placeholder="Price (₦M)" value={pForm.price} onChange={e => setPForm({ ...pForm, price: parseFloat(e.target.value) })} />
              <button style={{ ...styles.btn, gridColumn: 'span 2' }} onClick={addPlayer}>Add Player</button>
            </div>
          </div>
          <div style={{ ...styles.card, marginTop: '1rem' }}>
            <div style={styles.cardTitle}>All Players ({players.length})</div>
            {players.map(p => (
              <div key={p.id} style={styles.row}>
                <div style={{ ...styles.posBadge, background: p.position === 'GK' ? 'rgba(255,215,0,.1)' : p.position === 'DF' ? 'rgba(0,230,118,.1)' : p.position === 'MF' ? 'rgba(100,181,246,.1)' : 'rgba(239,154,154,.1)', color: p.position === 'GK' ? '#FFD700' : p.position === 'DF' ? '#00E676' : p.position === 'MF' ? '#64B5F6' : '#EF9A9A' }}>{p.position}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '.85rem' }}>{p.name}</div>
                  <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>{p.team}</div>
                </div>
                <div style={{ fontSize: '.75rem', color: '#5A7A5E' }}>{p.goals ?? 0}⚽ {p.assists ?? 0}🅰</div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#FFD700' }}>₦{p.price}M</div>
                <button style={{ ...styles.btn, background: 'transparent', border: '1px solid #EF9A9A', color: '#EF9A9A', padding: '.3rem .6rem', fontSize: '.72rem' }} onClick={() => deletePlayer(p.id, p.name)}>✕</button>
              </div>
            ))}
            {players.length === 0 && <div style={{ padding: '1.5rem', color: '#5A7A5E', textAlign: 'center' }}>No players yet</div>}
          </div>
        </div>
      )}

      {/* MATCHES */}
      {tab === 'Matches' && (
        <div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Create Match</div>
            <div style={styles.form}>
              <input style={styles.input} placeholder="Home Team" value={mForm.home_team} onChange={e => setMForm({ ...mForm, home_team: e.target.value })} />
              <input style={styles.input} placeholder="Away Team" value={mForm.away_team} onChange={e => setMForm({ ...mForm, away_team: e.target.value })} />
              <input style={styles.input} type="number" placeholder="Matchday" value={mForm.matchday} onChange={e => setMForm({ ...mForm, matchday: parseInt(e.target.value) })} />
              <input style={styles.input} placeholder="Venue" value={mForm.venue} onChange={e => setMForm({ ...mForm, venue: e.target.value })} />
              <input style={styles.input} type="datetime-local" value={mForm.kickoff_time} onChange={e => setMForm({ ...mForm, kickoff_time: e.target.value })} />
              <button style={{ ...styles.btn, gridColumn: 'span 2' }} onClick={addMatch}>Create Match</button>
            </div>
          </div>
          <div style={{ ...styles.card, marginTop: '1rem' }}>
            <div style={styles.cardTitle}>All Matches</div>
            {matches.map(m => (
              <div key={m.id} style={styles.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{m.home_team} vs {m.away_team}</div>
                  <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>GW{m.matchday} · {m.venue || 'TBD'}</div>
                </div>
                <span style={{ ...styles.badge, background: m.status === 'live' ? 'rgba(0,230,118,.1)' : m.status === 'completed' ? 'rgba(90,122,94,.1)' : 'rgba(100,181,246,.1)', color: m.status === 'live' ? '#00E676' : m.status === 'completed' ? '#5A7A5E' : '#64B5F6' }}>{m.status}</span>
                {m.status === 'scheduled' && (
                  <button style={{ ...styles.btn, padding: '.35rem .9rem', fontSize: '.72rem' }} onClick={() => { goLive(m); setTab('Live Match') }}>Go Live</button>
                )}
              </div>
            ))}
            {matches.length === 0 && <div style={{ padding: '1.5rem', color: '#5A7A5E', textAlign: 'center' }}>No matches yet</div>}
          </div>
        </div>
      )}

      {/* LIVE MATCH */}
      {tab === 'Live Match' && (
        <div>
          {!liveMatch ? (
            <div style={styles.card}>
              <div style={styles.cardTitle}>No Live Match</div>
              <p style={{ color: '#5A7A5E', fontSize: '.85rem', marginTop: '.5rem' }}>Go to Matches tab and click "Go Live".</p>
            </div>
          ) : (
            <>
              <div style={{ ...styles.card, border: '1px solid rgba(0,230,118,.25)', background: 'rgba(0,230,118,.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '.65rem', fontWeight: '800', letterSpacing: '2px', color: '#00E676', marginBottom: '.3rem' }}>🔴 LIVE</div>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem' }}>{liveMatch.home_team} vs {liveMatch.away_team}</div>
                    <div style={{ fontSize: '.72rem', color: '#5A7A5E' }}>GW{liveMatch.matchday} · {liveMatch.venue || 'TBD'}</div>
                  </div>
                  <button style={{ ...styles.btn, background: 'transparent', border: '1px solid #EF9A9A', color: '#EF9A9A' }} onClick={endMatch}>End Match</button>
                </div>
              </div>
              <div style={{ ...styles.card, marginTop: '1rem' }}>
                <div style={styles.cardTitle}>Add Match Event</div>
                <div style={styles.form}>
                  <select style={styles.input} value={eventForm.player_id} onChange={e => setEventForm({ ...eventForm, player_id: e.target.value })}>
                    <option value="">Select Player</option>
                    {matchPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position} — {p.team})</option>)}
                  </select>
                  <select style={styles.input} value={eventForm.event_type} onChange={e => setEventForm({ ...eventForm, event_type: e.target.value })}>
                    <option value="goal">⚽ Goal</option>
                    <option value="assist">🅰 Assist</option>
                    <option value="yellow">🟨 Yellow Card</option>
                    <option value="red">🟥 Red Card</option>
                    <option value="own_goal">😬 Own Goal</option>
                    <option value="penalty_missed">❌ Penalty Missed</option>
                    <option value="started">▶ Started Match</option>
                    <option value="played_90">✅ Played 90 mins</option>
                  </select>
                  <input style={styles.input} type="number" placeholder="Minute (optional)" value={eventForm.minute} onChange={e => setEventForm({ ...eventForm, minute: e.target.value })} />
                  <button style={{ ...styles.btn, gridColumn: 'span 2' }} onClick={addEvent}>Add Event</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* PAYMENTS */}
      {tab === 'Payments' && <PaymentsTab />}
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
    <div style={styles.card}>
      {toast && <div style={{ ...styles.toast, ...(toast.bad ? styles.toastBad : {}) }}>{toast.msg}</div>}
      <div style={styles.cardTitle}>Payment Submissions ({payments.length})</div>
      {payments.length === 0 && <div style={{ color: '#5A7A5E', fontSize: '.85rem' }}>No submissions yet</div>}
      {payments.map(m => (
        <div key={m.id} style={{ ...styles.row, flexWrap: 'wrap', gap: '.5rem', paddingBottom: '.85rem', marginBottom: '.85rem', borderBottom: '1px solid #1E2E20' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{m.full_name || m.display_name || 'Unknown'}</div>
            <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>{m.matric_number} · {m.department}</div>
            {m.transaction_id && <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>TXN: {m.transaction_id}</div>}
          </div>
          <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ ...styles.badge, background: m.payment_status === 'confirmed' ? 'rgba(0,230,118,.1)' : m.payment_status === 'rejected' ? 'rgba(239,154,154,.1)' : 'rgba(255,215,0,.1)', color: m.payment_status === 'confirmed' ? '#00E676' : m.payment_status === 'rejected' ? '#EF9A9A' : '#FFD700' }}>
              {m.payment_status}
            </span>
            {m.payment_proof && (
              <a href={m.payment_proof} target="_blank" rel="noreferrer" style={{ fontSize: '.72rem', color: '#00E676', fontWeight: '700' }}>View Proof</a>
            )}
            {m.payment_status === 'pending' && (
              <>
                <button style={{ ...styles.btn, padding: '.3rem .7rem', fontSize: '.72rem' }} onClick={() => confirm(m.id, m.full_name || m.display_name)}>Confirm ✅</button>
                <button style={{ ...styles.btn, background: 'transparent', border: '1px solid #EF9A9A', color: '#EF9A9A', padding: '.3rem .7rem', fontSize: '.72rem' }} onClick={() => reject(m.id, m.full_name || m.display_name)}>Reject ❌</button>
              </>
            )}
          </div>
        </div>
      ))}
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
  row: { display: 'flex', alignItems: 'center', gap: '.8rem', paddingBottom: '.7rem', marginBottom: '.7rem' },
  posBadge: { width: '28px', height: '28px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: '800', flexShrink: 0 },
  badge: { fontSize: '.62rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '.2rem .6rem', borderRadius: '100px' },
  toast: { position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#111A13', border: '1px solid #00E676', color: '#E8F5E9', padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999 },
  toastBad: { borderColor: '#EF9A9A', color: '#EF9A9A' }
      }
