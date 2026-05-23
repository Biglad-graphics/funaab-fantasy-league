export default function Pending({ rejected, onLogout }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <img src="/funaab-fantasy-league/logo.png" alt="FFL" style={styles.logo} />

        {rejected ? (
          <>
            <div style={styles.iconBad}>❌</div>
            <h2 style={styles.title}>Payment Rejected</h2>
            <p style={styles.sub}>
              Your payment proof was rejected. Please make sure you sent ₦500 to <strong>9036997098 (OPay)</strong> and resubmit with a clear screenshot.
            </p>
            <p style={styles.sub}>Contact admin for assistance.</p>
          </>
        ) : (
          <>
            <div style={styles.iconGood}>⏳</div>
            <h2 style={styles.title}>Awaiting Confirmation</h2>
            <p style={styles.sub}>
              Your payment screenshot has been submitted. Admin will confirm your payment shortly and you'll get full access.
            </p>
            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Amount</span>
                <span style={styles.infoVal}>₦500</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Account</span>
                <span style={styles.infoVal}>9036997098</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Bank</span>
                <span style={styles.infoVal}>OPay</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Status</span>
                <span style={{ ...styles.infoVal, color: '#FFD700' }}>Pending ⏳</span>
              </div>
            </div>
          </>
        )}

        <button style={styles.btn} onClick={onLogout}>Logout</button>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#080C0A',
    padding: '1rem'
  },
  card: {
    background: '#0D1410',
    border: '1px solid #1E2E20',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    maxWidth: '420px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    textAlign: 'center'
  },
  logo: { width: '56px', height: '56px', objectFit: 'contain' },
  iconGood: { fontSize: '2.5rem' },
  iconBad: { fontSize: '2.5rem' },
  title: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '1.8rem',
    letterSpacing: '2px',
    color: '#E8F5E9'
  },
  sub: {
    color: '#5A7A5E',
    fontSize: '.85rem',
    lineHeight: 1.6
  },
  infoBox: {
    background: '#111A13',
    border: '1px solid #1E2E20',
    borderRadius: '10px',
    padding: '1rem 1.4rem',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '.6rem'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '.82rem'
  },
  infoLabel: { color: '#5A7A5E' },
  infoVal: { fontWeight: '700', color: '#E8F5E9' },
  btn: {
    background: 'transparent',
    border: '1px solid #1E2E20',
    color: '#5A7A5E',
    padding: '.6rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '.82rem',
    fontWeight: '700',
    marginTop: '.5rem'
  }
}
