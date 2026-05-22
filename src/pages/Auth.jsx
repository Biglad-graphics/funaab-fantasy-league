import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    display_name: '',
    matric_number: '',
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
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    })
    if (error) { setError(error.message); setLoading(false); return }
    const { error: profileError } = await supabase.from('managers').insert({
      id: data.user.id,
      display_name: form.display_name,
      matric_number: form.matric_number,
      department: form.department
    })
    if (profileError) setError(profileError.message)
    setLoading(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-bg" />
      <div className="auth-overlay" />

      <div className="auth-card">
        <div className="auth-logo-wrap">
          <img src="/funaab-fantasy-league/logo.png" alt="FFL" className="auth-logo-img" />
        </div>

        <h1 className="auth-title">FANTASY FUNAAB<br />FOOTBALL LEAGUE</h1>
        <p className="auth-sub">{isLogin ? 'Sign in to manage your squad' : 'Create your manager account'}</p>

        {error && <div className="auth-error">{error}</div>}

        {!isLogin && (
          <>
            <input className="auth-input" name="display_name" placeholder="Team Name" onChange={handleChange} />
            <input className="auth-input" name="matric_number" placeholder="Matric Number" onChange={handleChange} />
            <input className="auth-input" name="department" placeholder="Department" onChange={handleChange} />
          </>
        )}

        <input className="auth-input" name="email" placeholder="Email Address" type="email" onChange={handleChange} />
        <input className="auth-input" name="password" placeholder="Password" type="password" onChange={handleChange} />

        <button className="btn-primary auth-btn" onClick={isLogin ? handleLogin : handleRegister} disabled={loading}>
          {loading ? 'PLEASE WAIT...' : isLogin ? 'LOGIN' : 'CREATE ACCOUNT'}
        </button>

        <p className="auth-toggle">
          {isLogin ? "New manager? " : 'Already registered? '}
          <span className="auth-link" onClick={() => { setIsLogin(!isLogin); setError(null) }}>
            {isLogin ? 'Register here' : 'Login'}
          </span>
        </p>

        <div className="auth-footer">FUNAAB LEAGUE · OFFICIAL FANTASY PLATFORM</div>
      </div>
    </div>
  )
}import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    display_name: '',
    matric_number: '',
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
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    })
    if (error) { setError(error.message); setLoading(false); return }
    const { error: profileError } = await supabase.from('managers').insert({
      id: data.user.id,
      display_name: form.display_name,
      matric_number: form.matric_number,
      department: form.department
    })
    if (profileError) setError(profileError.message)
    setLoading(false)
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Bricolage+Grotesque:wght@300;400;600;800&display=swap" rel="stylesheet" />
      <div style={styles.wrapper}>
        {/* Background */}
        <div style={styles.bg} />
        <div style={styles.overlay} />

        {/* Noise texture */}
        <div style={styles.noise} />

        {/* Card */}
        <div style={styles.card}>
          {/* Logo */}
          <div style={styles.logoWrap}>
            <img
              src="/funaab-fantasy-league/logo.png"
              alt="FFL"
              style={styles.logoImg}
              onError={e => { e.target.style.display = 'none' }}
            />
           
          <h1 style={styles.title}>FUNAAB<br />FANTASY LEAGUE</h1>
          <p style={styles.subtitle}>
            {isLogin ? 'Sign in to manage your squad' : 'Create your manager account'}
          </p>

          {error && <div style={styles.error}>{error}</div>}

          {!isLogin && (
            <>
              <input style={styles.input} name="display_name" placeholder="Team Name" onChange={handleChange} />
              <input style={styles.input} name="matric_number" placeholder="Matric Number" onChange={handleChange} />
              <input style={styles.input} name="department" placeholder="Department" onChange={handleChange} />
            </>
          )}

          <input style={styles.input} name="email" placeholder="Email Address" type="email" onChange={handleChange} />
          <input style={styles.input} name="password" placeholder="Password" type="password" onChange={handleChange} />

          <button
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            onClick={isLogin ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? 'PLEASE WAIT...' : isLogin ? 'LOGIN' : 'CREATE ACCOUNT'}
          </button>

          <p style={styles.toggle}>
            {isLogin ? "New manager? " : 'Already registered? '}
            <span style={styles.link} onClick={() => { setIsLogin(!isLogin); setError(null) }}>
              {isLogin ? 'Register here' : 'Login'}
            </span>
          </p>

          <div style={styles.divider}>
            <span style={styles.dividerText}>FUNAAB LEAGUE · OFFICIAL FANTASY PLATFORM</span>
          </div>
        </div>
      </div>
    </>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    background: '#080C0A'
  },
  bg: {
    position: 'fixed',
    inset: 0,
    backgroundImage: 'url(/funaab-fantasy-league/field.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(3px) brightness(0.35)',
    transform: 'scale(1.05)',
    zIndex: 0
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(8,12,10,0.6) 0%, rgba(8,12,10,0.85) 100%)',
    zIndex: 1
  },
  noise: {
    position: 'fixed',
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
    pointerEvents: 'none',
    zIndex: 2,
    opacity: 0.5
  },
  card: {
    position: 'relative',
    zIndex: 3,
    background: 'rgba(13,20,16,0.92)',
    border: '1px solid #1E2E20',
    padding: '2.5rem 2rem',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    margin: '1rem',
    backdropFilter: 'blur(20px)'
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    marginBottom: '0.2rem'
  },
  logoImg: {
    width: '40px',
    height: '40px',
    objectFit: 'contain'
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.6rem',
    letterSpacing: '3px',
    color: '#00E676',
    textShadow: '0 0 20px rgba(0,230,118,0.4)'
  },
  logoSpan: {
    color: '#FFD700'
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '2rem',
    fontWeight: '400',
    textAlign: 'center',
    color: '#E8F5E9',
    lineHeight: 1.05,
    letterSpacing: '3px'
  },
  subtitle: {
    textAlign: 'center',
    color: '#5A7A5E',
    fontSize: '0.78rem',
    fontWeight: '700',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '0.3rem'
  },
  input: {
    padding: '0.8rem 1rem',
    borderRadius: '8px',
    border: '1px solid #1E2E20',
    background: '#0D1410',
    color: '#E8F5E9',
    fontSize: '0.88rem',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    padding: '0.9rem',
    borderRadius: '8px',
    background: '#00E676',
    color: '#080C0A',
    fontWeight: '800',
    fontSize: '0.88rem',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '2px',
    marginTop: '0.3rem',
    transition: 'all 0.2s'
  },
  error: {
    color: '#EF9A9A',
    fontSize: '0.78rem',
    textAlign: 'center',
    background: 'rgba(239,154,154,0.08)',
    border: '1px solid rgba(239,154,154,0.2)',
    padding: '0.6rem',
    borderRadius: '7px',
    fontWeight: '600'
  },
  toggle: {
    textAlign: 'center',
    color: '#5A7A5E',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  link: {
    color: '#00E676',
    cursor: 'pointer',
    fontWeight: '800'
  },
  divider: {
    borderTop: '1px solid #1E2E20',
    paddingTop: '0.85rem',
    textAlign: 'center',
    marginTop: '0.2rem'
  },
  dividerText: {
    fontSize: '0.6rem',
    fontWeight: '700',
    letterSpacing: '2px',
    color: '#5A7A5E',
    textTransform: 'uppercase'
  }
}
