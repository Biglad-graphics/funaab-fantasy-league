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
  const [eventForm, setEventForm] = useState({ player_id: '', event_type: 'goal' })
  const [playerPresence, setPlayerPresence] = useState({})
  const [searchPlayer, setSearchPlayer] = useState('')
  
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
      const { data: allPlayers } = await supabase.from('players').select('*').order('position')
      setMatchPlayers(allPlayers || [])
      setPlayerPresence({})
      setSearchPlayer('')
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
    setPlayerPresence({})
    setSearchPlayer('')
    showToast(`🔴 ${match.home_team} vs ${match.away_team} is LIVE`)
    fetchAll()
  }

  const togglePlayerHalf = (playerId, half) => {
    setPlayerPresence(prev => ({
      ...prev,
      [playerId]: {
        first_half: prev[playerId]?.first_half || false,
        second_half: prev[playerId]?.second_half || false,
        [half]: !(prev[playerId]?.[half] || false)
      }
    }))
  }

  const addEvent = async () => {
    if (!eventForm.player_id || !liveMatch) return showToast('⚠ Select a player', true)
    const { error } = await supabase.from('match_events').insert({
      match_id: liveMatch.id,
      player_id: eventForm.player_id,
      event_type: eventForm.event_type
    })
    if (error) return showToast('❌ Failed to log event', true)
    
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
    setEventForm({ player_id: '', event_type: 'goal' })
    setSearchPlayer('')
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
      else if (event.event_type === 'yellow') pts = pointsMap.yellow
      else if (event.event_type === 'red') pts = pointsMap.red
      else if (event.event_type === 'own_goal') pts = pointsMap.own_goal
      else if (event.event_type === 'penalty_missed') pts = pointsMap.penalty_missed
      
      playerPoints[event.player_id] += pts
    }

    for (const [playerId, presence] of Object.entries(playerPresence)) {
      if (!playerPoints[playerId]) playerPoints[playerId] = 0
      
      if (presence.first_half && presence.second_half) {
        playerPoints[playerId] += pointsMap.started + pointsMap.played_90
      } else if (presence.first_half) {
        playerPoints[playerId] += pointsMap.started
      } else if (presence.second_half) {
        playerPoints[playerId] += 1
      }
    }
    
    const goalsScored = (events || []).filter(e => e.event_type === 'goal').length
    if (goalsScored === 0) {
      for (const player of matchPlayers) {
        if (['GK', 'DF'].includes(player.position)) {
          const presence = playerPresence[player.id]
          if (presence && (presence.first_half || presence.second_half)) {
            if (!playerPoints[player.id]) playerPoints[player.id] = 0
            playerPoints[player.id] += 4
          }
        }
      }
    } else {
      for (const player of matchPlayers) {
        if (['GK', 'DF'].includes(player.position)) {
          const presence = playerPresence[player.id]
          if (presence && (presence.first_half || presence.second_half)) {
            if (!playerPoints[player.id]) playerPoints[player.id] = 0
            playerPoints[player.id] += goalsScored * -1
          }
        }
      }
    }

    for (const [playerId, points] of Object.entries(playerPoints)) {
      await supabase.from('player_match_points').insert({
        player_id: playerId,
        match_id: liveMatch.id,
        matchday: liveMatch.matchday,
        points_earned: points
      })
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
          totalMatchPoints += playerPts * multiplier
        } else {
          totalMatchPoints += (playerPts / 2) * multiplier
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
    showToast('✅ Points calculated!')
    setLiveMatch(null)
    fetchAll()
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

      {tab === 'Live Match' && (
        <div>
          {!liveMatch ? (
            <div style={styles.card}>
              <div style={styles.cardTitle}>No Live Match</div>
              <p style={{ color: '#5A7A5E', fontSize: '.85rem', marginTop: '.5rem' }}>Go to Matches tab and click "Go Live".</p>
            </div>
          ) : (
            <>
              <div style={{ ...styles.card, border: '1px solid rgba(0,230,118,.25)', background: 'rgba(0,230,118,.04)', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '.65rem', fontWeight: '800', letterSpacing: '2px', color: '#00E676', marginBottom: '.3rem' }}>🔴 LIVE</div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', marginBottom: '.5rem', lineHeight: 1 }}>
                  {liveMatch.home_team} <span style={{ color: '#00E676' }}>{liveMatch.home_score ?? 0}—{liveMatch.away_score ?? 0}</span> {liveMatch.away_team}
                </div>
                <div style={{ fontSize: '.72rem', color: '#5A7A5E' }}>GW{liveMatch.matchday} · {liveMatch.venue || 'TBD'}</div>
              </div>

              <div style={{ ...styles.card, marginBottom: '1.5rem', overflowX: 'auto' }}>
                <div style={styles.cardTitle}>👥 Mark Players Present</div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '.75rem', fontWeight: '700', color: '#00E676', marginBottom: '.5rem' }}>
                    {liveMatch.home_team} Players
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.72rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1E2E20' }}>
                          <th style={{ textAlign: 'left', padding: '.4rem', fontWeight: '700' }}>Player</th>
                          <th style={{ textAlign: 'center', padding: '.4rem', fontWeight: '700' }}>0-45</th>
                          <th style={{ textAlign: 'center', padding: '.4rem', fontWeight: '700' }}>45-90</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchPlayers.filter(p => p.team === liveMatch.home_team).map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(30,46,32,.5)', backgroundColor: (playerPresence[p.id]?.first_half || playerPresence[p.id]?.second_half) ? 'rgba(0,230,118,.05)' : 'transparent' }}>
                            <td style={{ padding: '.5rem .4rem', fontWeight: '600' }}>{p.name}</td>
                            <td style={{ textAlign: 'center', padding: '.5rem .4rem' }}>
                              <input 
                                type="checkbox" 
                                checked={playerPresence[p.id]?.first_half || false}
                                onChange={() => togglePlayerHalf(p.id, 'first_half')}
                                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                              />
                            </td>
                            <td style={{ textAlign: 'center', padding: '.5rem .4rem' }}>
                              <input 
                                type="checkbox" 
                                checked={playerPresence[p.id]?.second_half || false}
                                onChange={() => togglePlayerHalf(p.id, 'second_half')}
                                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '.75rem', fontWeight: '700', color: '#64B5F6', marginBottom: '.5rem' }}>
                    {liveMatch.away_team} Players
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.72rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1E2E20' }}>
                          <th style={{ textAlign: 'left', padding: '.4rem', fontWeight: '700' }}>Player</th>
                          <th style={{ textAlign: 'center', padding: '.4rem', fontWeight: '700' }}>0-45</th>
                          <th style={{ textAlign: 'center', padding: '.4rem', fontWeight: '700' }}>45-90</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchPlayers.filter(p => p.team === liveMatch.away_team).map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(30,46,32,.5)', backgroundColor: (playerPresence[p.id]?.first_half || playerPresence[p.id]?.second_half) ? 'rgba(100,181,246,.05)' : 'transparent' }}>
                            <td style={{ padding: '.5rem .4rem', fontWeight: '600' }}>{p.name}</td>
                            <td style={{ textAlign: 'center', padding: '.5rem .4rem' }}>
                              <input 
                                type="checkbox" 
                                checked={playerPresence[p.id]?.first_half || false}
                                onChange={() => togglePlayerHalf(p.id, 'first_half')}
                                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                              />
                            </td>
                            <td style={{ textAlign: 'center', padding: '.5rem .4rem' }}>
                              <input 
                                type="checkbox" 
                                checked={playerPresence[p.id]?.second_half || false}
                                onChange={() => togglePlayerHalf(p.id, 'second_half')}
                                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>⚽ Log Event</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
                  <div>
                    <label style={{ fontSize: '.75rem', fontWeight: '700', color: '#5A7A5E', display: 'block', marginBottom: '.3rem' }}>🔍 Search Player</label>
                    <input 
                      style={styles.input} 
                      placeholder="Type player name..." 
                      value={searchPlayer}
                      onChange={e => setSearchPlayer(e.target.value)}
                    />
                    {searchPlayer && (
                      <div style={{ marginTop: '.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                        {matchPlayers
                          .filter(p => p.name.toLowerCase().includes(searchPlayer.toLowerCase()))
                          .map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setEventForm({ ...eventForm, player_id: p.id })
                                setSearchPlayer('')
                              }}
                              style={{ 
                                width: '100%', 
                                padding: '.5rem .6rem', 
                                background: '#1E2E20', 
                                border: '1px solid #1E2E20', 
                                borderRadius: '6px', 
                                color: '#E8F5E9', 
                                textAlign: 'left', 
                                marginBottom: '.3rem',
                                cursor: 'pointer',
                                fontSize: '.72rem'
                              }}
                            >
                              {p.name} ({p.position} · {p.team})
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {eventForm.player_id && (
                    <div style={{ padding: '.6rem', background: 'rgba(0,230,118,.1)', border: '1px solid #00E676', borderRadius: '6px', fontSize: '.75rem', fontWeight: '700', color: '#00E676' }}>
                      Selected: {matchPlayers.find(p => p.id === eventForm.player_id)?.name}
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '.75rem', fontWeight: '700', color: '#5A7A5E', display: 'block', marginBottom: '.3rem' }}>Select Event</label>
                    <select 
                      style={styles.input} 
                      value={eventForm.event_type} 
                      onChange={e => setEventForm({ ...eventForm, event_type: e.target.value })}
                    >
                      <option value="goal">⚽ Goal</option>
                      <option value="assist">🅰 Assist</option>
                      <option value="yellow">🟨 Yellow Card</option>
                      <option value="red">🟥 Red Card</option>
                      <option value="own_goal">😬 Own Goal</option>
                      <option value="penalty_missed">❌ Penalty Missed</option>
                    </select>
                  </div>

                  <button 
                    style={{ ...styles.btn, width: '100%' }} 
                    onClick={addEvent}
                  >
                    Log Event
                  </button>
                </div>
              </div>

              <button 
                style={{ ...styles.btn, background: 'transparent', border: '1px solid #EF9A9A', color: '#EF9A9A', width: '100%', marginTop: '1.5rem', padding: '1rem' }} 
                onClick={endMatch}
              >
                🏁 End Match & Calculate Points
              </button>
            </>
          )}
        </div>
      )}
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
  input: { padding: '.75rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '.85rem', outline: 'none', width: '100%' },
  btn: { padding: '.75rem 1rem', borderRadius: '8px', background: '#00E676', color: '#080C0A', fontWeight: '800', fontSize: '.82rem', border: 'none', cursor: 'pointer', letterSpacing: '1px' },
  toast: { position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', background: '#111A13', border: '1px solid #00E676', color: '#E8F5E9', padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999 },
  toastBad: { borderColor: '#EF9A9A', color: '#EF9A9A' }
}
