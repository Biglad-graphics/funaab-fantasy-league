import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Status({ manager }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('managers')
        .select('id, display_name, department, total_points')
        .order('total_points', { ascending: false })
        .limit(10)
      setLeaderboard(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const myRank = leaderboard.findIndex(m => m.id === manager?.id) + 1

  return (
    <div className="status-page">
      {manager && (
        <div className="welcome-card">
          <div>
            <div className="wl-greet">Welcome back, Manager</div>
            <div className="wl-name">{manager.display_name}</div>
            <div className="wl-team">⚽ {manager.department}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="vbadge">✓ FUNAAB Verified</div>
            <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '.4rem' }}>
              Matric: {manager.matric_number}
            </div>
          </div>
        </div>
      )}

      <div className="status-grid">
        <div className="sc">
          <div className="sc-lbl">Total Points</div>
          <div className="sc-val green">{manager?.total_points ?? 0}</div>
          <div className="sc-sub">Season total</div>
        </div>
        <div className="sc">
          <div className="sc-lbl">Overall Rank</div>
          <div className="sc-val gold">#{myRank || '--'}</div>
          <div className="sc-sub">of {leaderboard.length} managers</div>
        </div>
        <div className="sc">
          <div className="sc-lbl">Free Transfers</div>
          <div className="sc-val white">{manager?.free_transfers ?? 1}</div>
          <div className="sc-sub">Available</div>
        </div>
      </div>

      <div className="section-tag" style={{ marginBottom: '.6rem' }}>
        <span className="live-dot" />Points & Rankings
      </div>

      <div className="leaderboard">
        <div className="lb-head">
          <span>Rank</span>
          <span>Manager</span>
          <span>Dept</span>
          <span>Points</span>
        </div>
        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : leaderboard.map((m, i) => (
          <div key={m.id} className={`lb-row ${m.id === manager?.id ? 'you' : ''}`}>
            <span className={`rnk ${i === 0 ? 'g' : i === 1 ? 's' : i === 2 ? 'b' : ''}`}>
              {i + 1}
            </span>
            <div className="lb-user">
              <div className="lb-av">{m.display_name?.charAt(0)}</div>
              <div>
                <div className="lb-name">{m.display_name}</div>
                <div className="lb-team">{m.department}</div>
              </div>
            </div>
            <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{m.department}</span>
            <span className="lb-pts">{m.total_points}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
