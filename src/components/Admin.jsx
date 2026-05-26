import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TABS = ['Teams', 'Players', 'Matches', 'Live Match', 'Payments', 'Announcements', 'Season']
const POSITION_PRICES = { GK: 5.0, DF: 6.0, MF: 7.0, FW: 8.0 }

export default function Admin() {
  const [tab, setTab] = useState('Teams')
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [transferWindow, setTransferWindow] = useState('open')
  const [pForm, setPForm] = useState({ name: '', position: 'GK', team: '', price: 5.0, goals: 0, assists: 0 })
  const [mForm, setMForm] = useState({ home_team: '', away_team: '', matchday: 1, venue: '', kickoff_time: '' })
  const [liveMatch, setLiveMatch] = useState(null)
  const [matchPlayers, setMatchPlayers] = useState([])
  const [eventForm, setEventForm] = useState({ player_id: '', event_type: 'goal', minute: '' })

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { if (tab === 'Live Match') fetchLiveMatch() }, [tab])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: t }, { data: p }, { data: m }, { data: s }] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('players').select('*').order('position'),
      supabase.from('matches').select('*').order('matchday', { ascending: false }),
      supabase.from('settings').select('*')
    ])
    setTeams(t || [])
    setPlayers(p || [])
    setMatches(m || [])
    const windowSetting = s?.find(x => x.id === 'transfer_window')
    setTransferWindow(windowSetting?.value || 'open')
    setLoading(false)
  }

  const fetchLiveMatch = async () => {
    const { data } = await supabase.from('matches').select('*').eq('status', 'live').single()
    if (data) {
      setLiveMatch(data)
      const { data: players } = await supabase.from('players').select('*').order('position')
      setMatchPlayers(players || [])
    }
  }

  const showToast = (msg, bad = false) => {
    setToast({ msg, bad })
    setTimeout(() => setToast(null), 3000)
  }

  const toggleTransferWindow = async () => {
    const newValue = transferWindow === 'open' ? 'closed' : 'open'
    await supabase.from('settings').update({ value: newValue }).eq('id', 'transfer_window')
    setTransferWindow(newValue)
    showToast(`Transfer window ${newValue === 'open' ? '✅ Opened' : '🔒 Closed'}`)
  }

  const addPlayer = async () => {
    if (!pForm.name || !pForm.team) return showToast('⚠ Fill all fields', true)
    const { error } = await supabase.from('players').insert(pForm)
    if (error) return showToast('❌ Failed to add player', true)
    showToast(`✅ ${pForm.name} added!`)
    setPForm({ name: '', position: 'GK', team: '', price: 5.0, goals: 0, assists: 0 })
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
    showToast('⏳ Calculating points...')
    const { data: events } = await supabase.from('match_events').select('*').eq('match_id', liveMatch.id)
    const pointsMap = {
      goal_FW: 6, goal_MF: 5, goal_DF: 4, goal_GK: 4,
      assist: 3, started: 1, played_90: 2,
      yellow: -1, red: -3, own_goal: -3, penalty_missed: -2
    }
    const playerPoints = {}
    for (const event of events || []) {
      if (!playerPoints[event.player_id]) playerPoints[event.player_id] = 0
      const player = matchPlayers.find(p => p.id === event.player_id)
      const pos = player?.position || 'FW'
      let pts = 0
      if (event.event_type === 'goal') pts = pointsMap[`goal_${pos}`] || 4
      else if (event.event_type === 'assist') pts = pointsMap.assist
      else if (event.event_type === 'started') pts = pointsMap.started
      else if (event.event_type === 'played_90') pts = pointsMap.played_90
      else if (event.event_type === 'yellow') pts = pointsMap.yellow
      else if (event.event_type === 'red') pts = pointsMap.red
      else if (event.event_type === 'own_goal') pts = pointsMap.own_goal
      else if (event.event_type === 'penalty_missed') pts = pointsMap.penalty_missed
      playerPoints[event.player_id] += pts
    }
    const goalsScored = (events || []).filter(e => e.event_type === 'goal').length
    if (goalsScored === 0) {
      for (const player of matchPlayers) {
        if (['GK', 'DF'].includes(player.position)) {
          const played = (events || []).find(e => e.player_id === player.id && ['started', 'played_90'].includes(e.event_type))
          if (played) {
            if (!playerPoints[player.id]) playerPoints[player.id] = 0
            playerPoints[player.id] += 4
          }
        }
      }
    }
    const { data: allSquads } = await supabase.from('squads').select('*, managers(id, total_points)')
    const managerSquads = {}
    for (const sq of allSquads || []) {
      if (!managerSquads[sq.manager_id]) managerSquads[sq.manager_id] = []
      managerSquads[sq.manager_id].push(sq)
    }
    for (const [managerId, squad] of Object.entries(managerSquads)) {
      let totalMatchPoints = 0
      for (const sq of squad) {
        const playerPts = playerPoints[sq.player_id] || 0
        const multiplier = sq.is_captain ? 2 : 1
        if (sq.is_starting) {
          const didPlay = (events || []).find(e => e.player_id === sq.player_id && ['started', 'played_90'].includes(e.event_type))
          if (!didPlay) {
            const benchSub = squad.find(b => !b.is_starting && b.player_id !== sq.player_id)
            if (benchSub) { totalMatchPoints += playerPoints[benchSub.player_id] || 0; continue }
          }
          totalMatchPoints += playerPts * multiplier
        }
      }
      const currentManager = allSquads.find(s => s.manager_id === managerId)?.managers
      const newTotal = (currentManager?.total_points || 0) + totalMatchPoints
      await supabase.from('managers').update({ total_points: newTotal }).eq('id', managerId)
      await supabase.from('matchday_points').insert({ manager_id: managerId, matchday: liveMatch.matchday, points: totalMatchPoints })
    }
    for (const [playerId] of Object.entries(playerPoints)) {
      const playerGoals = (events || []).filter(e => e.player_id === playerId && e.event_type === 'goal').length
      const playerAssists = (events || []).filter(e => e.player_id === playerId && e.event_type === 'assist').length
      if (playerGoals > 0 || playerAssists > 0) {
        const current = matchPlayers.find(p => p.id === playerId)
        await supabase.from('players').update({
          goals: (current?.goals || 0) + playerGoals,
          assists: (current?.assists || 0) + playerAssists
        }).eq('id', playerId)
      }
    }
    await supabase.from('matches').update({ status: 'completed' }).eq('id', liveMatch.id)
    showToast('✅ Points calculated & match ended!')
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
    if (eventForm.event_type === 'goal' || eventForm.event_type === 'own_goal') {
      const player = matchPlayers.find(p => p.id === eventForm.player_id)
      const isHome = liveMatch.home_team === player?.team
      const homeGoal = eventForm.event_type === 'own_goal' ? !isHome : isHome
      const { data: currentMatch } = await supabase.from('matches').select('home_score, away_score').eq('id', liveMatch.id).single()
      await supabase.from('matches').update({
        home_score: homeGoal ? (currentMatch.home_score + 1) : currentMatch.home_score,
        away_score: !homeGoal ? (currentMatch.away_score + 1) : currentMatch.away_score
      }).eq('id', liveMatch.id)
      setLiveMatch(prev => ({
        ...prev,
        home_score: homeGoal ? (prev.home_score || 0) + 1 : (prev.home_score || 0),
        away_score: !homeGoal ? (prev.away_score || 0) + 1 : (prev.away_score || 0)
      }))
    }
    const player = matchPlayers.find(p => p.id === eventForm.player_id)
    showToast(`✅ ${eventForm.event_type} — ${player?.name}`)
    setEventForm({ player_id: '', event_type: 'goal', minute: '' })
  }

  const markAllAppearances = async (eventType) => {
    if (!liveMatch || matchPlayers.length === 0) return showToast('⚠ No players loaded', true)
    const rows = matchPlayers.map(p => ({
      match_id: liveMatch.id,
      player_id: p.id,
      event_type: eventType,
      minute: eventType === 'played_90' ? 90 : 1
    }))
    const { error } = await supabase.from('match_events').insert(rows)
    if (error) return showToast('❌ Failed', true)
    showToast(`✅ All players marked as ${eventType}!`)
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
            {t === 'Teams' ? '🏟 ' : t === 'Players' ? '👤 ' : t === 'Matches' ? '📅 ' : t === 'Live Match' ? '🔴 ' : t === 'Season' ? '🏆 ' : '💳 '}{t}
          </button>
        ))}
      </div>

      {tab === 'Teams' && (
        <div>
          <div style={{ ...styles.card, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: transferWindow === 'open' ? 'rgba(0,230,118,.04)' : 'rgba(239,154,154,.04)', borderColor: transferWindow === 'open' ? 'rgba(0,230,118,.2)' : 'rgba(239,154,154,.2)' }}>
            <div>
              <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '.3rem' }}>Transfer Window</div>
              <div style={{ fontSize: '.78rem', color: '#5A7A5E' }}>{transferWindow === 'open' ? 'Managers can currently make transfers' : 'Transfers are locked for all managers'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem' }}>
              <span style={{ fontSize: '.72rem', fontWeight: '800', letterSpacing: '1px', padding: '.3rem .8rem', borderRadius: '100px', background: transferWindow === 'open' ? 'rgba(0,230,118,.1)' : 'rgba(239,154,154,.1)', color: transferWindow === 'open' ? '#00E676' : '#EF9A9A' }}>
                {transferWindow === 'open' ? '✅ OPEN' : '🔒 CLOSED'}
              </span>
              <button style={{ ...styles.btn, background: transferWindow === 'open' ? 'rgba(239,154,154,.1)' : 'rgba(0,230,118,.1)', color: transferWindow === 'open' ? '#EF9A9A' : '#00E676', border: `1px solid ${transferWindow === 'open' ? '#EF9A9A' : '#00E676'}` }} onClick={toggleTransferWindow}>
                {transferWindow === 'open' ? 'Close Window' : 'Open Window'}
              </button>
            </div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>All Teams ({teams.length})</div>
            {teams.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.7rem 0', borderBottom: '1px solid #1E2E20' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{t.name}</div>
                  <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>{t.short_name}</div>
                </div>
                <div style={{ fontSize: '.75rem', color: '#5A7A5E' }}>{players.filter(p => p.team === t.name).length} players</div>
              </div>
            ))}
          </div>
          <div style={{ ...styles.card, marginTop: '1rem' }}>
            <div style={styles.cardTitle}>Players Per Team</div>
            {teams.map(t => {
              const teamPlayers = players.filter(p => p.team === t.name)
              return (
                <div key={t.id} style={{ marginBottom: '1.2rem', paddingBottom: '1.2rem', borderBottom: '1px solid #1E2E20' }}>
                  <div style={{ fontWeight: '800', fontSize: '.82rem', color: '#00E676', marginBottom: '.5rem' }}>{t.name} ({teamPlayers.length})</div>
                  {teamPlayers.length === 0 ? (
                    <div style={{ fontSize: '.75rem', color: '#5A7A5E' }}>No players added yet</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                      {teamPlayers.map(p => (
                        <span key={p.id} style={{ fontSize: '.72rem', background: '#1E2E20', padding: '.2rem .6rem', borderRadius: '100px', color: '#E8F5E9' }}>{p.position} · {p.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'Players' && (
        <div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Add New Player</div>
            <div style={styles.form}>
              <input style={styles.input} placeholder="Player Name" value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} />
              <select style={styles.input} value={pForm.position} onChange={e => setPForm({ ...pForm, position: e.target.value, price: POSITION_PRICES[e.target.value] })}>
                <option>GK</option><option>DF</option><option>MF</option><option>FW</option>
              </select>
              <select style={styles.input} value={pForm.team} onChange={e => setPForm({ ...pForm, team: e.target.value })}>
                <option value="">Select Team</option>
                {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              <input style={styles.input} type="number" placeholder="Price (₦M)" value={pForm.price} onChange={e => setPForm({ ...pForm, price: parseFloat(e.target.value) })} />
              <button style={{ ...styles.btn, gridColumn: 'span 2' }} onClick={addPlayer}>Add Player</button>
            </div>
          </div>
          <div style={{ ...styles.card, marginTop: '1rem' }}>
            <div style={styles.cardTitle}>All Players ({players.length})</div>
            {players.map(p => (
              <div key={p.id} style={styles.row}>
                <div style={{ ...styles.posBadge, background: p.position === 'GK' ? 'rgba(255,215,0,.1)' : p.position === 'DF' ? 'rgba(0,230,118,.1)' : p.position === 'MF' ? 'rgba(100,181,246,.1)' : 'rgba(239,154,154,.1)', color: p.position === 'GK' ? '#FFD700' : p.position === 'DF' ? '#00E676' : p.position === 'MF' ? '#64B5F6' : '#EF9A9A' }}>{p.position}</div>
                <div style={{ flex: 1 }}>
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

      {tab === 'Live Match' && (
        <div>
          {!liveMatch ? (
            <div style={styles.card}>
              <div style={styles.cardTitle}>No Live Match</div>
              <p style={{ color: '#5A7A5E', fontSize: '.85rem', marginTop: '.5rem' }}>Go to Matches tab and click "Go Live".</p>
            </div>
          ) : (
            <>
              <div style={{ ...styles.card, border: '1px solid rgba(0,230,118,.25)', background: 'rgba(0,230,118,.04)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '.65rem', fontWeight: '800', letterSpacing: '2px', color: '#00E676', marginBottom: '.3rem' }}>🔴 LIVE</div>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem' }}>
                      {liveMatch.home_team} <span style={{ color: '#00E676' }}>{liveMatch.home_score ?? 0} — {liveMatch.away_score ?? 0}</span> {liveMatch.away_team}
                    </div>
                    <div style={{ fontSize: '.72rem', color: '#5A7A5E' }}>GW{liveMatch.matchday} · {liveMatch.venue || 'TBD'}</div>
                  </div>
                  <button style={{ ...styles.btn, background: 'transparent', border: '1px solid #EF9A9A', color: '#EF9A9A' }} onClick={endMatch}>End Match & Calculate Points</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button style={{ ...styles.btn, background: 'rgba(0,230,118,.1)', color: '#00E676', border: '1px solid #00E676', flex: 1 }} onClick={() => markAllAppearances('started')}>▶ Mark All Started</button>
                <button style={{ ...styles.btn, background: 'rgba(100,181,246,.1)', color: '#64B5F6', border: '1px solid #64B5F6', flex: 1 }} onClick={() => markAllAppearances('played_90')}>✅ Mark All Played 90</button>
              </div>
              <div style={styles.card}>
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
    if (!confirm(`End the ${seasonName} season? This will crown the champion and lock the final standings. This cannot be undone.`)) return
    await supabase.from('settings').update({ value: 'ended' }).eq('id', 'season_status')
    if (champion) {
      await supabase.from('announcements').insert({
        title: `🏆 ${seasonName} Season Champion!`,
        body: `Congratulations to ${champion.team_name || champion.full_name} for winning the FUNAAB Fantasy League ${seasonName} season with ${champion.total_points} points! 🎉`,
        is_pinned: true
      })
    }
    showToast('🏆 Season ended! Champion crowned!')
    fetchData()
  }

  const resetSeason = async () => {
    if (!confirm('Start a new season? This will reset ALL manager points and matchday data. Player stats will be kept.')) return
    await supabase.from('managers').update({ total_points: 0, free_transfers: 1, wildcard_used: false }).eq('payment_status', 'confirmed')
    await supabase.from('matchday_points').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('squads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('match_events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
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
        <p style={{ fontSize: '.75rem', color: '#5A7A5E', lineHeight: 1.6 }}>⚠ Ending the season will crown the current leader as champion and post an announcement. Resetting will clear all points, squads and matches for a fresh season.</p>
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
  posBadge: { width: '28px', height: '28px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: '800', flexShrink: 0 },
  badge: { fontSize: '.62rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '.2rem .6rem', borderRadius: '100px' },
  toast: { position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', background: '#111A13', border: '1px solid #00E676', color: '#E8F5E9', padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999 },
  toastBad: { borderColor: '#EF9A9A', color: '#EF9A9A' }
                                              }
