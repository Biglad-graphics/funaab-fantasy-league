import { useTheme } from '../lib/ThemeContext'

export default function Pending({ rejected, onLogout }) {
  const { c } = useTheme()

  const styles = {
    wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, padding: '2rem' },
    card: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '2.5rem 2rem', maxWidth: '420px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' },
    title: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '2px' },
    sub: { color: c.muted, fontSize: '.88rem', lineHeight: 1.7 },
    infoBox: { background: `rgba(${c.greenRgb},.05)`, border: `1px solid rgba(${c.greenRgb},.15)`, borderRadius: '10px', padding: '1rem', fontSize: '.8rem', color: c.muted, lineHeight: 1.8 },
    outlineBtn: { padding: '.8rem', borderRadius: '8px', background: 'transparent', border: `1px solid ${c.border}`, color: c.muted, fontWeight: '700', fontSize: '.82rem', cursor: 'pointer', letterSpacing: '1px' }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={{ fontSize: '3rem', textAlign: 'center' }}>{rejected ? '❌' : '⏳'}</div>
        <h2 style={{ ...styles.title, color: rejected ? c.red : c.text }}>
          {rejected ? 'PAYMENT REJECTED' : 'AWAITING CONFIRMATION'}
        </h2>
        <p style={styles.sub}>
          {rejected
            ? 'Your payment was not confirmed. Please contact the admin or resubmit your proof.'
            : 'Your payment is being reviewed. You will get access once confirmed by admin.'}
        </p>
        {!rejected && (
          <div style={styles.infoBox}>
            📱 Sent to <strong style={{ color: c.text }}>9036997098 OPay</strong><br />
            If you haven't paid yet, please do so and contact admin.
          </div>
        )}
        <button style={styles.outlineBtn} onClick={onLogout}>LOGOUT</button>
      </div>
    </div>
  )
}
