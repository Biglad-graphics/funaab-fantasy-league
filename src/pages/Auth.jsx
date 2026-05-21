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
    <div style={styles.wrapper}>
      {/* Background */}
      <div style={styles.bg} />
      <div style={styles.overlay} />

      {/* Card */}
      <div style={styles.card}>
        <div style={styles.badge}>⚽ FFL</div>
        <h1 style={styles.title}>FUNAAB<br />FANTASY LEAGUE</h1>
        <p style={styles.subtitle}>{isLogin ? 'Sign in to manage your squad' : 'Create your manager account'}</p>

        {error && <p style={styles.error}>{error}</p>}

        {!isLogin && (
          <>
            <input style={styles.input} name="display_name" placeholder="Team Name" onChange={handleChange} />
            <input style={styles.input} name="matric_number" placeholder="Matric Number" onChange={handleChange} />
            <input style={styles.input} name="department" placeholder="Department" onChange={handleChange} />
          </>
        )}

        <input style={styles.input} name="email" placeholder="Email" type="email" onChange={handleChange} />
        <input style={styles.input} name="password" placeholder="Password" type="password" onChange={handleChange} />

        <button style={styles.button} onClick={isLogin ? handleLogin : handleRegister} disabled={loading}>
          {loading ? 'Please wait...' : isLogin ? 'LOGIN' : 'CREATE ACCOUNT'}
        </button>

        <p style={styles.toggle}>
          {isLogin ? "New manager? " : 'Already registered? '}
          <span style={styles.link} onClick={() => { setIsLogin(!isLogin); setError(null) }}>
            {isLogin ? 'Register here' : 'Login'}
          </span>
        </p>
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
    filter: 'blur(6px) brightness(0.6)',
    transform: 'scale(1.05)',
    zIndex: 0
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(10,30,10,0.75))',
    zIndex: 1
  },
  card: {
    position: 'relative',
    zIndex: 2,
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '2.5rem 2rem',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    margin: '1rem'
  },
  badge: {
    background: '#16a34a',
    color: '#fff',
    fontWeight: '900',
    fontSize: '0.8rem',
    padding: '0.3rem 0.8rem',
    borderRadius: '999px',
    alignSelf: 'center',
    letterSpacing: '2px'
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '900',
    textAlign: 'center',
    color: '#ffffff',
    lineHeight: 1.1,
    letterSpacing: '2px',
    textTransform: 'uppercase'
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.85rem',
    marginBottom: '0.5rem'
  },
  input: {
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: '#ffffff',
    fontSize: '0.95rem',
    outline: 'none'
  },
  button: {
    padding: '0.9rem',
    borderRadius: '10px',
    background: '#16a34a',
    color: '#ffffff',
    fontWeight: '900',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '2px',
    marginTop: '0.5rem'
  },
  error: {
    color: '#f87171',
    fontSize: '0.85rem',
    textAlign: 'center',
    background: 'rgba(239,68,68,0.1)',
    padding: '0.5rem',
    borderRadius: '8px'
  },
  toggle: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.85rem'
  },
  link: {
    color: '#4ade80',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
}
