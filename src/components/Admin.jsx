import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TABS = ['Players', 'Matches', 'Live Match', 'Payments']

export default function Admin() {
  const [tab, setTab] = useState('Players')
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Player form
  const POSITION_PRICES = { GK: 5.5, DF: 6.0, MF: 7.0, FW: 8.5 }
const [pForm, setPForm] = useState({ name: '', position: 'GK', team: '', price: 5.0 })

  // Match form
  const [mForm, setMForm] = useState({ home_team: '', away_team: '', matchday: 1, venue: '', kickoff_time: '' })

  // Live match
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

  {/* PAYMENTS TAB */}
      {tab === 'Payments' && (
        <PaymentsTab />
      )}

  // ADD PLAYER
  const addPlayer = async () => {
    if (!pForm.name || !pForm.team) return showToast('⚠ Fill all fields', true)
    const { error } = await supabase.from('players').insert(pForm)
    if (error) return showToast('❌ Failed to add player', true)
    showToast(`✅ ${pForm.name} added!`)
    setPForm({ name: '', position: 'GK', team: '', price: 5.0 })
    fetchAll()
  }

  // DELETE PLAYER
  const deletePlayer = async (id, name) => {
    if (!confirm(`Remove ${name}?`)) return
    await supabase.from('players').delete().eq('id', id)
    showToast(`${name} removed`)
    fetchAll()
  }

  // ADD MATCH
  const addMatch = async () => {
    if (!mForm.home_team || !mForm.away_team) return showToast('⚠ Fill all fields', true)
    const { error } = await supabase.from('matches').insert(mForm)
    if (error) return showToast('❌ Failed to add match', true)
    showToast('✅ Match created!')
    setMForm({ home_team: '', away_team: '', matchday: 1, venue: '', kickoff_time: '' })
    fetchAll()
  }

  // SET MATCH LIVE
  const goLive = async (match) => {
    await supabase.from('matches').update({ status: 'live' }).eq('id', match.id)
    setLiveMatch(match)
    const { data } = await supabase.from('players').select('*').order('position')
    setMatchPlayers(data || [])
    showToast(`🔴 ${match.home_team} vs ${match.away_team} is LIVE`)
    fetchAll()
  }

  // END MATCH
  const endMatch = async () => {
    if (!liveMatch) return
    await supabase.from('matches').update({ status: 'completed' }).eq('id', liveMatch.id)
    showToast('✅ Match ended')
    setLiveMatch(null)
    fetchAll()
  }

  // ADD EVENT
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

  if (loading) return <div style={{ padding: '8rem 3rem', color: 'var(--muted)' }}>Loading...</div>

  return (
    <div className="admin-wrap">
      {toast && (
        <div className={`swap-toast show${toast.bad ? ' bad' : ''}`}>{toast.msg}</div>
      )}

      <div className="admin-hd">
        <div>
          <div className="section-tag">🔐 Admin Panel</div>
          <h2 className="section-title" style={{ fontSize: '2rem' }}>Control Center</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t} className={`admin-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'Players' ? '👤 ' : t === 'Matches' ? '📅 ' : '🔴 '}{t}
          </button>
        ))}
      </div>

      {/* PLAYERS TAB */}
      {tab === 'Players' && (
        <div className="admin-section">
          <div className="admin-card">
            <div className="ac-title">Add New Player</div>
            <div className="admin-form">
              <input className="auth-input" placeholder="Player Name" value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} />
             <select className="auth-input" value={pForm.position} onChange={e => setPForm({ ...pForm, position: e.target.value, price: POSITION_PRICES[e.target.value] })}>
                <option>GK</option>
                <option>DF</option>
                <option>MF</option>
                <option>FW</option>
              </select>
              <input className="auth-input" placeholder="Team Name" value={pForm.team} onChange={e => setPForm({ ...pForm, team: e.target.value })} />
              <input className="auth-input" type="number" placeholder="Price (₦M)" value={pForm.price} onChange={e => setPForm({ ...pForm, price: parseFloat(e.target.value) })} />
              <button className="btn-primary" onClick={addPlayer}>Add Player</button>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: '1.2rem' }}>
            <div className="ac-title">All Players ({players.length})</div>
            <div className="player-list">
              {players.map(p => (
                <div key={p.id} className="pool-item">
                  <div className={`pi-pos-b ${p.position === 'GK' ? 'pb-gk' : p.position === 'DF' ? 'pb-def' : p.position === 'MF' ? 'pb-mid' : 'pb-fwd'}`}>{p.position}</div>
                  <div>
                    <div className="pi-name">{p.name}</div>
                    <div className="pi-team">{p.team}</div>
                  </div>
                  <div className="pi-form">{p.goals ?? 0}⚽ {p.assists ?? 0}🅰</div>
                  <div className="pi-price">₦{p.price}M</div>
                  <button className="add-btn" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => deletePlayer(p.id, p.name)}>✕</button>
                </div>
              ))}
              {players.length === 0 && <div style={{ padding: '1.5rem', color: 'var(--muted)', textAlign: 'center' }}>No players yet</div>}
            </div>
          </div>
        </div>
      )}

      {/* MATCHES TAB */}
      {tab === 'Matches' && (
        <div className="admin-section">
          <div className="admin-card">
            <div className="ac-title">Create Match</div>
            <div className="admin-form">
              <input className="auth-input" placeholder="Home Team" value={mForm.home_team} onChange={e => setMForm({ ...mForm, home_team: e.target.value })} />
              <input className="auth-input" placeholder="Away Team" value={mForm.away_team} onChange={e => setMForm({ ...mForm, away_team: e.target.value })} />
              <input className="auth-input" type="number" placeholder="Matchday" value={mForm.matchday} onChange={e => setMForm({ ...mForm, matchday: parseInt(e.target.value) })} />
              <input className="auth-input" placeholder="Venue" value={mForm.venue} onChange={e => setMForm({ ...mForm, venue: e.target.value })} />
              <input className="auth-input" type="datetime-local" value={mForm.kickoff_time} onChange={e => setMForm({ ...mForm, kickoff_time: e.target.value })} />
              <button className="btn-primary" onClick={addMatch}>Create Match</button>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: '1.2rem' }}>
            <div className="ac-title">All Matches</div>
            {matches.map(m => (
              <div key={m.id} className="match-row">
                <div>
                  <div className="mr-teams">{m.home_team} vs {m.away_team}</div>
                  <div className="mr-meta">GW{m.matchday} · {m.venue || 'TBD'}</div>
                </div>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <span className={`status-badge ${m.status}`}>{m.status}</span>
                  {m.status === 'scheduled' && (
                    <button className="btn-primary" style={{ padding: '.35rem .9rem', fontSize: '.72rem' }} onClick={() => { goLive(m); setTab('Live Match') }}>
                      Go Live
                    </button>
                  )}
                </div>
              </div>
            ))}
            {matches.length === 0 && <div style={{ padding: '1.5rem', color: 'var(--muted)', textAlign: 'center' }}>No matches yet</div>}
          </div>
        </div>
      )}

      {/* LIVE MATCH TAB */}
      {tab === 'Live Match' && (
        <div className="admin-section">
          {!liveMatch ? (
            <div className="admin-card">
              <div className="ac-title">No Live Match</div>
              <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: '.5rem' }}>
                Go to Matches tab and click "Go Live" to start a match.
              </p>
            </div>
          ) : (
            <>
              <div className="live-banner">
                <div>
                  <div className="live-tag"><span className="live-dot" />LIVE</div>
                  <div className="live-fixture">{liveMatch.home_team} vs {liveMatch.away_team}</div>
                  <div className="live-meta">GW{liveMatch.matchday} · {liveMatch.venue || 'TBD'}</div>
                </div>
                <button className="btn-outline" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={endMatch}>
                  End Match
                </button>
              </div>

              <div className="admin-card" style={{ marginTop: '1.2rem' }}>
                <div className="ac-title">Add Match Event</div>
                <div className="admin-form">
                  <select className="auth-input" value={eventForm.player_id} onChange={e => setEventForm({ ...eventForm, player_id: e.target.value })}>
                    <option value="">Select Player</option>
                    {matchPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.position} — {p.team})</option>
                    ))}
                  </select>
                  <select className="auth-input" value={eventForm.event_type} onChange={e => setEventForm({ ...eventForm, event_type: e.target.value })}>
                    <option value="goal">⚽ Goal</option>
                    <option value="assist">🅰 Assist</option>
                    <option value="yellow">🟨 Yellow Card</option>
                    <option value="red">🟥 Red Card</option>
                    <option value="own_goal">😬 Own Goal</option>
                    <option value="penalty_missed">❌ Penalty Missed</option>
                    <option value="started">▶ Started Match</option>
                    <option value="played_90">✅ Played 90 mins</option>
                  </select>
                  <input className="auth-input" type="number" placeholder="Minute (optional)" value={eventForm.minute} onChange={e => setEventForm({ ...eventForm, minute: e.target.value })} />
                  <button className="btn-primary" onClick={addEvent}>Add Event</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )

  function PaymentsTab() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchPayments() }, [])

  const fetchPayments = async () => {
  setLoading(true)
  const { data, error } = await supabase
    .from('managers')
    .select('*')
  alert(JSON.stringify({ count: data?.length, error: error?.message }))
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

  if (loading) return <div style={{ padding: '2rem', color: 'var(--muted)' }}>Loading...</div>

  return (
    <div className="admin-section">
      {toast && <div className={`swap-toast show${toast.bad ? ' bad' : ''}`}>{toast.msg}</div>}
      <div className="admin-card">
        <div className="ac-title">Payment Submissions ({payments.length})</div>
        {payments.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: '.85rem' }}>No submissions yet</div>
        )}
        {payments.map(m => (
          <div key={m.id} className="payment-row">
            <div>
              <div className="mr-teams">{m.display_name}</div>
              <div className="mr-meta">{m.department}</div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`status-badge ${m.payment_status}`}>{m.payment_status}</span>
              {m.payment_proof && (
                <a href={m.payment_proof} target="_blank" rel="noreferrer"
                  style={{ fontSize: '.72rem', color: 'var(--green)', fontWeight: '700' }}>
                  View Screenshot
                </a>
              )}
              {m.payment_status === 'pending' && (
                <>
                  <button className="btn-primary" style={{ padding: '.35rem .9rem', fontSize: '.72rem' }}
                    onClick={() => confirm(m.id, m.display_name)}>
                    Confirm ✅
                  </button>
                  <button className="btn-outline" style={{ padding: '.35rem .9rem', fontSize: '.72rem', borderColor: 'var(--red)', color: 'var(--red)' }}
                    onClick={() => reject(m.id, m.display_name)}>
                    Reject ❌
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
                    }
}
