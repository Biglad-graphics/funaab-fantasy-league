import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Fixtures() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchMatches()

    const channel = supabase
      .channel('fixtures-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('matchday', { ascending: true })
    setMatches(data || [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? matches : matches.filter(m => m.status === filter)
  const grouped = filtered.reduce((acc, m) => {
    const gw = `Matchday ${m.matchday}`
    if (!acc[gw]) acc[gw] = []
    acc[gw].push(m)
    return acc
  }, {})

  if (loading) return <div style={{ color: '#5A7A5E', padding: '2rem' }}>Loading...</div>

  return (
    <div>
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>📅 Schedule</div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '2px', marginBottom: '1.5rem' }}>Fixtures</h1>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['all', 'All'], ['scheduled', 'Upcoming'], ['live', '🔴 Live'], ['completed', 'Completed']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ background: filter === val ? 'rgba(0,230,118,.09)' : '#111A13', border: filter === val ? '1px solid #00E676' : '1px solid #1E2E20', color: filter === val ? '#00E676' : '#5A7A5E', padding: '.45rem 1rem', borderRadius: '8px', fontSize: '.75rem', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', color: '#5A7A5E' }}>
          No matches found
        </div>
      ) : Object.entries(grouped).map(([gw, gwMatches]) => (
        <div key={gw} style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '.7rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '.6rem', paddingLeft: '.2rem' }}>{gw}</div>
          <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', overflow: 'hidden' }}>
            {gwMatches.map((m, i) => (
              <div key={m.id} style={{ padding: '1rem 1.4rem', borderBottom: i < gwMatches.length - 1 ? '1px solid rgba(30,46,32,.5)' : 'none', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Status */}
                <div style={{ width: '60px', flexShrink: 0 }}>
                  <span style={{ fontSize: '.6rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', padding: '.2rem .5rem', borderRadius: '100px', background: m.status === 'live' ? 'rgba(0,230,118,.1)' : m.status === 'completed' ? 'rgba(90,122,94,.1)' : 'rgba(100,181,246,.1)', color: m.status === 'live' ? '#00E676' : m.status === 'completed' ? '#5A7A5E' : '#64B5F6' }}>
                    {m.status === 'live' ? '🔴 Live' : m.status === 'completed' ? 'FT' : 'Soon'}
                  </span>
                </div>

                {/* Match */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '700', fontSize: '.9rem', textAlign: 'right', flex: 1 }}>{m.home_team}</span>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: '#5A7A5E', flexShrink: 0 }}>vs</span>
                  <span style={{ fontWeight: '700', fontSize: '.9rem', flex: 1 }}>{m.away_team}</span>
                </div>

                {/* Meta */}
                <div style={{ width: '120px', textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '.72rem', color: '#5A7A5E' }}>{m.venue || 'TBD'}</div>
                  {m.kickoff_time && (
                    <div style={{ fontSize: '.68rem', color: '#5A7A5E', marginTop: '.1rem' }}>
                      {new Date(m.kickoff_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {new Date(m.kickoff_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
