export default function PointsSystem() {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>⚡ SCORING RULES</div>
      <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(1.3rem,4vw,2rem)', letterSpacing: '1px', marginBottom: '.3rem', color: '#E8F5E9' }}>How Points Work</h2>
      <p style={{ fontSize: '.8rem', color: '#5A7A5E', lineHeight: 1.5, marginBottom: '1.2rem' }}>
        Submit your prediction before kickoff. Points are awarded once the admin confirms the result.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          {
            pts: '+5',
            label: 'Correct Score',
            desc: 'You predicted the exact scoreline — both home and away goals right.',
            color: '#00E676',
            bg: 'rgba(0,230,118,.08)',
            border: 'rgba(0,230,118,.25)'
          },
          {
            pts: '+3',
            label: 'Correct Outcome',
            desc: 'Right result (Home Win / Draw / Away Win) but the scoreline was wrong.',
            color: '#64B5F6',
            bg: 'rgba(100,181,246,.08)',
            border: 'rgba(100,181,246,.25)'
          },
          {
            pts: '0',
            label: 'Wrong Prediction',
            desc: 'Incorrect outcome — no points this round. Better luck next match.',
            color: '#EF9A9A',
            bg: 'rgba(239,154,154,.05)',
            border: 'rgba(239,154,154,.15)'
          }
        ].map(r => (
          <div key={r.label} style={{ background: r.bg, border: `1px solid ${r.border}`, borderRadius: '12px', padding: '1.4rem' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: r.color, lineHeight: 1, marginBottom: '.4rem' }}>{r.pts}</div>
            <div style={{ fontWeight: '800', fontSize: '.85rem', color: '#E8F5E9', marginBottom: '.4rem' }}>{r.label}</div>
            <div style={{ fontSize: '.78rem', color: '#5A7A5E', lineHeight: 1.5 }}>{r.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'flex-start', gap: '.6rem', padding: '1rem 1.2rem', background: 'rgba(0,230,118,.05)', border: '1px solid rgba(0,230,118,.15)', borderRadius: '8px', fontSize: '.8rem' }}>
        <span>💡</span>
        <span style={{ color: '#E8F5E9', lineHeight: 1.6 }}>
          Predictions lock at kickoff. You can update your pick any time before the match starts — so submit early and adjust if needed.
        </span>
      </div>
    </div>
  )
}
