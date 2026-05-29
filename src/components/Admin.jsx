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
  
  // NEW STATES FOR LINEUPS & SEARCH
  const [homeLineup, setHomeLineup] = useState([])
  const [awayLineup, setAwayLineup] = useState([])
  const [homeTeamPlayers, setHomeTeamPlayers] = useState([])
  const [awayTeamPlayers, setAwayTeamPlayers] = useState([])
  const [eventSearch, setEventSearch] = useState('')
  const [selectedEventPlayer, setSelectedEventPlayer] = useState(null)

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
      
      // Fetch team players for lineups
      const homePlayers = allPlayers?.filter(p => p.team === data.home_team) || []
      const awayPlayers = allPlayers?.filter(p => p.team === data.away_team) || []
      setHomeTeamPlayers(homePlayers)
      setAwayTeamPlayers(awayPlayers)
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
    const homePlayers = data?.filter(p => p.team === match.home_team) || []
    const awayPlayers = data?.filter(p => p.team === match.away_team) || []
    setHomeTeamPlayers(homePlayers)
    setAwayTeamPlayers(awayPlayers)
    showToast(`🔴 ${match.home_team} vs ${match.away_team} is LIVE`)
    fetchAll()
  }

  // NEW FUNCTIONS FOR LINEUPS
  const toggleStarter = (playerId, team) => {
    if (team === 'home') {
      const exists = homeLineup.find(p => p === playerId)
      if (exists) {
        setHomeLineup(homeLineup.filter(p => p !== playerId))
      } else {
        if (homeLineup.length < 11) {
          setHomeLineup([...homeLineup, playerId])
        } else {
          showToast('❌ Max 11 starters', true)
        }
      }
    } else {
      const exists = awayLineup.find(p => p === playerId)
      if (exists) {
        setAwayLineup(awayLineup.filter(p => p !== playerId))
      } else {
        if (awayLineup.length < 11) {
          setAwayLineup([...awayLineup, playerId])
        } else {
          showToast('❌ Max 11 starters', true)
        }
      }
    }
  }

  const saveLineups = async () => {
    if (homeLineup.length !== 11 || awayLineup.length !== 11) {
      return showToast('⚠️ Each team needs 11 starters', true)
    }

    const lineupRecords = [
      ...homeLineup.map(pid => ({
        match_id: liveMatch.id,
        team_id: liveMatch.home_team,
        player_id: pid,
        is_starting: true
      })),
      ...awayLineup.map(pid => ({
        match_id: liveMatch.id,
        team_id: liveMatch.away_team,
        player_id: pid,
        is_starting: true
      }))
    ]

    const { error } = await supabase.from('match_lineups').insert(lineupRecords)
    if (error) return showToast('❌ Error saving lineups', true)
    showToast('✅ Lineups saved!')
  }

  // NEW FUNCTION FOR SMART PLAYER SEARCH
  const searchPlayers = (query, team) => {
    if (!query.trim()) return []
    const playerList = team === 'home' ? homeTeamPlayers : awayTeamPlayers
    const search = query.toLowerCase()
    return playerList.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.position.toLowerCase().includes(search) ||
      p.team.toLowerCase().includes(search)
    )
  }

  const homeSearchResults = searchPlayers(eventSearch, 'home')
  const awaySearchResults = searchPlayers(eventSearch, 'away')

  // UPDATED EVENT LOGGING
  const logEvent = async () => {
    if (!selectedEventPlayer || !eventForm.event_type) {
      return showToast('⚠ Select player and event', true)
    }
    const { error } = await supabase.from('match_events').insert({
      match_id: liveMatch.id,
      player_id: selectedEventPlayer.id,
      event_type: eventForm.event_type
    })
    if (error) return showToast('❌ Failed to log event', true)
    showToast(`✅ ${eventForm.event_type} logged for ${selectedEventPlayer.name}`)
    setSelectedEventPlayer(null)
    setEventForm({ player_id: '', event_type: 'goal', minute: '' })
    setEventSearch('')
  }

  const endMatch = async () => {
    if (!liveMatch) return
    showToast('⏳ Calculating points...')
    const { data: events } = await supabase.from('match_events').select('*').eq('match_id', liveMatch.id)
    const pointsMap = {
      goal_FW: 6, goal_MF: 5, goal_DF: 4, goal_GK: 4,
      assist: 3, started: 1, played_90: 2,
      yellow: -1, red: -3, own_goal: -3, penalty_missed: -2,
      clean_sheet_GK: 4, clean_sheet_DF: 4,
      goal_conceded_GK: -1, goal_conceded_DF: -1
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
    
    // CLEAN SHEET & GOALS CONCEDED LOGIC
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
    } else {
      for (const player of matchPlayers) {
        if (['GK', 'DF'].includes(player.position)) {
          const played = (events || []).find(e => e.player_id === player.id && ['started', 'played_90'].includes(e.event_type))
          if (played) {
            if (!playerPoints[player.id]) playerPoints[player.id] = 0
            playerPoints[player.id] += goalsScored * pointsMap.goal_conceded_GK
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
    showToast('✅ Points calculated!')
    setLiveMatch(null)
    fetchAll()
  }

  if (loading) return <div style={{ color: '#E8F5E9', padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ padding: '1.5rem', color: '#E8F5E9', minHeight: '100vh' }}>
      {toast && <div style={{ position: 'fixed', top: '1rem', right: '1rem', padding: '.8rem 1.2rem', background: toast.bad ? '#EF9A9A' : '#00E676', color: toast.bad ? '#080C0A' : '#080C0A', borderRadius: '8px', fontWeight: '700', zIndex: 9999 }}>{toast.msg}</div>}

      {/* TABS */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '.6rem 1rem', background: tab === t ? '#00E676' : '#1E2E20', color: tab === t ? '#080C0A' : '#E8F5E9', border: 'none', borderRadius: '6px', fontWeight: tab === t ? '700' : '500', cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {/* TEAMS TAB */}
      {tab === 'Teams' && (
        <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.5rem' }}>
          <h2>Teams</h2>
          {teams.map(t => <div key={t.id} style={{ padding: '.5rem', borderBottom: '1px solid #1E2E20' }}>{t.name}</div>)}
        </div>
      )}

      {/* PLAYERS TAB */}
      {tab === 'Players' && (
        <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Players</h2>
          <input style={{ width: '100%', padding: '.7rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', marginBottom: '1rem', outline: 'none' }} placeholder="Name" value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} />
          <select style={{ width: '100%', padding: '.7rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', marginBottom: '1rem', outline: 'none' }} value={pForm.position} onChange={e => setPForm({ ...pForm, position: e.target.value, price: POSITION_PRICES[e.target.value] })}>
            <option>GK</option>
            <option>DF</option>
            <option>MF</option>
            <option>FW</option>
          </select>
          <input style={{ width: '100%', padding: '.7rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', marginBottom: '1rem', outline: 'none' }} placeholder="Team" value={pForm.team} onChange={e => setPForm({ ...pForm, team: e.target.value })} />
          <button style={{ width: '100%', padding: '.8rem', background: '#00E676', color: '#080C0A', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginBottom: '1rem' }} onClick={addPlayer}>Add Player</button>
          <div style={{ marginTop: '1rem' }}>
            {players.map(p => (
              <div key={p.id} style={{ padding: '.6rem', borderBottom: '1px solid #1E2E20', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700' }}>{p.name}</div>
                  <div style={{ fontSize: '.8rem', color: '#5A7A5E' }}>{p.position} • {p.team} • ₦{p.price}M</div>
                </div>
                <button onClick={() => deletePlayer(p.id, p.name)} style={{ padding: '.3rem .6rem', background: '#EF9A9A', color: '#080C0A', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '.7rem', fontWeight: '700' }}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MATCHES TAB */}
      {tab === 'Matches' && (
        <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Create Match</h2>
          <input style={{ width: '100%', padding: '.7rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', marginBottom: '1rem', outline: 'none' }} placeholder="Home Team" value={mForm.home_team} onChange={e => setMForm({ ...mForm, home_team: e.target.value })} />
          <input style={{ width: '100%', padding: '.7rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', marginBottom: '1rem', outline: 'none' }} placeholder="Away Team" value={mForm.away_team} onChange={e => setMForm({ ...mForm, away_team: e.target.value })} />
          <input style={{ width: '100%', padding: '.7rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', marginBottom: '1rem', outline: 'none' }} type="number" placeholder="Matchday" value={mForm.matchday} onChange={e => setMForm({ ...mForm, matchday: parseInt(e.target.value) })} />
          <input style={{ width: '100%', padding: '.7rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', marginBottom: '1rem', outline: 'none' }} placeholder="Venue" value={mForm.venue} onChange={e => setMForm({ ...mForm, venue: e.target.value })} />
          <input style={{ width: '100%', padding: '.7rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', marginBottom: '1rem', outline: 'none' }} type="datetime-local" value={mForm.kickoff_time} onChange={e => setMForm({ ...mForm, kickoff_time: e.target.value })} />
          <button style={{ width: '100%', padding: '.8rem', background: '#64B5F6', color: '#080C0A', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginBottom: '1rem' }} onClick={addMatch}>Create Match</button>
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ marginBottom: '.8rem' }}>Scheduled Matches</h3>
            {matches.filter(m => m.status !== 'completed').map(m => (
              <div key={m.id} style={{ padding: '.7rem', background: 'rgba(100,181,246,.1)', borderRadius: '6px', marginBottom: '.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '.85rem' }}>
                  <div style={{ fontWeight: '700' }}>{m.home_team} vs {m.away_team}</div>
                  <div style={{ color: '#5A7A5E', fontSize: '.75rem' }}>GW{m.matchday}</div>
                </div>
                <button style={{ padding: '.4rem .8rem', background: m.status === 'live' ? '#FFD700' : '#00E676', color: '#080C0A', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '700', fontSize: '.75rem' }} onClick={() => goLive(m)}>
                  {m.status === 'live' ? '🔴 LIVE' : 'Go Live'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIVE MATCH TAB */}
      {tab === 'Live Match' && (
        <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.5rem' }}>
          {!liveMatch ? (
            <div style={{ color: '#5A7A5E' }}>No live match. Go to Matches tab to start one.</div>
          ) : (
            <>
              <h2 style={{ marginBottom: '1rem' }}>🔴 {liveMatch.home_team} vs {liveMatch.away_team} - LIVE</h2>

              {/* SELECT STARTING XI */}
              <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(0,230,118,.05)', borderRadius: '8px', border: '1px solid rgba(0,230,118,.15)' }}>
                <h3 style={{ marginBottom: '1rem', color: '#00E676' }}>⚽ Select Starting XI</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* HOME TEAM */}
                  <div>
                    <h4 style={{ color: '#00E676', marginBottom: '.8rem', fontWeight: '700' }}>{liveMatch.home_team} ({homeLineup.length}/11)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                      {homeTeamPlayers.map(p => {
                        const isSelected = homeLineup.includes(p.id)
                        return (
                          <button
                            key={p.id}
                            onClick={() => toggleStarter(p.id, 'home')}
                            style={{
                              padding: '.5rem .8rem',
                              background: isSelected ? 'rgba(0,230,118,.2)' : 'rgba(30,46,32,.5)',
                              border: `1px solid ${isSelected ? '#00E676' : '#1E2E20'}`,
                              color: isSelected ? '#00E676' : '#E8F5E9',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: isSelected ? '700' : '500',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '.8rem'
                            }}
                          >
                            <span>{p.name}</span>
                            <span>{isSelected && '✓'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* AWAY TEAM */}
                  <div>
                    <h4 style={{ color: '#64B5F6', marginBottom: '.8rem', fontWeight: '700' }}>{liveMatch.away_team} ({awayLineup.length}/11)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                      {awayTeamPlayers.map(p => {
                        const isSelected = awayLineup.includes(p.id)
                        return (
                          <button
                            key={p.id}
                            onClick={() => toggleStarter(p.id, 'away')}
                            style={{
                              padding: '.5rem .8rem',
                              background: isSelected ? 'rgba(100,181,246,.2)' : 'rgba(30,46,32,.5)',
                              border: `1px solid ${isSelected ? '#64B5F6' : '#1E2E20'}`,
                              color: isSelected ? '#64B5F6' : '#E8F5E9',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: isSelected ? '700' : '500',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '.8rem'
                            }}
                          >
                            <span>{p.name}</span>
                            <span>{isSelected && '✓'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={saveLineups}
                  style={{
                    width: '100%',
                    padding: '.8rem',
                    background: '#00E676',
                    color: '#080C0A',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginTop: '1rem'
                  }}
                >
                  💾 Save Lineups
                </button>
              </div>

              {/* LOG MATCH EVENTS */}
              <div style={{ padding: '1rem', background: 'rgba(100,181,246,.05)', borderRadius: '8px', border: '1px solid rgba(100,181,246,.15)' }}>
                <h3 style={{ marginBottom: '1rem', color: '#64B5F6' }}>⚡ Log Match Events</h3>

                {/* EVENT TYPE BUTTONS */}
                <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {['goal', 'assist', 'yellow', 'red', 'own_goal', 'penalty_missed'].map(type => (
                    <button
                      key={type}
                      onClick={() => setEventForm({ ...eventForm, event_type: type })}
                      style={{
                        padding: '.4rem .8rem',
                        background: eventForm.event_type === type ? 'rgba(0,230,118,.2)' : 'rgba(30,46,32,.5)',
                        border: `1px solid ${eventForm.event_type === type ? '#00E676' : '#1E2E20'}`,
                        color: eventForm.event_type === type ? '#00E676' : '#E8F5E9',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: eventForm.event_type === type ? '700' : '500',
                        fontSize: '.75rem',
                        textTransform: 'capitalize'
                      }}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* SEARCH INPUT */}
                <input
                  type="text"
                  placeholder="🔍 Search player (name, position)..."
                  value={eventSearch}
                  onChange={e => setEventSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '.7rem',
                    borderRadius: '8px',
                    border: '1px solid #1E2E20',
                    background: '#080C0A',
                    color: '#E8F5E9',
                    marginBottom: '1rem',
                    outline: 'none'
                  }}
                />

                {/* SEARCH RESULTS */}
                {eventSearch.trim() && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    {/* HOME RESULTS */}
                    <div>
                      <div style={{ fontSize: '.75rem', color: '#00E676', fontWeight: '700', marginBottom: '.5rem' }}>{liveMatch.home_team} ({homeSearchResults.length})</div>
                      {homeSearchResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedEventPlayer(p); setEventSearch('') }}
                          style={{
                            width: '100%',
                            padding: '.5rem',
                            background: 'rgba(0,230,118,.1)',
                            border: '1px solid rgba(0,230,118,.2)',
                            color: '#E8F5E9',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginBottom: '.3rem',
                            fontSize: '.75rem',
                            textAlign: 'left'
                          }}
                        >
                          {p.name} ({p.position})
                        </button>
                      ))}
                    </div>
                    {/* AWAY RESULTS */}
                    <div>
                      <div style={{ fontSize: '.75rem', color: '#64B5F6', fontWeight: '700', marginBottom: '.5rem' }}>{liveMatch.away_team} ({awaySearchResults.length})</div>
                      {awaySearchResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedEventPlayer(p); setEventSearch('') }}
                          style={{
                            width: '100%',
                            padding: '.5rem',
                            background: 'rgba(100,181,246,.1)',
                            border: '1px solid rgba(100,181,246,.2)',
                            color: '#E8F5E9',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginBottom: '.3rem',
                            fontSize: '.75rem',
                            textAlign: 'left'
                          }}
                        >
                          {p.name} ({p.position})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SELECTED PLAYER */}
                {selectedEventPlayer && (
                  <div style={{ padding: '.8rem', background: 'rgba(0,230,118,.15)', borderRadius: '6px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '.85rem' }}>
                      <div style={{ fontWeight: '700' }}>{selectedEventPlayer.name}</div>
                      <div style={{ color: '#5A7A5E', fontSize: '.75rem' }}>{selectedEventPlayer.position} • {selectedEventPlayer.team}</div>
                    </div>
                    <button
                      onClick={() => setSelectedEventPlayer(null)}
                      style={{
                        padding: '.3rem .6rem',
                        background: '#EF9A9A',
                        color: '#080C0A',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '.7rem'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}

                <button
                  onClick={logEvent}
                  style={{
                    width: '100%',
                    padding: '.8rem',
                    background: selectedEventPlayer ? '#00E676' : '#5A7A5E',
                    color: '#080C0A',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: selectedEventPlayer ? 'pointer' : 'not-allowed',
                    marginBottom: '1rem'
                  }}
                >
                  Log {eventForm.event_type.replace('_', ' ')}
                </button>
              </div>

              <button
                onClick={endMatch}
                style={{
                  width: '100%',
                  padding: '.8rem',
                  background: '#EF9A9A',
                  color: '#080C0A',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                End Match & Calculate Points
              </button>
            </>
          )}
        </div>
      )}

      {/* OTHER TABS (Payments, Announcements, Season) */}
      {['Payments', 'Announcements', 'Season'].includes(tab) && (
        <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.5rem' }}>
          <h2>{tab}</h2>
          <p style={{ color: '#5A7A5E' }}>Coming soon...</p>
        </div>
      )}
    </div>
  )
      }
