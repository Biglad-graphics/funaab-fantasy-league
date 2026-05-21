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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚽ Funaab Fantasy League</h1>
        <p style={styles.subtitle}>{isLogin ? 'Welcome back!' : 'Create your account'}</p>

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
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        </button>

        <p style={styles.toggle}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span style={styles.link} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0f1e'
  },
  card: {
    background: '#111827',
    padding: '2rem',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  title: {
    fontSize: '1.5rem',
    textAlign: 'center',
    color: '#ffffff'
  },
  subtitle: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '0.9rem'
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #374151',
    background: '#1f2937',
    color: '#ffffff',
    fontSize: '0.95rem',
    outline: 'none'
  },
  button: {
    padding: '0.75rem',
    borderRadius: '8px',
    background: '#16a34a',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer'
  },
  error: {
    color: '#f87171',
    fontSize: '0.85rem',
    textAlign: 'center'
  },
  toggle: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '0.85rem'
  },
  link: {
    color: '#16a34a',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
    }
