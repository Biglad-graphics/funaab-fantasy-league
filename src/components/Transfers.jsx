import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const BUDGET = 100.0

export default function Transfers({ session }) {
  const [players, setPlayers] = useState([])
  const [squad, setSquad] = useState([])
  const [manager, setManager] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState('ALL')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const [{ data: mgr }, { data: allPlayers }, { data: mySquad }] = await Promise.all([
      supabase.from('managers').select('*').eq('id', session.user.id).single(),
      supabase.from('players').select('*').eq('is_active', true).order('position'),
      supabase.from('squads').select('player_id').eq('manager_id', session.user.id)
    ])

    setManager(mgr)
    setPlayers(allPlayers || [])
    setSquad(mySquad?.map(s => s.player_id) || [])
    setLoading(false)
  }

  const spent = players
    .filter(p => squad.includes(p.id))
    .reduce((sum, p) => sum + (p.price || 0), 0)

  const remaining = (manager?.budget ?? BUDGET) - spent

  const showToast = (msg, bad = false) => {
    setToast({ msg, bad })
    setTimeout(() => setToast(null), 2500)
  }

  const togglePlayer = async (player) => {
    const inSquad = squad.includes(player.id)

    if (!inSquad) {
      if (squad.length >= 15) return showToast('⚠ Squad full — 15/15', true)
      if (remaining < (player.price || 0)) return showToast('⚠ Not enough budget', true)

      const teamCount = players.filter(p => squad.includes(p.id) && p.team === player.team).length
      if (teamCount >= 3) return showToast(`⚠ Max 3 players from ${player.team}`, true)

      setSquad(prev => [...prev, player.id])
      showToast(`✓ ${player.name} added`)
    } else {
      setSquad(prev => prev.filter(id => id !== player.id))
      showToast(`${player.name} removed`)
    }
  }

  const saveSquad = async () => {
    if (squad.length !== 15) return showToast('⚠ Select exactly 15 players', true)
    setSaving(true)

    await supabase.from('squads').delete().eq('manager_id', session.user.id)

    const rows = squad.map((pid, i) => ({
      manager_id: session.user.id,
      player_id: pid,
      is_starting: i < 11,
      is_captain: false,
      position_slot: i + 1
    }))

    const { error } = await supabase.from('squads').insert(rows)
    if (error) showToast('❌ Failed to save squad', true)
    else showToast('✅ Squad saved!')

    setSaving(false)
  }

  const posClass = (pos) => pos === 'GK' ? 'pb-gk' : pos === 'DF' ? 'pb-def' : pos === 'MF' ? 'pb-mid' : 'pb-fwd'

  const filtered = players.filter(p =>
    (posFilter === 'ALL' || p.position === posFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase()))
  )

  const squadPlayers = players.filter(p => squad.includes(p.id))

  if (loading) return <div style={{ padding: '8rem 3rem', color: 'var(--muted)' }}>Loading...</div>

  return (
    <div className="transfers-wrap">
      {/* Toast */}
      {toast && (
        <div className={`swap-toast show${toast.bad ? ' bad' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* Deadline bar */}
      <div className="tf-deadline-bar">
        <div>
          <div className="tfd-lbl">Transfer Window</div>
          <div className="tfd-date">OPEN</div>
        </div>
        <div className="tfd-right">
          <div className="tfb">
            <span>{squad.length}/15</span>
            Players
          </div>
          <div className="tfb">
            <span style={{ color: remaining < 0 ? 'var(--red)' : 'var(--green)' }}>
              ₦{remaining.toFixed(1)}M
            </span>
            Remaining
          </div>
          <div className="tfb">
            <span>{manager?.free_transfers ?? 1}</span>
            Free Transfers
          </div>
        </div>
      </div>

      <div className="tf-layout">
        {/* Left — Rules + My Squad */}
        <div>
          <div className="rules-panel">
            <div className="rules-title">📋 Transfer Rules</div>
            <div className="rule-item">
              <span className="ri-icon">💰</span>
              <div className="ri-text"><strong>₦100M budget</strong> to build your 15-man squad</div>
            </div>
            <div className="rule-item">
              <span className="ri-icon">👥</span>
              <div className="ri-text">Max <strong>3 players</strong> from one team</div>
            </div>
            <div className="rule-item">
              <span className="ri-icon">🔄</span>
              <div className="ri-text"><strong>1 free transfer</strong> per gameweek. Extra cost -4pts</div>
            </div>
            <div className="rule-item">
              <span className="ri-icon">🃏</span>
              <div className="ri-text"><strong>1 Wildcard</strong> per season — unlimited free transfers</div>
            </div>
            <div className="rule-item">
              <span className="ri-icon">⚽</span>
              <div className="ri-text">Formation: <strong>4-3-3</strong> — 2GK, 5DF, 5MF, 3FW</div>
            </div>
          </div>

          {/* My Squad */}
          <div className="squad-mini">
            <div className="sm-hd">
              <span className="sm-title">My Squad</span>
              <span className="sq-count">
                <span className="full-c">{squad.length}</span>
                <span className="empty-c">/15</span>
              </span>
            </div>
            <div className="bgt-row">
              <div className="bgt-item">Budget <span className="bgt-val">₦{remaining.toFixed(1)}M</span></div>
              <div className="bgt-item">Spent <span className="bgt-val" style={{ color: 'var(--red)' }}>₦{spent.toFixed(1)}M</span></div>
            </div>
            <div className="sq-slots">
              {squadPlayers.map(p => (
                <div key={p.id} className="sl">
                  <span className={`sl-pos-tag ${p.position === 'GK' ? 'sl-gk' : p.position === 'DF' ? 'sl-def' : p.position === 'MF' ? 'sl-mid' : 'sl-fwd'}`}>
                    {p.position}
                  </span>
                  <span>{p.name}</span>
                  <button className="sl-rm" onClick={() => togglePlayer(p)}>✕</button>
                </div>
              ))}
              {squad.length === 0 && (
                <div style={{ color: 'var(--muted)', fontSize: '.78rem', padding: '.5rem 0' }}>
                  No players selected yet
                </div>
              )}
            </div>
            {squad.length === 15 && (
              <div style={{ padding: '0 1.4rem 1.2rem' }}>
                <button className="btn-primary" style={{ width: '100%' }} onClick={saveSquad} disabled={saving}>
                  {saving ? 'SAVING...' : 'SAVE SQUAD'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right — Player Pool */}
        <div className="pool-panel">
          <div className="pool-hd">
            <input
              className="pool-search"
              placeholder="Search players or teams..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="pos-tabs">
              {['ALL', 'GK', 'DF', 'MF', 'FW'].map(pos => (
                <button
                  key={pos}
                  className={`pos-tab ${posFilter === pos ? 'active' : ''}`}
                  onClick={() => setPosFilter(pos)}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div className="player-list">
            {filtered.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                No players found
              </div>
            ) : filtered.map(p => {
              const inSquad = squad.includes(p.id)
              return (
                <div key={p.id} className="pool-item">
                  <div className={`pi-pos-b ${posClass(p.position)}`}>{p.position}</div>
                  <div>
                    <div className="pi-name">{p.name}</div>
                    <div className="pi-team">{p.team}</div>
                  </div>
                  <div className="pi-form">{p.form ?? 0}★</div>
                  <div className="pi-price">₦{p.price ?? 0}M</div>
                  <button
                    className={`add-btn${inSquad ? ' in' : ''}`}
                    onClick={() => togglePlayer(p)}
                  >
                    {inSquad ? '−' : '+'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
