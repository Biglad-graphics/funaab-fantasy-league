import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth({ onBack }) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [screenshot, setScreenshot] = useState(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    display_name: '',
    department: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleRegister = async () => {
    setLoading(true)
    setError(null)

    if (!screenshot) {
      setError('Please upload your payment screenshot')
      setLoading(false)
      return
    }

    if (!form.display_name || !form.department || !form.email || !form.password) {
      setError('Please fill all fields')
      setLoading(false)
      return
    }

    // Sign up
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    })
    if (error) { setError(error.message); setLoading(false); return }

    // Upload screenshot
    const fileExt = screenshot.name.split('.').pop()
    const fileName = `${data.user.id}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, screenshot)

    if (uploadError) { setError('Failed to upload screenshot'); setLoading(false); return }

    const { data: urlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName)

    // Create manager profile
    const { error: profileError } = await supabase.from('managers').insert({
      id: data.user.id,
      display_name: form.display_name,
      department: form.department,
      payment_status: 'pending',
      payment_proof: urlData.publicUrl
    })

    if (profileError) { setError(profileError.message); setLoading(false); return }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.bg} />
        <div style={styles.overlay} />
        <div style={styles.card}>
          <div style={{ fontSize: '3rem', textAlign: 'center' }}>✅</div>
          <h2 style={{ ...styles.title, fontSize: '1.5rem' }}>SUBMITTED!</h2>
          <p style={{ color: '#5A7A5E', fontSize: '.85rem', textAlign: 'center', lineHeight: 1.7 }}>
            Your registration and payment proof have been submitted. We'll confirm your payment shortly.
          </p>
          <button style={styles.button} onClick={() => { setSubmitted(false); setIsLogin(true) }}>
            GO TO LOGIN
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.bg} />
      <div style={styles.overlay} />

      <div style={styles.card}>
        {/* Back button */}
        <button style={styles.backBtn} onClick={onBack}>← Back</button>

        {/* Logo */}
        <div style={styles.logoWrap}>
          <img src="/funaab-fantasy-league/logo.png" alt="FFL" style={styles.logoImg} />
        </div>

        <h1 style={styles.title}>FANTASY FUNAAB<br />FOOTBALL LEAGUE</h1>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isLogin ? styles.tabActive : {}) }}
            onClick={() => { setIsLogin(true); setError(null) }}
          >
            Login
          </button>
          <button
            style={{ ...styles.tab, ...(!isLogin ? styles.tabActive : {}) }}
            onClick={() => { setIsLogin(false); setError(null) }}
          >
            Register
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* LOGIN */}
        {isLogin && (
          <>
            <input style={styles.input} name="email" placeholder="Email Address" type="email" onChange={handleChange} />
            <input style={styles.input} name="password" placeholder="Password" type="password" onChange={handleChange} />
            <button style={styles.button} onClick={handleLogin} disabled={loading}>
              {loading ? 'PLEASE WAIT...' : 'LOGIN'}
            </button>
          </>
        )}

        {/* REGISTER */}
        {!isLogin && (
          <>
            <input style={styles.input} name="display_name" placeholder="Team Name" onChange={handleChange} />
            <input style={styles.input} name="department" placeholder="Department" onChange={handleChange} />
            <input style={styles.input} name="email" placeholder="Email Address" type="email" onChange={handleChange} />
            <input style={styles.input} name="password" placeholder="Password (min 6 chars)" type="password" onChange={handleChange} />

            {/* Payment instruction */}
            <div style={styles.payBox}>
              <div style={styles.payTitle}>💳 Payment Instructions</div>
              <div style={styles.payText}>
                Send <strong style={{ color: '#E8F5E9' }}>₦500</strong> to:<br />
                <strong style={{ color: '#00E676', fontSize: '1.1rem' }}>9036997098</strong><br />
                <span style={{ color: '#5A7A5E' }}>OPay</span>
              </div>
            </div>

            {/* Screenshot upload */}
            <div style={styles.uploadWrap}>
              <label style={styles.uploadLabel}>
                {screenshot ? `✅ ${screenshot.name}` : '📸 Upload Payment Screenshot'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => setScreenshot(e.target.files[0])}
                />
              </label>
            </div>

            <button style={styles.button} onClick={handleRegister} disabled={loading}>
              {loading ? 'SUBMITTING...' : 'REGISTER & SUBMIT'}
            </button>
          </>
        )}

        <div style={styles.footer}>FUNAAB LEAGUE · OFFICIAL FANTASY PLATFORM</div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  bg: {
    position: 'fixed',
    inset: 0,
    backgroundImage: 'url(/funaab-fantasy-league/field.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(3px) brightness(0.3)',
    transform: 'scale(1.05)',
    zIndex: 0
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(8,12,10,0.6), rgba(8,12,10,0.88))',
    zIndex: 1
  },
  card: {
    position: 'relative',
    zIndex: 2,
    background: 'rgba(13,20,16,0.95)',
    border: '1px solid #1E2E20',
    padding: '2rem',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '.85rem',
    margin: '1rem',
    backdropFilter: 'blur(20px)',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: '#5A7A5E',
    fontSize: '.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'left',
    padding: 0,
    letterSpacing: '1px'
  },
  logoWrap: { display: 'flex', justifyContent: 'center' },
  logoImg: { width: '60px', height: '60px', objectFit: 'contain' },
  title: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '1.7rem',
    textAlign: 'center',
    color: '#E8F5E9',
    lineHeight: 1.05,
    letterSpacing: '2px'
  },
  tabs: {
    display: 'flex',
    background: '#080C0A',
    borderRadius: '8px',
    padding: '.25rem',
    gap: '.25rem'
  },
  tab: {
    flex: 1,
    padding: '.6rem',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: '#5A7A5E',
    fontWeight: '800',
    fontSize: '.82rem',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'all .2s'
  },
  tabActive: {
    background: '#0D1410',
    color: '#00E676',
    border: '1px solid #1E2E20'
  },
  input: {
    padding: '.8rem 1rem',
    borderRadius: '8px',
    border: '1px solid #1E2E20',
    background: '#0D1410',
    color: '#E8F5E9',
    fontSize: '.88rem',
    outline: 'none',
    width: '100%'
  },
  button: {
    padding: '.9rem',
    borderRadius: '8px',
    background: '#00E676',
    color: '#080C0A',
    fontWeight: '800',
    fontSize: '.88rem',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '2px'
  },
  error: {
    color: '#EF9A9A',
    fontSize: '.78rem',
    textAlign: 'center',
    background: 'rgba(239,154,154,0.08)',
    border: '1px solid rgba(239,154,154,0.2)',
    padding: '.6rem',
    borderRadius: '7px',
    fontWeight: '600'
  },
  payBox: {
    background: 'rgba(0,230,118,.05)',
    border: '1px solid rgba(0,230,118,.15)',
    borderRadius: '10px',
    padding: '1rem',
    textAlign: 'center'
  },
  payTitle: {
    fontSize: '.7rem',
    fontWeight: '800',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#5A7A5E',
    marginBottom: '.5rem'
  },
  payText: {
    fontSize: '.88rem',
    color: '#5A7A5E',
    lineHeight: 1.8
  },
  uploadWrap: { width: '100%' },
  uploadLabel: {
    display: 'block',
    padding: '.8rem',
    borderRadius: '8px',
    border: '1px dashed #1E2E20',
    color: '#5A7A5E',
    fontSize: '.82rem',
    fontWeight: '700',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all .2s'
  },
  footer: {
    borderTop: '1px solid #1E2E20',
    paddingTop: '.85rem',
    textAlign: 'center',
    fontSize: '.6rem',
    fontWeight: '700',
    letterSpacing: '2px',
    color: '#5A7A5E',
    textTransform: 'uppercase'
  }
      }
