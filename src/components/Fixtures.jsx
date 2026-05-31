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
      .order('kickoff_time', { ascending: true })
    setMatches(data || [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? matches : matches.filter(m => m.status === filter)
  const liveMatches = filtered.filter(m => m.status === 'live')
  const upcomingMatches = filtered.filter(m => m.status === 'scheduled')
  const completedMatches = filtered.filter(m => m.status === 'completed')

  if (loading) return <div style={{ color: '#5A7A5E', padding: '2rem' }}>Loading...</div>

  return (
    <div>
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>📅 Schedule</div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '2px', marginBottom: '1.5rem' }}>Fixtures</h1>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['all', 'All'], ['live', '🔴 Live'], ['scheduled', 'Upcoming'], ['completed', 'Completed']].map(([val, label]) => (
          <button 
            key={val} 
            onClick={() => setFilter(val)} 
            style={{ 
              background: filter === val ? 'rgba(0,230,118,.09)' : '#111A13', 
              border: filter === val ? '1px solid #00E676' : '1px solid #1E2E20', 
              color: filter === val ? '#00E676' : '#5A7A5E', 
              padding: '.45rem 1rem', 
              borderRadius: '8px', 
              fontSize: '.75rem', 
              fontWeight: '700', 
              letterSpacing: '1px', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Live Matches */}
      {(filter === 'all' || filter === 'live') && liveMatches.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '.7rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: '#00E676', marginBottom: '1rem' }}>🔴 Live Now</div>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
            {liveMatches.map(m => (
              <MatchCard key={m.id} match={m} status="live" />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      {(filter === 'all' || filter === 'scheduled') && upcomingMatches.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '.7rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: '#64B5F6', marginBottom: '1rem' }}>⏰ Upcoming</div>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
            {upcomingMatches.map(m => (
              <MatchCard key={m.id} match={m} status="scheduled" />
            ))}
          </div>
        </div>
      )}

      {/* Completed Matches */}
      {(filter === 'all' || filter === 'completed') && completedMatches.length > 0 && (
        <div>
          <div style={{ fontSize: '.7rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '1rem' }}>✅ Completed</div>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
            {completedMatches.map(m => (
              <MatchCard key={m.id} match={m} status="completed" />
            ))}
          </div>
        </div>
      )}

      {/* No matches */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', color: '#5A7A5E' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
          <p>No matches found</p>
        </div>
      )}
    </div>
  )
}

function MatchCard({ match, status }) {
  const getStatusStyle = (status) => {
    if (status === 'live') {
      return { bg: 'rgba(0,230,118,.08)', border: '1px solid rgba(0,230,118,.25)', tag: '🔴 LIVE', tagBg: 'rgba(0,230,118,.1)', tagColor: '#00E676' }
    } else if (status === 'scheduled') {
      return { bg: 'rgba(100,181,246,.05)', border: '1px solid rgba(100,181,246,.15)', tag: '⏰ Soon', tagBg: 'rgba(100,181,246,.1)', tagColor: '#64B5F6' }
    } else {
      return { bg: 'rgba(90,122,94,.05)', border: '1px solid rgba(90,122,94,.15)', tag: '✅ FT', tagBg: 'rgba(90,122,94,.1)', tagColor: '#5A7A5E' }
    }
  }

  const style = getStatusStyle(status)

  return (
    <div style={{
      background: style.bg,
      border: style.border,
      borderRadius: '12px',
      padding: '1.2rem',
      transition: 'all 0.2s'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '.65rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E' }}>
          GW{match.matchday}
        </div>
        <span style={{ 
          fontSize: '.62rem', 
          fontWeight: '800', 
          letterSpacing: '1px', 
          padding: '.25rem .7rem', 
          borderRadius: '100px', 
          background: style.tagBg, 
          color: style.tagColor,
          textTransform: 'uppercase'
        }}>
          {style.tag}
        </span>
      </div>

      {/* Teams & Score */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '.6rem' }}>
          <div style={{ flex: 1, fontWeight: '700', fontSize: '.9rem', textAlign: 'right' }}>
            {match.home_team}
          </div>
          <div style={{ 
            fontFamily: 'Bebas Neue, sans-serif', 
            fontSize: status === 'scheduled' ? '1.2rem' : '2rem', 
            color: status === 'live' ? '#00E676' : status === 'completed' ? '#E8F5E9' : '#5A7A5E',
            fontWeight: '700',
            minWidth: '80px',
            textAlign: 'center'
          }}>
            {status === 'scheduled' ? 'vs' : `${match.home_score ?? 0}—${match.away_score ?? 0}`}
          </div>
          <div style={{ flex: 1, fontWeight: '700', fontSize: '.9rem', textAlign: 'left' }}>
            {match.away_team}
          </div>
        </div>
      </div>

      {/* Venue & Date */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: '.8rem' }}>
        <div style={{ fontSize: '.72rem', color: '#5A7A5E', marginBottom: '.3rem' }}>
          📍 {match.venue || 'TBD'}
        </div>
        {match.kickoff_time && (
          <div style={{ fontSize: '.72rem', color: '#5A7A5E' }}>
            🕐 {new Date(match.kickoff_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Live indicator */}
      {status === 'live' && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '.6rem 1rem', 
          background: 'rgba(0,230,118,.1)', 
          border: '1px solid #00E676', 
          borderRadius: '8px', 
          textAlign: 'center', 
          fontSize: '.75rem', 
          fontWeight: '700', 
          color: '#00E676',
          letterSpacing: '1px'
        }}>
          Match in progress
        </div>
      )}
    </div>
  )
          }
