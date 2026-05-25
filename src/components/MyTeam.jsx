import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MyTeam({ manager }) {
  const [view, setView] = useState('squad')
  const [squad, setSquad] = useState([])
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState('ALL')
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: squadData }, { data: playerData }] = await Promise.all([
      supabase.from('squads').select('*, players(*)').eq('manager_id', manager.id),
      supabase.from('players').select('*').eq('is_active', true).order('position')
    ])
    setSquad(squadData || [])
    setSelected((squadData || []).map(s => ({ ...s.players, is_captain: s.is_captain, is_starting: s.is_starting, squad_id: s.id })))
    setPlayers(playerData || [])
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

  const activateWildcard = async () => {
    if (manager?.wildcard_used) return
    if (!confirm('Use your Wildcard? This allows unlimited free transfers this week. You can only use it once per season.')) return
    const { error } = await supabase
      .from('managers')
      .update({ wildcard_used: true, free_transfers: 15 })
      .eq('id', manager.id)
    if (error) return showToast('❌ Failed to activate wildcard', true)
    showToast('🃏 Wildcard activated! Make unlimited transfers!')
    setView('pick')
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

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setView('squad')} style={{ ...styles.tab, ...(view === 'squad' ? styles.tabActive : {}) }}>My Squad</button>
        <button onClick={() => setView('pick')} style={{ ...styles.tab, ...(view === 'pick' ? styles.tabActive : {}) }}>Pick Players</button>
        {!manager?.wildcard_used ? (
          <button onClick={activateWildcard} style={{ ...styles.tab, background: 'rgba(255,215,0,.08)', borderColor: '#FFD700', color: '#FFD700' }}>
            🃏 Wildcard
          </button>
        ) : (
          <div style={{ fontSize: '.72rem', color: '#5A7A5E', padding: '.5rem .8rem', border: '1px solid #1E2E20', borderRadius: '8px' }}>
            🃏 Wildcard Used
          </div>
        )}
      </div>

      {/* SQUAD VIEW */}
      {view === 'squad' && (
        <div>
          {selected.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚽</div>
              <p style={{ color: '#5A7A5E', marginBottom: '1rem' }}>No squad selected yet</p>
              <button style={styles.btn} onClick={() => setView('pick')}>Pick Your Squad</button>
            </div>
          ) : (
            <>
              <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '10px', padding: '1rem 1.4rem', marginBottom: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div><div style={styles.miniLabel}>Players</div><div style={styles.miniVal}>{selected.length}/15</div></div>
                <div><div style={styles.miniLabel}>Spent</div><div style={{ ...styles.miniVal, color: '#EF9A9A' }}>₦{spent.toFixed(1)}M</div></div>
                <div><div style={styles.miniLabel}>Remaining</div><div style={{ ...styles.miniVal, color: '#00E676' }}>₦{remaining.toFixed(1)}M</div></div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>⭐ Starting XI</div>
                {selected.filter(p => p.is_starting).map(p => (
                  <div key={p.id} style={styles.playerRow}>
                    <div style={{ ...styles.posBadge, background: posColor(p.position).bg, color: posColor(p.position).color }}>{p.position}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '.85rem' }}>{p.name} {p.is_captain && '⭐'}</div>
                      <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>{p.team} · ₦{p.price}M</div>
                    </div>
                    <div style={{ display: 'flex', gap: '.4rem' }}>
                      <button style={{ ...styles.smBtn, background: p.is_captain ? '#FFD700' : 'transparent', color: p.is_captain ? '#080C0A' : '#FFD700', border: '1px solid #FFD700' }} onClick={() => setCaptain(p.id)}>C</button>
                      <button style={{ ...styles.smBtn, borderColor: '#5A7A5E', color: '#5A7A5E' }} onClick={() => toggleStarting(p.id)}>→ Bench</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...styles.card, marginTop: '1rem' }}>
                <div style={styles.cardTitle}>🪑 Bench</div>
                {selected.filter(p => !p.is_starting).map(p => (
                  <div key={p.id} style={{ ...styles.playerRow, opacity: .7 }}>
                    <div style={{ ...styles.posBadge, background: posColor(p.position).bg, color: posColor(p.position).color }}>{p.position}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '.85rem' }}>{p.name}</div>
                      <div style={{ fontSize: '.7rem', color: '#5A7A5E' }}>{p.team} · ₦{p.price}M</div>
                    </div>
                    <button style={{ ...styles.smBtn, borderColor: '#00E676', color: '#00E676' }} onClick={() => toggleStarting(p.id)}>→ Start</button>
                  </div>
                ))}
                {selected.filter(p => !p.is_starting).length === 0 && <div style={{ color: '#5A7A5E', fontSize: '.85rem' }}>No bench players</div>}
              </div>

              <button style={{ ...styles.btn, width: '100%', marginTop: '1rem' }} onClick={saveSquad} disabled={saving}>
                {saving ? 'SAVING...' : 'SAVE SQUAD'}
              </button>
              <button style={{ ...styles.outlineBtn, width: '100%', marginTop: '.5rem' }} onClick={() => setView('pick')}>
                Edit Squad
              </button>
            </>
          )}
        </div>
      )}

      {/* PICK VIEW */}
      {view === 'pick' && (
        <div>
          {/* Budget bar */}
          <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '10px', padding: '1rem 1.4rem', marginBottom: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div><div style={styles.miniLabel}>Players</div><div style={styles.miniVal}>{selected.length}/15</div></div>
            <div><div style={styles.miniLabel}>Remaining</div><div style={{ ...styles.miniVal, color: remaining < 0 ? '#EF9A9A' : '#00E676' }}>₦{remaining.toFixed(1)}M</div></div>
          </div>

          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.8rem', flexWrap: 'wrap' }}>
            <input
              style={{ flex: 1, padding: '.6rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#111A13', color: '#E8F5E9', fontSize: '.82rem', outline: 'none', minWidth: '150px' }}
              placeholder="Search players..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {['ALL', 'GK', 'DF', 'MF', 'FW'].map(pos => (
              <button key={pos} onClick={() => setPosFilter(pos)} style={{ ...styles.smBtn, ...(posFilter === pos ? { background: 'rgba(0,230,118,.1)', borderColor: '#00E676', color: '#00E676' } : { borderColor: '#1E2E20', color: '#5A7A5E' }) }}>{pos}</button>
            ))}
          </div>

          {/* Player List */}
          <div style={styles.card}>
            {filtered.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#5A7A5E' }}>No players found</div>
            ) : filtered.map(p => {
              const inSquad = selected.find(s => s.id === p.id)
              const pc = posColor(p.position)
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.65rem 0', borderBottom: '1px solid rgba(30,46,32,.4)' }}>
                  <div style={{ ...styles.posBadge, background: pc.bg, color: pc.color }}>{p.position}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '.82rem' }}>{p.name}</div>
                    <div style={{ fontSize: '.68rem', color: '#5A7A5E' }}>{p.team}</div>
                  </div>
                  <div style={{ fontSize: '.72rem', color: '#5A7A5E' }}>{p.goals ?? 0}⚽</div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#FFD700' }}>₦{p.price}M</div>
                  <button
                    onClick={() => togglePlayer(p)}
                    style={{ width: '26px', height: '26px', borderRadius: '50%', border: `1px solid ${inSquad ? '#EF9A9A' : '#00E676'}`, background: inSquad ? 'rgba(239,154,154,.1)' : 'transparent', color: inSquad ? '#EF9A9A' : '#00E676', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    {inSquad ? '−' : '+'}
                  </button>
                </div>
              )
            })}
          </div>

          {selected.length === 15 && (
            <button style={{ ...styles.btn, width: '100%', marginTop: '1rem' }} onClick={saveSquad} disabled={saving}>
              {saving ? 'SAVING...' : 'SAVE SQUAD'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  tab: { background: '#111A13', border: '1px solid #1E2E20', borderRadius: '8px', padding: '.5rem 1.2rem', fontSize: '.78rem', fontWeight: '700', letterSpacing: '1px', color: '#5A7A5E', cursor: 'pointer' },
  tabActive: { background: 'rgba(0,230,118,.09)', borderColor: '#00E676', color: '#00E676' },
  card: { background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem' },
  cardTitle: { fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', color: '#E8F5E9' },
  playerRow: { display: 'flex', alignItems: 'center', gap: '.7rem', paddingBottom: '.7rem', marginBottom: '.7rem', borderBottom: '1px solid #1E2E20' },
  posBadge: { width: '28px', height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: '800', flexShrink: 0 },
  btn: { padding: '.8rem 1.5rem', borderRadius: '8px', background: '#00E676', color: '#080C0A', fontWeight: '800', fontSize: '.85rem', border: 'none', cursor: 'pointer', letterSpacing: '1px' },
  outlineBtn: { padding: '.8rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid #1E2E20', color: '#5A7A5E', fontWeight: '700', fontSize: '.85rem', cursor: 'pointer' },
  smBtn: { padding: '.25rem .6rem', borderRadius: '5px', background: 'transparent', fontSize: '.68rem', fontWeight: '800', cursor: 'pointer', letterSpacing: '.5px' },
  miniLabel: { fontSize: '.62rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#5A7A5E' },
  miniVal: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: '#E8F5E9' }
  }
