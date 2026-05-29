import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [managers, setManagers] = useState([])
  const [payments, setPayments] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [liveMatch, setLiveMatch] = useState(null)
  const [matchPlayers, setMatchPlayers] = useState([])
  const [pForm, setPForm] = useState({ name: '', position: 'GK', team: '', price: 5.0, goals: 0, assists: 0 })
  const [mForm, setMForm] = useState({ home_team: '', away_team: '', kickoff_time: '', venue: '', matchday: 1 })
  const [events, setEvents] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [eventType, setEventType] = useState('')
  const [homeTeamPlayers, setHomeTeamPlayers] = useState([])
  const [awayTeamPlayers, setAwayTeamPlayers] = useState([])
  const [eventSearch, setEventSearch] = useState('')
  const [homeLineup, setHomeLineup] = useState([])
  const [awayLineup, setAwayLineup] = useState([])
  const [subMode, setSubMode] = useState(false)
  const [subMinute, setSubMinute] = useState(45)
  const [playerOut, setPlayerOut] = useState(null)
  const [playerIn, setPlayerIn] = useState(null)
  const [announceForm, setAnnounceForm] = useState({ title: '', body: '', is_pinned: false })

  const POSITION_PRICES = { GK: 5.0, DF: 6.0, MF: 7.0, FW: 8.0 }

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const [{ data: m }, { data: p }, { data: mg }, { data: py }, { data: a }] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff_time', { ascending: false }),
      supabase.from('players').select('*').order('name'),
      supabase.from('managers').select('*').order('total_points', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('is_pinned', { ascending: false })
    ])
    setMatches(m || [])
    setPlayers(p || [])
    setManagers(mg || [])
    setPayments(py || [])
    setAnnouncements(a || [])
  }

  const addPlayer = async () => {
    if (!pForm.name || !pForm.team) {
      alert('Fill all fields')
      return
    }
    const { error } = await supabase.from('players').insert([{ ...pForm, is_active: true }])
    if (error) alert('Error: ' + error.message)
    else {
      alert('✅ Player added')
      setPForm({ name: '', position: 'GK', team: '', price: 5.0, goals: 0, assists: 0 })
      fetchAll()
    }
  }

  const startMatch = async () => {
    if (!mForm.home_team || !mForm.away_team) {
      alert('Select both teams')
      return
    }
    const { data, error } = await supabase.from('matches').insert([{ ...mForm, status: 'scheduled' }]).select()
    if (error) alert('Error: ' + error.message)
    else {
      alert('✅ Match created')
      setMForm({ home_team: '', away_team: '', kickoff_time: '', venue: '', matchday: 1 })
      fetchAll()
    }
  }

  const setupLineups = async () => {
    if (!liveMatch) return
    const [{ data: homePlayers }, { data: awayPlayers }] = await Promise.all([
      supabase.from('players').select('*').eq('team', liveMatch.home_team).eq('is_active', true),
      supabase.from('players').select('*').eq('team', liveMatch.away_team).eq('is_active', true)
    ])
    setHomeTeamPlayers(homePlayers || [])
    setAwayTeamPlayers(awayPlayers || [])
    setHomeLineup([])
    setAwayLineup([])
  }

  const toggleStarter = (playerId, team) => {
    if (team === 'home') {
      const exists = homeLineup.find(p => p.player_id === playerId)
      if (exists) {
        setHomeLineup(homeLineup.filter(p => p.player_id !== playerId))
      } else {
        if (homeLineup.length < 11) {
          setHomeLineup([...homeLineup, { player_id: playerId, is_starting: true }])
        } else {
          alert('❌ Maximum 11 starters per team')
        }
      }
    } else {
      const exists = awayLineup.find(p => p.player_id === playerId)
      if (exists) {
        setAwayLineup(awayLineup.filter(p => p.player_id !== playerId))
      } else {
        if (awayLineup.length < 11) {
          setAwayLineup([...awayLineup, { player_id: playerId, is_starting: true }])
        } else {
          alert('❌ Maximum 11 starters per team')
        }
      }
    }
  }

  const saveLineups = async () => {
    if (homeLineup.length !== 11 || awayLineup.length !== 11) {
      alert('⚠️ Each team needs exactly 11 starters')
      return
    }

    const lineupRecords = [
      ...homeLineup.map(p => ({
        match_id: liveMatch.id,
        team_id: liveMatch.home_team,
        player_id: p.player_id,
        is_starting: true
      })),
      ...awayLineup.map(p => ({
        match_id: liveMatch.id,
        team_id: liveMatch.away_team,
        player_id: p.player_id,
        is_starting: true
      }))
    ]

    const { error } = await supabase.from('match_lineups').insert(lineupRecords)
    if (error) {
      alert('❌ Error saving lineups: ' + error.message)
      return
    }

    alert('✅ Lineups saved! Ready to start match.')
  }

  const goLive = async (match) => {
    const { error } = await supabase.from('matches').update({ status: 'live' }).eq('id', match.id)
    if (error) alert('Error: ' + error.message)
    else {
      setLiveMatch(match)
      const { data: mp } = await supabase.from('players').select('*').in('team', [match.home_team, match.away_team])
      setMatchPlayers(mp || [])
      setupLineups()
      fetchAll()
    }
  }

  const logEvent = async () => {
    if (!selectedPlayer || !eventType) {
      alert('Select player and event type')
      return
    }
    const { error } = await supabase.from('match_events').insert([{
      match_id: liveMatch.id,
      player_id: selectedPlayer.id,
      event_type: eventType.toLowerCase().replace(' ', '_')
    }])
    if (error) alert('Error: ' + error.message)
    else {
      alert(`✅ ${eventType} logged for ${selectedPlayer.name}`)
      setSelectedPlayer(null)
      setEventType('')
      setEventSearch('')
    }
  }

  const logSubstitution = async () => {
    if (!playerOut || !playerIn) {
      alert('⚠️ Select both players')
      return
    }

    const { error: subError } = await supabase.from('match_events').insert({
      match_id: liveMatch.id,
      player_in_id: playerIn,
      player_out_id: playerOut,
      minute: subMinute,
      event_type: 'substitution'
    })

    if (subError) {
      alert('❌ Error logging substitution: ' + subError.message)
      return
    }

    const playerInName = matchPlayers.find(p => p.id === playerIn)?.name
    const playerOutName = matchPlayers.find(p => p.id === playerOut)?.name
    alert(`✅ ${playerInName} on for ${playerOutName} (${subMinute}')`)
    setPlayerOut(null)
    setPlayerIn(null)
    setSubMode(false)
  }

  const searchPlayers = (query, team) => {
    if (!query.trim()) return []
    const playerList = team === 'home' ? homeTeamPlayers : awayTeamPlayers
    const search = query.toLowerCase()
    return playerList.filter(p => {
      const matchName = p.name.toLowerCase().includes(search)
      const matchPosition = p.position.toLowerCase().includes(search)
      const matchTeam = p.team.toLowerCase().includes(search)
      return matchName || matchPosition || matchTeam
    })
  }

  const homeSearchResults = searchPlayers(eventSearch, 'home')
  const awaySearchResults = searchPlayers(eventSearch, 'away')

  const endMatch = async () => {
    if (!liveMatch) return
    alert('⏳ Calculating points...')

    const { data: lineups } = await supabase.from('match_lineups').select('*').eq('match_id', liveMatch.id)
    const { data: matchEvents } = await supabase.from('match_events').select('*').eq('match_id', liveMatch.id)

    const pointsMap = {
      goal_fw: 6, goal_mf: 5, goal_df: 4, goal_gk: 4,
      assist: 3, started: 1, played_90: 2,
      yellow_card: -1, red_card: -3, own_goal: -3, penalty_missed: -2,
      clean_sheet_gk: 4, clean_sheet_df: 4,
      goal_conceded_gk: -1, goal_conceded_df: -1
    }

    const playerPoints = {}

    // Starting XI get +1
    const startingPlayers = lineups?.filter(l => l.is_starting).map(l => l.player_id) || []
    for (const playerId of startingPlayers) {
      if (!playerPoints[playerId]) playerPoints[playerId] = 0
      playerPoints[playerId] += pointsMap.started
    }

    // Process events
    for (const event of matchEvents || []) {
      if (!playerPoints[event.player_id]) playerPoints[event.player_id] = 0
      const player = matchPlayers.find(p => p.id === event.player_id)
      const pos = player?.position?.toLowerCase() || 'fw'

      let pts = 0
      if (event.event_type === 'goal') pts = pointsMap[`goal_${pos}`] || 4
      else if (event.event_type === 'assist') pts = pointsMap.assist
      else if (event.event_type === 'played_90') pts = pointsMap.played_90
      else if (event.event_type === 'yellow_card') pts = pointsMap.yellow_card
      else if (event.event_type === 'red_card') pts = pointsMap.red_card
      else if (event.event_type === 'own_goal') pts = pointsMap.own_goal
      else if (event.event_type === 'penalty_missed') pts = pointsMap.penalty_missed

      playerPoints[event.player_id] += pts
    }

    // Clean sheet logic
    const allGoals = (matchEvents || []).filter(e => e.event_type === 'goal').length
    const teams = [...new Set(lineups?.map(l => l.team_id) || [])]

    for (const teamId of teams) {
      const teamLineup = lineups?.filter(l => l.team_id === teamId) || []
      const defensiveLineup = teamLineup.filter(l => {
        const p = matchPlayers.find(mp => mp.id === l.player_id)
        return ['GK', 'DF'].includes(p?.position)
      })

      for (const player of defensiveLineup) {
        if (!playerPoints[player.player_id]) playerPoints[player.player_id] = 0

        const played = (matchEvents || []).find(e =>
          e.player_id === player.player_id &&
          (e.event_type === 'played_90' || e.event_type === 'substitution')
        )

        if (played) {
          if (allGoals === 0) {
            playerPoints[player.player_id] += pointsMap.clean_sheet_gk
          } else {
            playerPoints[player.player_id] += allGoals * pointsMap.goal_conceded_gk
          }
        }
      }
    }

    // Calculate manager points
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
        }
      }
      const currentManager = allSquads.find(s => s.manager_id === managerId)?.managers
      const newTotal = (currentManager?.total_points || 0) + totalMatchPoints
      await supabase.from('managers').update({ total_points: newTotal }).eq('id', managerId)
      await supabase.from('matchday_points').insert({ manager_id: managerId, matchday: liveMatch.matchday, points: totalMatchPoints })
    }

    // Update player stats
    for (const [playerId] of Object.entries(playerPoints)) {
      const playerGoals = (matchEvents || []).filter(e => e.player_id === playerId && e.event_type === 'goal').length
      const playerAssists = (matchEvents || []).filter(e => e.player_id === playerId && e.event_type === 'assist').length
      if (playerGoals > 0 || playerAssists > 0) {
        const current = matchPlayers.find(p => p.id === playerId)
        await supabase.from('players').update({
          goals: (current?.goals || 0) + playerGoals,
          assists: (current?.assists || 0) + playerAssists
        }).eq('id', playerId)
      }
    }

    await supabase.from('matches').update({ status: 'completed' }).eq('id', liveMatch.id)
    alert('✅ Points calculated!')
    setLiveMatch(null)
    fetchAll()
  }

  const addAnnouncement = async () => {
    if (!announceForm.title || !announceForm.body) {
      alert('Fill all fields')
      return
    }
    const { error } = await supabase.from('announcements').insert([announceForm])
    if (error) alert('Error: ' + error.message)
    else {
      alert('✅ Announcement posted')
      setAnnounceForm({ title: '', body: '', is_pinned: false })
      fetchAll()
    }
  }

  const approvePayment = async (paymentId) => {
    const { error } = await supabase.from('payments').update({ status: 'approved' }).eq('id', paymentId)
    if (error) alert('Error: ' + error.message)
    else {
      alert('✅ Payment approved')
      fetchAll()
    }
  }

  return (
    <div style={{ padding: '2rem', color: '#E8F5E9' }}>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', marginBottom: '2rem' }}>Admin Panel</h1>

      {/* ADD PLAYER */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>➕ Add Player</h2>
        <input style={styles.input} placeholder="Player Name" value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} />
        <select style={styles.input} value={pForm.position} onChange={e => setPForm({ ...pForm, position: e.target.value, price: POSITION_PRICES[e.target.value] })}>
          <option>GK</option>
          <option>DF</option>
          <option>MF</option>
          <option>FW</option>
        </select>
        <input style={styles.input} placeholder="Team" value={pForm.team} onChange={e => setPForm({ ...pForm, team: e.target.value })} />
        <input style={styles.input} type="number" placeholder="Price (₦M)" value={pForm.price} onChange={e => setPForm({ ...pForm, price: parseFloat(e.target.value) })} />
        <button style={{ ...styles.btn, background: '#00E676', color: '#080C0A', width: '100%' }} onClick={addPlayer}>Add Player</button>
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ fontSize: '.9rem', fontWeight: '700', marginBottom: '.5rem' }}>Players</h3>
          {players.map(p => (
            <div key={p.id} style={{ fontSize: '.8rem', padding: '.5rem', borderBottom: '1px solid #1E2E20', display: 'flex', justifyContent: 'space-between' }}>
              <div>{p.name} ({p.position})</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#FFD700' }}>₦{p.price}M</div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE MATCH */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🏆 Create Match</h2>
        <input style={styles.input} placeholder="Home Team" value={mForm.home_team} onChange={e => setMForm({ ...mForm, home_team: e.target.value })} />
        <input style={styles.input} placeholder="Away Team" value={mForm.away_team} onChange={e => setMForm({ ...mForm, away_team: e.target.value })} />
        <input style={styles.input} type="datetime-local" value={mForm.kickoff_time} onChange={e => setMForm({ ...mForm, kickoff_time: e.target.value })} />
        <input style={styles.input} placeholder="Venue" value={mForm.venue} onChange={e => setMForm({ ...mForm, venue: e.target.value })} />
        <input style={styles.input} type="number" placeholder="Matchday" value={mForm.matchday} onChange={e => setMForm({ ...mForm, matchday: parseInt(e.target.value) })} />
        <button style={{ ...styles.btn, background: '#64B5F6', color: '#080C0A', width: '100%' }} onClick={startMatch}>Create Match</button>
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ fontSize: '.9rem', fontWeight: '700', marginBottom: '.5rem' }}>Upcoming Matches</h3>
          {matches.filter(m => m.status !== 'completed').map(m => (
            <div key={m.id} style={{ fontSize: '.75rem', padding: '.7rem', background: 'rgba(100,181,246,.1)', borderRadius: '6px', marginBottom: '.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>{m.home_team} vs {m.away_team} (GW{m.matchday})</div>
              <button style={{ ...styles.btn, fontSize: '.7rem', padding: '.3rem .6rem' }} onClick={() => goLive(m)}>Go Live</button>
            </div>
          ))}
        </div>
      </div>

      {/* TEAM LINEUPS */}
      {liveMatch && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>⚽ Select Starting XI</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* HOME */}
            <div>
              <h4 style={{ color: '#00E676', marginBottom: '.8rem', fontWeight: '700' }}>{liveMatch.home_team} ({homeLineup.length}/11)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {homeTeamPlayers.map(p => {
                  const isSelected = homeLineup.find(l => l.player_id === p.id)
                  return (
                    <button key={p.id} onClick={() => toggleStarter(p.id, 'home')} style={{ ...styles.btn, background: isSelected ? 'rgba(0,230,118,.2)' : 'rgba(30,46,32,.5)', border: `2px solid ${isSelected ? '#00E676' : '#1E2E20'}`, color: isSelected ? '#00E676' : '#E8F5E9', justifyContent: 'space-between', fontWeight: isSelected ? '700' : '500' }}>
                      <span>{p.name}</span>
                      <span style={{ fontSize: '.7rem' }}>{p.position} {isSelected && '✓'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            {/* AWAY */}
            <div>
              <h4 style={{ color: '#64B5F6', marginBottom: '.8rem', fontWeight: '700' }}>{liveMatch.away_team} ({awayLineup.length}/11)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {awayTeamPlayers.map(p => {
                  const isSelected = awayLineup.find(l => l.player_id === p.id)
                  return (
                    <button key={p.id} onClick={() => toggleStarter(p.id, 'away')} style={{ ...styles.btn, background: isSelected ? 'rgba(100,181,246,.2)' : 'rgba(30,46,32,.5)', border: `2px solid ${isSelected ? '#64B5F6' : '#1E2E20'}`, color: isSelected ? '#64B5F6' : '#E8F5E9', justifyContent: 'space-between', fontWeight: isSelected ? '700' : '500' }}>
                      <span>{p.name}</span>
                      <span style={{ fontSize: '.7rem' }}>{p.position} {isSelected && '✓'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <button style={{ ...styles.btn, background: '#00E676', color: '#080C0A', width: '100%', marginTop: '1rem', fontWeight: '700' }} onClick={saveLineups}>💾 Save Lineups & Start</button>
        </div>
      )}

      {/* LIVE MATCH - EVENTS */}
      {liveMatch && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>⚡ Log Match Events</h2>
          
          {/* Event type tabs */}
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['GOAL', 'ASSIST', 'YELLOW CARD', 'RED CARD', 'OWN GOAL', 'PENALTY MISSED'].map(type => (
              <button key={type} onClick={() => setEventType(type)} style={{ ...styles.btn, background: eventType === type ? 'rgba(0,230,118,.2)' : 'rgba(30,46,32,.5)', border: `1px solid ${eventType === type ? '#00E676' : '#1E2E20'}`, color: eventType === type ? '#00E676' : '#5A7A5E', fontSize: '.75rem', padding: '.4rem .8rem' }}>
                {type}
              </button>
            ))}
          </div>

          {/* Search input */}
          <input
            type="text"
            placeholder="🔍 Search player (name, position, team)..."
            value={eventSearch}
            onChange={e => setEventSearch(e.target.value)}
            style={{ ...styles.input, marginBottom: '1rem' }}
          />

          {/* Search results */}
          {eventSearch.trim() && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Home team */}
              <div>
                <h4 style={{ fontSize: '.85rem', fontWeight: '700', color: '#00E676', marginBottom: '.5rem' }}>{liveMatch.home_team} ({homeSearchResults.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {homeSearchResults.length === 0 ? (
                    <div style={{ color: '#5A7A5E', fontSize: '.75rem' }}>No players found</div>
                  ) : homeSearchResults.map(p => (
                    <div key={p.id} style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                      <div style={{ flex: 1, padding: '.5rem', background: 'rgba(0,230,118,.05)', borderRadius: '4px', fontSize: '.75rem' }}>
                        <div style={{ fontWeight: '700' }}>{p.name}</div>
                        <div style={{ color: '#5A7A5E' }}>{p.position}</div>
                      </div>
                      <button onClick={() => { setSelectedPlayer(p); setEventSearch('') }} style={{ ...styles.btn, fontSize: '.7rem', padding: '.3rem .5rem' }}>✓</button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Away team */}
              <div>
                <h4 style={{ fontSize: '.85rem', fontWeight: '700', color: '#64B5F6', marginBottom: '.5rem' }}>{liveMatch.away_team} ({awaySearchResults.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {awaySearchResults.length === 0 ? (
                    <div style={{ color: '#5A7A5E', fontSize: '.75rem' }}>No players found</div>
                  ) : awaySearchResults.map(p => (
                    <div key={p.id} style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                      <div style={{ flex: 1, padding: '.5rem', background: 'rgba(100,181,246,.05)', borderRadius: '4px', fontSize: '.75rem' }}>
                        <div style={{ fontWeight: '700' }}>{p.name}</div>
                        <div style={{ color: '#5A7A5E' }}>{p.position}</div>
                      </div>
                      <button onClick={() => { setSelectedPlayer(p); setEventSearch('') }} style={{ ...styles.btn, fontSize: '.7rem', padding: '.3rem .5rem' }}>✓</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Selected player */}
          {selectedPlayer && (
            <div style={{ padding: '1rem', background: 'rgba(0,230,118,.1)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700' }}>{selectedPlayer.name}</div>
                <div style={{ fontSize: '.8rem', color: '#5A7A5E' }}>{selectedPlayer.position} • {selectedPlayer.team}</div>
              </div>
              <button onClick={() => setSelectedPlayer(null)} style={{ ...styles.btn, background: '#EF9A9A', color: '#080C0A', padding: '.4rem .8rem' }}>Clear</button>
            </div>
          )}

          <button style={{ ...styles.btn, background: selectedPlayer ? '#00E676' : '#5A7A5E', color: '#080C0A', width: '100%', fontWeight: '700', marginBottom: '1rem' }} onClick={logEvent} disabled={!selectedPlayer || !eventType}>
            Log {eventType || 'Event'}
          </button>

          {/* Substitution */}
          <button onClick={() => setSubMode(!subMode)} style={{ ...styles.btn, background: subMode ? '#EF9A9A' : '#64B5F6', color: '#080C0A', width: '100%', marginBottom: subMode ? '1rem' : 0, fontWeight: '700' }}>
            {subMode ? '❌ Cancel Sub' : '🔄 Log Substitution'}
          </button>

          {subMode && (
            <>
              <input type="number" min="0" max="120" value={subMinute} onChange={e => setSubMinute(parseInt(e.target.value))} placeholder="Minute" style={styles.input} />
              <select value={playerOut || ''} onChange={e => setPlayerOut(e.target.value)} style={styles.input}>
                <option value="">Player OUT</option>
                {matchPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position})</option>)}
              </select>
              <select value={playerIn || ''} onChange={e => setPlayerIn(e.target.value)} style={styles.input}>
                <option value="">Player IN</option>
                {matchPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position})</option>)}
              </select>
              <button onClick={logSubstitution} style={{ ...styles.btn, background: '#00E676', color: '#080C0A', width: '100%', fontWeight: '700' }}>✅ Confirm Sub</button>
            </>
          )}

          <button style={{ ...styles.btn, background: '#EF9A9A', color: '#080C0A', width: '100%', marginTop: '1rem', fontWeight: '700' }} onClick={endMatch}>End Match & Calculate Points</button>
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📢 Announcements</h2>
        <input style={styles.input} placeholder="Title" value={announceForm.title} onChange={e => setAnnounceForm({ ...announceForm, title: e.target.value })} />
        <textarea style={{ ...styles.input, minHeight: '100px' }} placeholder="Message" value={announceForm.body} onChange={e => setAnnounceForm({ ...announceForm, body: e.target.value })} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
          <input type="checkbox" checked={announceForm.is_pinned} onChange={e => setAnnounceForm({ ...announceForm, is_pinned: e.target.checked })} />
          📌 Pin this announcement
        </label>
        <button style={{ ...styles.btn, background: '#FFD700', color: '#080C0A', width: '100%' }} onClick={addAnnouncement}>Post Announcement</button>
        <div style={{ marginTop: '1rem' }}>
          {announcements.slice(0, 5).map(a => (
            <div key={a.id} style={{ fontSize: '.75rem', padding: '.5rem', borderBottom: '1px solid #1E2E20' }}>
              <div style={{ fontWeight: '700' }}>{a.is_pinned && '📌 '}{a.title}</div>
              <div style={{ color: '#5A7A5E' }}>{a.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PAYMENTS */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>💳 Payments</h2>
        {payments.filter(p => p.status !== 'approved').map(p => (
          <div key={p.id} style={{ fontSize: '.8rem', padding: '.8rem', background: 'rgba(255,215,0,.1)', borderRadius: '6px', marginBottom: '.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700' }}>₦{p.amount.toFixed(2)}</div>
              <div style={{ color: '#5A7A5E', fontSize: '.7rem' }}>{p.manager_id}</div>
            </div>
            <button style={{ ...styles.btn, fontSize: '.7rem', padding: '.3rem .6rem' }} onClick={() => approvePayment(p.id)}>Approve</button>
          </div>
        ))}
      </div>

      {/* LEADERBOARD */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🏆 Leaderboard</h2>
        {managers.slice(0, 10).map((m, i) => (
          <div key={m.id} style={{ fontSize: '.85rem', padding: '.6rem', borderBottom: '1px solid #1E2E20', display: 'flex', justifyContent: 'space-between' }}>
            <div>#{i + 1} {m.team_name}</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#00E676' }}>{m.total_points}pts</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  card: { background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
  cardTitle: { fontSize: '1rem', fontWeight: '800', marginBottom: '1rem', color: '#E8F5E9' },
  input: { width: '100%', padding: '.7rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', marginBottom: '1rem', outline: 'none' },
  btn: { padding: '.6rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }
