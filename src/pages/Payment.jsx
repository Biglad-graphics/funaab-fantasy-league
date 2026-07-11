import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'

export default function Payment({ session, onDone, onLogout }) {
  const { c } = useTheme()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [screenshot, setScreenshot] = useState(null)
  const [form, setForm] = useState({
    full_name: session?.user?.user_metadata?.full_name || '',
    matric_number: session?.user?.user_metadata?.matric_number || '',
    transaction_id: ''
  })

  const styles = {
    wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
    bg: { position: 'fixed', inset: 0, backgroundImage: 'url(/funaab-fantasy-league/field.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(3px) brightness(0.3)', transform: 'scale(1.05)', zIndex: 0 },
    overlay: { position: 'fixed', inset: 0, background: 'linear-gradient(to bottom, rgba(8,12,10,0.6), rgba(8,12,10,0.88))', zIndex: 1 },
    card: { position: 'relative', zIndex: 2, background: c.surface, border: `1px solid ${c.border}`, padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '.85rem', margin: '1rem', backdropFilter: 'blur(20px)', maxHeight: '90vh', overflowY: 'auto' },
    logo: { width: '50px', height: '50px', objectFit: 'contain', margin: '0 auto', display: 'block' },
    title: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.7rem', textAlign: 'center', color: c.text, letterSpacing: '2px' },
    steps: { display: 'flex', gap: '.5rem', justifyContent: 'center' },
    step: { width: '28px', height: '28px', borderRadius: '50%', background: c.border, color: c.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: '800' },
    stepActive: { background: c.green, color: c.bg },
    payBox: { background: `rgba(${c.greenRgb},.04)`, border: `1px solid rgba(${c.greenRgb},.15)`, borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '.5rem' },
    payTitle: { fontSize: '.7rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: c.muted, marginBottom: '.3rem' },
    payStep: { fontSize: '.82rem', color: c.muted, lineHeight: 1.6 },
    payNumber: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: c.green, textAlign: 'center', letterSpacing: '3px' },
    payBank: { fontSize: '.75rem', fontWeight: '800', color: c.muted, textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase' },
    input: { padding: '.8rem 1rem', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.surface, color: c.text, fontSize: '.88rem', outline: 'none', width: '100%' },
    button: { padding: '.9rem', borderRadius: '8px', background: c.green, color: c.bg, fontWeight: '800', fontSize: '.88rem', border: 'none', cursor: 'pointer', letterSpacing: '2px' },
    outlineBtn: { padding: '.8rem', borderRadius: '8px', background: 'transparent', border: `1px solid ${c.border}`, color: c.muted, fontWeight: '700', fontSize: '.82rem', cursor: 'pointer', letterSpacing: '1px' },
    uploadLabel: { display: 'block', padding: '.8rem', borderRadius: '8px', border: `1px dashed ${c.border}`, color: c.muted, fontSize: '.82rem', fontWeight: '700', textAlign: 'center', cursor: 'pointer' },
    error: { color: c.red, fontSize: '.78rem', textAlign: 'center', background: `rgba(${c.redRgb},0.08)`, border: `1px solid rgba(${c.redRgb},0.2)`, padding: '.6rem', borderRadius: '7px', fontWeight: '600' },
    footer: { borderTop: `1px solid ${c.border}`, paddingTop: '.85rem', textAlign: 'center', fontSize: '.6rem', fontWeight: '700', letterSpacing: '2px', color: c.muted, textTransform: 'uppercase' }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.transaction_id) { setError('Enter your transaction ID'); return }
    if (!screenshot) { setError('Upload your payment screenshot'); return }
    setLoading(true)
    setError(null)

    const fileExt = screenshot.name.split('.').pop()
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, screenshot, { upsert: true })

    if (uploadError) { setError('Failed to upload screenshot'); setLoading(false); return }

    const { data: urlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName)

    const { error: insertError } = await supabase.from('managers').insert({
      id: session.user.id,
      full_name: form.full_name,
      matric_number: form.matric_number,
      transaction_id: form.transaction_id,
      payment_proof: urlData.publicUrl,
      payment_status: 'pending',
      is_new_user: true,
      total_points: 0,
      free_transfers: 1,
      wildcard_used: false,
      budget: 100.0
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    onDone()
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.bg} />
      <div style={styles.overlay} />
      <div style={styles.card}>
        <img src="/logo.png" alt="Collegiate Super League Prediction" style={styles.logo} />
        <h1 style={styles.title}>COMPLETE PAYMENT</h1>

        {/* Step indicators */}
        <div style={styles.steps}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ ...styles.step, ...(step >= s ? styles.stepActive : {}) }}>{s}</div>
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Step 1 - Instructions */}
        {step === 1 && (
          <>
            <div style={styles.payBox}>
              <div style={styles.payTitle}>💳 Payment Instructions</div>
              <div style={styles.payStep}>1. Open your OPay app</div>
              <div style={styles.payStep}>2. Transfer <strong style={{ color: c.green }}>₦500</strong> to:</div>
              <div style={styles.payNumber}>9036997098</div>
              <div style={styles.payBank}>OPay</div>
              <div style={styles.payStep}>3. Save your transaction receipt</div>
              <div style={styles.payStep}>4. Click Next to upload proof</div>
            </div>
            <button style={styles.button} onClick={() => setStep(2)}>
              I HAVE PAID → NEXT
            </button>
            <button style={styles.outlineBtn} onClick={onLogout}>Cancel & Logout</button>
          </>
        )}

        {/* Step 2 - Upload proof */}
        {step === 2 && (
          <>
            <input style={styles.input} name="full_name" placeholder="Full Name" value={form.full_name} onChange={handleChange} />
            <input style={styles.input} name="matric_number" placeholder="Matric Number" value={form.matric_number} onChange={handleChange} />
            <input style={styles.input} name="transaction_id" placeholder="Transaction ID / Reference" onChange={handleChange} />
            <label style={styles.uploadLabel}>
              {screenshot ? `✅ ${screenshot.name}` : '📸 Upload Payment Screenshot'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setScreenshot(e.target.files[0])} />
            </label>
            <button style={styles.button} onClick={handleSubmit} disabled={loading}>
              {loading ? 'SUBMITTING...' : 'SUBMIT FOR VERIFICATION'}
            </button>
            <button style={styles.outlineBtn} onClick={() => setStep(1)}>← Back</button>
          </>
        )}

        <div style={styles.footer}>COLLEGIATE SUPER LEAGUE · OFFICIAL FANTASY PLATFORM</div>
      </div>
    </div>
  )
}
