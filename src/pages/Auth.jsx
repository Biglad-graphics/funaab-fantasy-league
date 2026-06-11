import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'

export default function Auth({ isLogin, setPage }) {
  const { c } = useTheme()
  const [mode, setMode] = useState(isLogin ? 'login' : 'register')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState({
    full_name: '',
    matric_number: '',
    email: '',
    password: ''
  })

  const styles = {
    wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
    bg: { position: 'fixed', inset: 0, backgroundImage: 'url(/field.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(3px) brightness(0.3)', transform: 'scale(1.05)', zIndex: 0 },
    overlay: { position: 'fixed', inset: 0, background: 'linear-gradient(to bottom, rgba(8,12,10,0.6), rgba(8,12,10,0.88))', zIndex: 1 },
    card: { position: 'relative', zIndex: 2, background: c.surface, border: `1px solid ${c.border}`, padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '.85rem', margin: '1rem', backdropFilter: 'blur(20px)', maxHeight: '90vh', overflowY: 'auto' },
    backBtn: { background: 'transparent', border: 'none', color: c.muted, fontSize: '.8rem', fontWeight: '700', cursor: 'pointer', textAlign: 'left', padding: 0, letterSpacing: '1px' },
    logoWrap: { display: 'flex', justifyContent: 'center' },
    logoImg: { width: '60px', height: '60px', objectFit: 'contain' },
    title: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.7rem', textAlign: 'center', color: c.text, lineHeight: 1.05, letterSpacing: '2px' },
    tabs: { display: 'flex', background: c.bg, borderRadius: '8px', padding: '.25rem', gap: '.25rem' },
    tab: { flex: 1, padding: '.6rem', borderRadius: '6px', border: 'none', background: 'transparent', color: c.muted, fontWeight: '800', fontSize: '.82rem', cursor: 'pointer', letterSpacing: '1px' },
    tabActive: { background: c.surface, color: c.green, border: `1px solid ${c.border}` },
    input: { padding: '.8rem 1rem', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.surface, color: c.text, fontSize: '.88rem', outline: 'none', width: '100%' },
    button: { padding: '.9rem', borderRadius: '8px', background: c.green, color: c.bg, fontWeight: '800', fontSize: '.88rem', border: 'none', cursor: 'pointer', letterSpacing: '2px' },
    forgotBtn: { background: 'transparent', border: 'none', color: c.muted, fontSize: '.8rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', letterSpacing: '1px' },
    error: { color: c.red, fontSize: '.78rem', textAlign: 'center', background: `rgba(${c.redRgb},0.08)`, border: `1px solid rgba(${c.redRgb},0.2)`, padding: '.6rem', borderRadius: '7px', fontWeight: '600' },
    successBox: { color: c.green, fontSize: '.78rem', textAlign: 'center', background: `rgba(${c.greenRgb},0.08)`, border: `1px solid rgba(${c.greenRgb},0.2)`, padding: '.6rem', borderRadius: '7px', fontWeight: '600' },
    footer: { borderTop: `1px solid ${c.border}`, paddingTop: '.85rem', textAlign: 'center', fontSize: '.6rem', fontWeight: '700', letterSpacing: '2px', color: c.muted, textTransform: 'uppercase' }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegister = async () => {
    setLoading(true)
    setError(null)
    if (!form.full_name || !form.matric_number || !form.email || !form.password) {
      setError('Please fill all fields')
      setLoading(false)
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          matric_number: form.matric_number
        },
        emailRedirectTo: 'https://funaab-fantasy-league.vercel.app'
      }
    })

    if (error) { setError(error.message); setLoading(false); return }
    setSuccess('✅ Check your email to confirm your account!')
    setLoading(false)
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

  const handleForgotPassword = async () => {
    if (!form.email) { setError('Enter your email first'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: 'https://funaab-fantasy-league.vercel.app'
    })
    if (error) setError(error.message)
    else setSuccess('✅ Password reset email sent!')
    setLoading(false)
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.bg} />
      <div style={styles.overlay} />
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => setPage('landing')}>← Back</button>
        <div style={styles.logoWrap}>
          <img src="/logo.png" alt="Funaabsu League Prediction" style={styles.logoImg} />
        </div>
        <h1 style={styles.title}>
          FUNAABSU
          <span style={{ color: c.green, display: 'block' }}>LEAGUE</span>
          <span style={{ color: c.gold, display: 'block', fontSize: '.55em', letterSpacing: '3px' }}>Prediction</span>
        </h1>

        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }} onClick={() => { setMode('login'); setError(null); setSuccess(null) }}>Login</button>
          <button style={{ ...styles.tab, ...(mode === 'register' ? styles.tabActive : {}) }} onClick={() => { setMode('register'); setError(null); setSuccess(null) }}>Register</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {mode === 'register' && (
          <>
            <input style={styles.input} name="full_name" placeholder="Full Name" onChange={handleChange} />
            <input style={styles.input} name="matric_number" placeholder="Matric Number" onChange={handleChange} />
            <input style={styles.input} name="email" placeholder="Email Address" type="email" onChange={handleChange} />
            <input style={styles.input} name="password" placeholder="Password (min 6 chars)" type="password" onChange={handleChange} />
            <button style={styles.button} onClick={handleRegister} disabled={loading}>
              {loading ? 'PLEASE WAIT...' : 'CREATE ACCOUNT'}
            </button>
          </>
        )}

        {mode === 'login' && (
          <>
            <input style={styles.input} name="email" placeholder="Email Address" type="email" onChange={handleChange} />
            <input style={styles.input} name="password" placeholder="Password" type="password" onChange={handleChange} />
            <button style={styles.button} onClick={handleLogin} disabled={loading}>
              {loading ? 'PLEASE WAIT...' : 'LOGIN'}
            </button>
            <button style={styles.forgotBtn} onClick={handleForgotPassword} disabled={loading}>
              Forgot Password?
            </button>
          </>
        )}

        <div style={styles.footer}>FUNAAB LEAGUE · OFFICIAL FANTASY PLATFORM</div>
      </div>
    </div>
  )
}
