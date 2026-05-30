import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MyTeam({ manager }) {
  const [view, setView] = useState('pitch')
  const [squad, setSquad] = useState([])
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState('ALL')
  const [toast, setToast] = useState(null)
  const [transferWindow, setTransferWindow] = useState('open')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: squadData }, { data: playerData }, { data: settings }, { data: latestMatch }] = await Promise.all([
      supabase.from('squads').select('*, players(*)').eq('manager_id', manager.id),
      supabase.from('players').select('*').eq('is_active', true).order('position'),
      supabase.from('settings').select('*'),
      supabase.from('matches').select('*').eq('status', 'completed').order('created_at', { ascending: false }).limit(1).single()
    ])
    
    // Fetch player points from last match
    let playerMatchPoints = {}
    if (latestMatch) {
      const { data: pointsData } = await supabase
        .from('player_match_points')
        .select('*')
        .eq('match_id', latestMatch.id)
      
      pointsData?.forEach(p => {
        playerMatchPoints[p.player_id] = p.points_earned
      })
    }
    
    setSquad(squadData || [])
    setSelected((squadData || []).map(s => ({ 
      ...s.players, 
      is_captain: s.is_captain, 
      is_starting: s.is_starting, 
      squad_id: s.id,
      last_match_points: playerMatchPoints[s.players.id] || 0
    })))
    setPlayers(playerData || [])
    const windowSetting = settings?.find(x => x.id === 'transfer_window')
    setTransferWindow(windowSetting?.value || 'open')
    setLoading(false)
  }

  const showToast = (msg, bad = false) => {
    setToast({ msg, bad })
    setTimeout(() => setToast(null), 2500)
  }

  const budget = 100
  const spent = selected.reduce((sum, p) => sum + (p.price || 0), 0)
  const remaining = budget - spent

  const togglePlayer = (player) => {
    if (transferWindow === 'closed') return showToast('🔒 Transfer window is closed', true)
    const inSquad = selected.find(p => p.id === player.id)
    if (inSquad) { setSelected(prev => prev.filter(p => p.id !== player.id)); return }
    if (selected.length >= 15) return showToast('⚠ Squad full — 15/15', true)
    if (remaining < player.price) return showToast('⚠ Not enough budget', true)
    const teamCount = selected.filter(p => p.team === player.team).length
    if (teamCount >= 3) return showToast(`⚠ Max 3 from ${player.team}`, true)
    const posCount = { GK: 2, DF: 5, MF: 5, FW: 3 }
    const currentPos = selected.filter(p => p.position === player.position).length
    if (currentPos >= posCount[player.position]) return showToast(`⚠ Max ${posCount[player.position]} ${player.position}s`, true)
    setSelected(prev => [...prev, { ...player, is_captain: false, is_starting: prev.length < 11 }])
  }

  const setCaptain = (playerId) => {
    setSelected(prev => prev.map(p => ({ ...p, is_captain: p.id === playerId })))
    showToast('⭐ Captain set!')
  }

  const toggleStarting = (playerId) => {
    const startingCount = selected.filter(p => p.is_starting).length
    const player = selected.find(p => p.id === playerId)
    if (!player.is_starting && startingCount >= 11) return showToast('⚠ Starting XI is full', true)
    setSelected(prev => prev.map(p => p.id === playerId ? { ...p, is_starting: !p.is_starting } : p))
  }

  const saveSquad = async () => {
    if (selected.length !== 15) return showToast('⚠ Select exactly 15 players', true)
    const startingCount = selected.filter(p => p.is_starting).length
    if (startingCount !== 11) return showToast(`⚠ Select 11 starters (${startingCount} selected)`, true)
    if (!selected.find(p => p.is_captain)) return showToast('⚠ Set a captain', true)
    setSaving(true)
    await supabase.from('squads').delete().eq('manager_id', manager.id)
    const rows = selected.map((p, i) => ({
      manager_id: manager.id,
      player_id: p.id,
      is_starting: p.is_starting,
      is_captain: p.is_captain,
      position_slot: i + 1
    }))
    const { error } = await supabase.from('squads').insert(rows)
    if (error) { showToast('❌ Failed to save', true); setSaving(false); return }
    showToast('✅ Squad saved!')
    setSaving(false)
    setView('squad')
    fetchData()
  }

  const filtered = players.filter(p =>
    (posFilter === 'ALL' || p.position === posFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase()))
  )

  const posColor = (pos) => pos === 'GK' ? { bg: 'rgba(255,215,0,.1)', color: '#FFD700' } : pos === 'DF' ? { bg: 'rgba(0,230,118,.1)', color: '#00E676' } : pos === 'MF' ? { bg: 'rgba(100,181,246,.1)', color: '#64B5F6' } : { bg: 'rgba(239,154,154,.1)', color: '#EF9A9A' }

  if (loading) return <div style={{ color: '#5A7A5E', padding: '2rem' }}>Loading...</div>

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', background: '#111A13', border: `1px solid ${toast.bad ? '#EF9A9A' : '#00E676'}`, color: toast.bad ? '#EF9A9A' : '#E8F5E9', padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999, whiteSpace: 'nowrap' }}>{toast.msg}</div>}

      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>⚽ Squad</div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '2px', marginBottom: '1rem' }}>My Team</h1>

      {/* Transfer Window Banner */}
      {transferWindow === 'closed' && (
        <div style={{ background: 'rgba(239,154,154,.05)', border: '1px solid rgba(239,154,154,.2)', borderRadius: '10px', padding: '1rem 1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🔒</span>
          <div>
            <div style={{ fontWeight: '800', fontSize: '.82rem', color: '#EF9A9A' }}>Transfer Window Closed</div>
            <div style={{ fontSize: '.75rem', color: '#5A7A5E', marginTop: '.1rem' }}>You cannot make transfers until the window reopens.</div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setView('pitch')} style={{ ...styles.tab, ...(view === 'pitch' ? styles.tabActive : {}) }}>⚽ Pitch</button>
        <button onClick={() => setView('squad')} style={{ ...styles.tab, ...(view === 'squad' ? styles.tabActive : {}) }}>📋 List</button>
        <button
          onClick={() => { if (transferWindow === 'closed') return showToast('🔒 Transfer window is closed', true); setView('pick') }}
          style={{ ...styles.tab, ...(view === 'pick' ? styles.tabActive : {}), opacity: transferWindow === 'closed' ? .5 : 1 }}
        >
          📍 Pick Players
        </button>
      </div>

      {/* PITCH VIEW */}
      {view === 'pitch' && (
        <div>
          {selected.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚽</div>
              <p style={{ color: '#5A7A5E', marginBottom: '1rem' }}>No squad selected yet</p>
              <button style={styles.btn} onClick={() => setView('pick')}>Pick Your Squad</button>
            </div>
          ) : (
            <>
              <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '10px', padding: '.8rem 1.2rem', marginBottom: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '.72rem', color: '#5A7A5E' }}>
                <span>Tap a player to set as <strong style={{ color: '#FFD700' }}>Captain ⭐</strong></span>
              </div>
              <PitchView selected={selected} onSetCaptain={setCaptain} />
              <button style={{ ...styles.btn, width: '100%', marginTop: '1rem' }} onClick={saveSquad} disabled={saving}>
                {saving ? 'SAVING...' : 'SAVE SQUAD'}
              </button>
            </>
          )}
        </div>
      )}

      {/* SQUAD LIST VIEW */}
      {view === 'squad' && (
        <div>
          {selected.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px' }}>
              <p style={{ color: '#5A7A5E', marginBottom: '1rem' }}>No squad selected yet</p>
              <button style={styles.btn} onClick={() => setView('pick')}>Pick Your Squad</button>
            </div>
          ) : (
            <>
              <div style={{ ...styles.card, marginBottom: '1.5rem' }}>
                <div style={styles.cardTitle}>Squad Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(0,230,118,.05)', borderRadius: '8px', border: '1px solid rgba(0,230,118,.15)' }}>
                    <div style={{ fontSize: '.72rem', color: '#5A7A5E', marginBottom: '.2rem' }}>Players Selected</div>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#00E676' }}>{selected.length}/15</div>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(255,215,0,.05)', borderRadius: '8px', border: '1px solid rgba(255,215,0,.15)' }}>
                    <div style={{ fontSize: '.72rem', color: '#5A7A5E', marginBottom: '.2rem' }}>Budget Remaining</div>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#FFD700' }}>₦{remaining.toFixed(1)}M</div>
                  </div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(100,181,246,.05)', borderRadius: '8px', border: '1px solid rgba(100,181,246,.15)' }}>
                  <div style={{ fontSize: '.72rem', color: '#5A7A5E', marginBottom: '.2rem' }}>Squad Cost</div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: '#64B5F6' }}>₦{spent.toFixed(1)}M / ₦100M</div>
                </div>
              </div>

{/* Starters */}
<div style={styles.card}>
  <div style={styles.cardTitle}>⚽ Starting XI ({selected.filter(p => p.is_starting).length}/11)</div>
  {selected.filter(p => p.is_starting).map((p, i) => (
    <div key={p.id} style={styles.playerRow}>
      <div style={{ ...styles.posBadge, ...posColor(p.position) }}>{p.position}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{p.name}</div>
        <div style={{ fontSize: '.72rem', color: '#5A7A5E' }}>{p.team}</div>
      </div>
      {p.is_captain && <span style={{ fontSize: '.8rem' }}>⭐</span>}
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#FFD700' }}>₦{p.price}M</div>
      <button style={{ ...styles.smBtn, color: '#64B5F6', border: '1px solid #64B5F6' }} onClick={() => toggleStarting(p.id)}>Move to Bench</button>
      {/* NEW: Sell Button */}
      <button 
        style={{ ...styles.smBtn, color: '#EF9A9A', border: '1px solid #EF9A9A' }} 
        onClick={() => {
          setSelected(prev => prev.filter(pl => pl.id !== p.id))
          showToast(`Sold ${p.name} for ₦${p.price}M`)
        }}
        disabled={transferWindow === 'closed'}
      >
        Sell
      </button>
    </div>
  ))}
</div>

{/* Bench */}
{selected.filter(p => !p.is_starting).length > 0 && (
  <div style={{ ...styles.card, marginTop: '1.5rem' }}>
    <div style={styles.cardTitle}>🪑 Substitutes ({selected.filter(p => !p.is_starting).length}/4)</div>
    {selected.filter(p => !p.is_starting).map((p) => (
      <div key={p.id} style={styles.playerRow}>
        <div style={{ ...styles.posBadge, ...posColor(p.position) }}>{p.position}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{p.name}</div>
          <div style={{ fontSize: '.72rem', color: '#5A7A5E' }}>{p.team}</div>
        </div>
        {p.is_captain && <span style={{ fontSize: '.8rem' }}>⭐</span>}
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#FFD700' }}>₦{p.price}M</div>
        <button style={{ ...styles.smBtn, color: '#00E676', border: '1px solid #00E676' }} onClick={() => toggleStarting(p.id)}>Play</button>
        <button 
          style={{ ...styles.smBtn, color: '#EF9A9A', border: '1px solid #EF9A9A' }} 
          onClick={() => {
            setSelected(prev => prev.filter(pl => pl.id !== p.id))
            showToast(`Sold ${p.name} for ₦${p.price}M`)
          }}
          disabled={transferWindow === 'closed'}
        >
          Sell
        </button>
      </div>
    ))}
  </div>
)}

<button style={{ ...styles.btn, width: '100%', marginTop: '1.5rem' }} onClick={saveSquad} disabled={saving}>
  {saving ? 'SAVING...' : 'SAVE SQUAD'}
</button>
              
      {/* PICK PLAYERS VIEW */}
      {view === 'pick' && (
        <div>
          <div style={{ ...styles.card, marginBottom: '1.5rem' }}>
            <div style={styles.cardTitle}>Search & Filter</div>
            <input
              style={{ ...styles.input, marginBottom: '1rem' }}
              placeholder="🔍 Search player name or team..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              {['ALL', 'GK', 'DF', 'MF', 'FW'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setPosFilter(pos)}
                  style={{
                    padding: '.4rem .8rem',
                    borderRadius: '6px',
                    border: posFilter === pos ? `2px solid ${posColor(pos).color}` : '1px solid #1E2E20',
                    background: posFilter === pos ? `${posColor(pos).bg}` : 'transparent',
                    color: posFilter === pos ? posColor(pos).color : '#5A7A5E',
                    fontSize: '.72rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Available Players ({filtered.length})</div>
            {filtered.length === 0 ? (
              <p style={{ color: '#5A7A5E', textAlign: 'center', padding: '2rem' }}>No players found</p>
            ) : (
              filtered.map(p => {
                const inSquad = selected.find(s => s.id === p.id)
                return (
                  <div key={p.id} style={{ ...styles.playerRow, opacity: inSquad ? 0.5 : 1 }}>
                    <div style={{ ...styles.posBadge, ...posColor(p.position) }}>{p.position}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '.88rem' }}>{p.name}</div>
                      <div style={{ fontSize: '.72rem', color: '#5A7A5E' }}>{p.team}</div>
                    </div>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#FFD700' }}>₦{p.price}M</div>
                    <button
                      onClick={() => togglePlayer(p)}
                      style={{
                        ...styles.btn,
                        padding: '.3rem .8rem',
                        fontSize: '.72rem',
                        background: inSquad ? '#5A7A5E' : '#00E676',
                        cursor: inSquad ? 'not-allowed' : 'pointer'
                      }}
                      disabled={inSquad}
                    >
                      {inSquad ? '✓ Added' : 'Add'}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PitchView({ selected, onSetCaptain }) {
  const starters = selected.filter(p => p.is_starting)
  const bench = selected.filter(p => !p.is_starting)
  const gk = starters.filter(p => p.position === 'GK')
  const df = starters.filter(p => p.position === 'DF')
  const mf = starters.filter(p => p.position === 'MF')
  const fw = starters.filter(p => p.position === 'FW')

  const PlayerCard = ({ player }) => (
    <div
      onClick={() => onSetCaptain(player.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '.2rem',
        cursor: 'pointer',
        position: 'relative',
        minWidth: '55px'
      }}
    >
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        border: '2px solid rgba(255,255,255,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '.7rem',
        fontWeight: '800',
        color: '#fff',
        position: 'relative',
        backdropFilter: 'blur(4px)'
      }}>
        {player.name.charAt(0)}
        {player.is_captain && (
          <div style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#FFD700',
            color: '#080C0A',
            fontSize: '.55rem',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>C</div>
        )}
      </div>
      <div style={{
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        fontSize: '.58rem',
        fontWeight: '700',
        padding: '.15rem .4rem',
        borderRadius: '4px',
        maxWidth: '60px',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {player.name.split(' ').pop()}
      </div>
      {/* NEW: Show last match points */}
      {player.last_match_points !== undefined && (
        <div style={{
          background: player.last_match_points > 0 ? '#00E676' : player.last_match_points < 0 ? '#EF9A9A' : '#5A7A5E',
          color: '#080C0A',
          fontSize: '.55rem',
          fontWeight: '900',
          padding: '.1rem .35rem',
          borderRadius: '3px'
        }}>
          {player.last_match_points > 0 ? '+' : ''}{player.last_match_points}pts
        </div>
      )}
    </div>
  )

  const Row = ({ players }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
      padding: '.3rem 0'
    }}>
      {players.map(p => <PlayerCard key={p.id} player={p} />)}
    </div>
  )

  return (
    <div>
      <div style={{
        background: 'linear-gradient(180deg, #2d8a4e 0%, #3aa058 25%, #2d8a4e 50%, #3aa058 75%, #2d8a4e 100%)',
        borderRadius: '12px',
        padding: '1rem .5rem',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.1)',
        minHeight: '420px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around'
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '80px', height: '80px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', top: '5%', left: '25%', right: '25%', height: '15%', border: '1px solid rgba(255,255,255,0.2)', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', bottom: '5%', left: '25%', right: '25%', height: '15%', border: '1px solid rgba(255,255,255,0.2)', borderTop: 'none' }} />
        </div>

        <Row players={fw} />
        <Row players={mf} />
        <Row players={df} />
        <Row players={gk} />
      </div>

      {bench.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '.65rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '.6rem' }}>🪑 Substitutes</div>
          <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '10px', padding: '.8rem', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '.5rem' }}>
            {bench.map(p => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.2rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1E2E20', border: '1px solid #2E4E30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: '800', color: '#5A7A5E' }}>
                  {p.name.charAt(0)}
                </div>
                <div style={{ fontSize: '.55rem', color: '#5A7A5E', fontWeight: '700', maxWidth: '50px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name.split(' ').pop()}
                </div>
                <div style={{ fontSize: '.5rem', background: '#1E2E20', color: '#5A7A5E', padding: '.1rem .3rem', borderRadius: '3px', fontWeight: '700' }}>
                  {p.position}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  tab: { background: '#111A13', border: '1px solid #1E2E20', borderRadius: '8px', padding: '.5rem 1.2rem', fontSize: '.78rem', fontWeight: '700', letterSpacing: '1px', color: '#5A7A5E', cursor: 'pointer' },
  tabActive: { background: 'rgba(0,230,118,.09)', borderColor: '#00E676', color: '#00E676' },
  card: { background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem', marginBottom: '1.5rem' },
  cardTitle: { fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: '#E8F5E9' },
  input: { width: '100%', padding: '.75rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '.85rem', outline: 'none' },
  playerRow: { display: 'flex', alignItems: 'center', gap: '.7rem', paddingBottom: '.7rem', marginBottom: '.7rem', borderBottom: '1px solid #1E2E20', flexWrap: 'wrap' },
  posBadge: { width: '28px', height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: '800', flexShrink: 0 },
  btn: { padding: '.6rem 1.2rem', borderRadius: '8px', background: '#00E676', color: '#080C0A', fontWeight: '800', fontSize: '.78rem', border: 'none', cursor: 'pointer', letterSpacing: '.5px' },
  smBtn: { padding: '.25rem .6rem', borderRadius: '5px', background: 'transparent', fontSize: '.68rem', fontWeight: '800', cursor: 'pointer', letterSpacing: '.5px' }
     }
