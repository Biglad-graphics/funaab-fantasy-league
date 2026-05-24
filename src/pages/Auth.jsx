import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth({ isLogin, setPage }) {
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
        emailRedirectTo: 'https://biglad-graphics.github.io/funaab-fantasy-league/'
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
      redirectTo: 'https://biglad-graphics.github.io/funaab-fantasy-league/'
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
          <img src="/funaab-fantasy-league/logo.png" alt="FFL" style={styles.logoImg} />
        </div>
        <h1 style={styles.title}>FANTASY FUNAAB<br />FOOTBALL LEAGUE</h1>

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

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  bg: { position: 'fixed', inset: 0, backgroundImage: 'url(/funaab-fantasy-league/field.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(3px) brightness(0.3)', transform: 'scale(1.05)', zIndex: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'linear-gradient(to bottom, rgba(8,12,10,0.6), rgba(8,12,10,0.88))', zIndex: 1 },
  card: { position: 'relative', zIndex: 2, background: 'rgba(13,20,16,0.95)', border: '1px solid #1E2E20', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '.85rem', margin: '1rem', backdropFilter: 'blur(20px)', maxHeight: '90vh', overflowY: 'auto' },
  backBtn: { background: 'transparent', border: 'none', color: '#5A7A5E', fontSize: '.8rem', fontWeight: '700', cursor: 'pointer', textAlign: 'left', padding: 0, letterSpacing: '1px' },
  logoWrap: { display: 'flex', justifyContent: 'center' },
  logoImg: { width: '60px', height: '60px', objectFit: 'contain' },
  title: { fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.7rem', textAlign: 'center', color: '#E8F5E9', lineHeight: 1.05, letterSpacing: '2px' },
  tabs: { display: 'flex', background: '#080C0A', borderRadius: '8px', padding: '.25rem', gap: '.25rem' },
  tab: { flex: 1, padding: '.6rem', borderRadius: '6px', border: 'none', background: 'transparent', color: '#5A7A5E', fontWeight: '800', fontSize: '.82rem', cursor: 'pointer', letterSpacing: '1px' },
  tabActive: { background: '#0D1410', color: '#00E676', border: '1px solid #1E2E20' },
  input: { padding: '.8rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#0D1410', color: '#E8F5E9', fontSize: '.88rem', outline: 'none', width: '100%' },
  button: { padding: '.9rem', borderRadius: '8px', background: '#00E676', color: '#080C0A', fontWeight: '800', fontSize: '.88rem', border: 'none', cursor: 'pointer', letterSpacing: '2px' },
  forgotBtn: { background: 'transparent', border: 'none', color: '#5A7A5E', fontSize: '.8rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', letterSpacing: '1px' },
  error: { color: '#EF9A9A', fontSize: '.78rem', textAlign: 'center', background: 'rgba(239,154,154,0.08)', border: '1px solid rgba(239,154,154,0.2)', padding: '.6rem', borderRadius: '7px', fontWeight: '600' },
  successBox: { color: '#00E676', fontSize: '.78rem', textAlign: 'center', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', padding: '.6rem', borderRadius: '7px', fontWeight: '600' },
  footer: { borderTop: '1px solid #1E2E20', paddingTop: '.85rem', textAlign: 'center', fontSize: '.6rem', fontWeight: '700', letterSpacing: '2px', color: '#5A7A5E', textTransform: 'uppercase' }
            }
