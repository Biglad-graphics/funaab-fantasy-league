export default function Pending({ rejected, onLogout }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={{ fontSize: '3rem', textAlign: 'center' }}>{rejected ? '❌' : '⏳'}</div>
        <h2 style={{ ...styles.title, color: rejected ? '#EF9A9A' : '#E8F5E9' }}>
          {rejected ? 'PAYMENT REJECTED' : 'AWAITING CONFIRMATION'}
        </h2>
        <p style={styles.sub}>
          {rejected
            ? 'Your payment was not confirmed. Please contact the admin or resubmit your proof.'
            : 'Your payment is being reviewed. You will get access once confirmed by admin.'}
        </p>
        {!rejected && (
          <div style={styles.infoBox}>
            📱 Sent to <strong style={{ color: '#E8F5E9' }}>9036997098 OPay</strong><br />
            If you haven't paid yet, please do so and contact admin.
          </div>
        )}
        <button style={styles.outlineBtn} onClick={onLogout}>LOGOUT</button>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080C0A', padding: '2rem' },
  card: { background: '#0D1410', border: '1px solid #1E2E20', borderRadius: '16px', padding: '2.5rem 2rem', maxWidth: '420px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' },
  title: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '2px' },
  sub: { color: '#5A7A5E', fontSize: '.88rem', lineHeight: 1.7 },
  infoBox: { background: 'rgba(0,230,118,.05)', border: '1px solid rgba(0,230,118,.15)', borderRadius: '10px', padding: '1rem', fontSize: '.8rem', color: '#5A7A5E', lineHeight: 1.8 },
  outlineBtn: { padding: '.8rem', borderRadius: '8px', background: 'transparent', border: '1px solid #1E2E20', color: '#5A7A5E', fontWeight: '700', fontSize: '.82rem', cursor: 'pointer', letterSpacing: '1px' }
}
