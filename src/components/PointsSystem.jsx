import { useState } from 'react'

const POINTS_DATA = {
  FW: {
    label: 'Forwards',
    color: '#EF9A9A',
    bgColor: 'rgba(239,154,154,.1)',
    rules: [
      { action: 'Goal scored', points: 4 },
      { action: 'Assist', points: 3 },
      { action: '60+ minutes', points: 2 },
      { action: '1-59 minutes', points: 1 },
      { action: 'Yellow card', points: -1 },
      { action: 'Red card', points: -3 },
      { action: 'Own goal', points: -2 },
      { action: 'Penalty miss', points: -2 }
    ]
  },
  MF: {
    label: 'Midfielders',
    color: '#64B5F6',
    bgColor: 'rgba(100,181,246,.1)',
    rules: [
      { action: 'Goal scored', points: 5 },
      { action: 'Assist', points: 3 },
      { action: 'Clean sheet', points: 1 },
      { action: '60+ minutes', points: 2 },
      { action: '1-59 minutes', points: 1 },
      { action: 'Yellow card', points: -1 },
      { action: 'Red card', points: -3 },
      { action: 'Own goal', points: -2 }
    ]
  },
  DEF: {
    label: 'Defenders',
    color: '#00E676',
    bgColor: 'rgba(0,230,118,.1)',
    rules: [
      { action: 'Goal scored', points: 6 },
      { action: 'Clean sheet', points: 4 },
      { action: 'Assist', points: 3 },
      { action: '60+ minutes', points: 2 },
      { action: '1-59 minutes', points: 1 },
      { action: 'Yellow card', points: -1 },
      { action: 'Red card', points: -3 },
      { action: 'Own goal', points: -2 }
    ]
  },
  GK: {
    label: 'Goalkeeper',
    color: '#FFD700',
    bgColor: 'rgba(255,215,0,.1)',
    rules: [
      { action: 'Goal scored', points: 6 },
      { action: 'Clean sheet', points: 4 },
      { action: 'Assist', points: 3 },
      { action: '60+ minutes', points: 2 },
      { action: '1-59 minutes', points: 1 },
      { action: 'Yellow card', points: -1 },
      { action: 'Red card', points: -3 },
      { action: 'Own goal', points: -2 }
    ]
  }
}

export default function PointsSystem() {
  const [expandedPos, setExpandedPos] = useState(null)

  const togglePosition = (pos) => {
    setExpandedPos(expandedPos === pos ? null : pos)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.sectionLabel}>⚡ POINTS SYSTEM</div>
        <h2 style={styles.title}>Every Action. Every Point.</h2>
        <p style={styles.subtitle}>Points calculated after every FUNAAB match. Captain scores double.</p>
      </div>

      <div style={styles.positionsGrid}>
        {Object.entries(POINTS_DATA).map(([pos, data]) => (
          <div key={pos} style={styles.positionCard}>
            <button
              onClick={() => togglePosition(pos)}
              style={{
                ...styles.positionHeader,
                backgroundColor: data.bgColor,
                borderBottom: expandedPos === pos ? `2px solid ${data.color}` : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flex: 1 }}>
                <span style={{ ...styles.posBadge, color: data.color }}>{pos}</span>
                <span style={styles.posLabel}>{data.label}</span>
              </div>
              <span style={{ fontSize: '1.2rem', color: data.color, transition: 'transform .2s' }}>
                {expandedPos === pos ? '−' : '+'}
              </span>
            </button>

            {expandedPos === pos && (
              <div style={styles.rulesContainer}>
                {data.rules.map((rule, i) => (
                  <div key={i} style={styles.ruleRow}>
                    <span style={styles.ruleAction}>{rule.action}</span>
                    <span style={{ ...styles.rulePoints, color: rule.points > 0 ? '#00E676' : '#EF9A9A' }}>
                      {rule.points > 0 ? '+' : ''}{rule.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.note}>
        💡 <span style={styles.noteText}>Select a position above to see all scoring rules. Captain multiplies points by 2×</span>
      </div>
    </div>
  )
}

const styles = {
  container: { marginBottom: '1.5rem' },
  header: { marginBottom: '1.2rem' },
  sectionLabel: { fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' },
  title: { fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(1.3rem,4vw,2rem)', letterSpacing: '1px', marginBottom: '.3rem', color: '#E8F5E9' },
  subtitle: { fontSize: '.8rem', color: '#5A7A5E', lineHeight: 1.5 },
  positionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  positionCard: { background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', overflow: 'hidden', transition: 'border-color .2s' },
  positionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.2rem',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    width: '100%',
    transition: 'background .2s',
    fontSize: '1rem'
  },
  posBadge: { fontWeight: '800', fontSize: '.75rem', letterSpacing: '1px' },
  posLabel: { fontWeight: '700', fontSize: '.85rem', color: '#E8F5E9' },
  rulesContainer: { padding: '0.8rem 1.2rem', borderTop: '1px solid #1E2E20', background: 'rgba(0,0,0,.3)' },
  ruleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '.6rem', marginBottom: '.6rem', borderBottom: '1px solid rgba(30,46,32,.5)', fontSize: '.82rem' },
  ruleAction: { color: '#5A7A5E' },
  rulePoints: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', fontWeight: '700' },
  note: { display: 'flex', alignItems: 'center', gap: '.6rem', padding: '1rem 1.2rem', background: 'rgba(0,230,118,.05)', border: '1px solid rgba(0,230,118,.15)', borderRadius: '8px', fontSize: '.8rem', color: '#5A7A5E' },
  noteText: { color: '#E8F5E9' }
}
