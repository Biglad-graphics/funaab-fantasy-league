import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Profile({ manager, onUpdate, onLogout }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    team_name: manager?.team_name || '',
    department: manager?.department || '',
    full_name: manager?.full_name || ''
  })

  const showToast = (msg, bad = false) => {
    setToast({ msg, bad })
    setTimeout(() => setToast(null), 2500)
  }

  const handleSave = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('managers')
      .update({
        team_name: form.team_name,
        department: form.department,
        full_name: form.full_name
      })
      .eq('id', manager.id)
    if (error) { showToast('❌ Failed to update', true); setLoading(false); return }
    showToast('✅ Profile updated!')
    setEditing(false)
    setLoading(false)
    onUpdate()
  }

  const handlePasswordReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(manager.email || '', {
      redirectTo: 'https://biglad-graphics.github.io/funaab-fantasy-league/'
    })
    if (error) showToast('❌ Failed to send reset email', true)
    else showToast('✅ Password reset email sent!')
  }

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#111A13', border: `1px solid ${toast.bad ? '#EF9A9A' : '#00E676'}`, color: toast.bad ? '#EF9A9A' : '#E8F5E9', padding: '.7rem 1.5rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: '700', zIndex: 9999 }}>{toast.msg}</div>}

      <div style={{ fontSize: '.7rem', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#00E676', marginBottom: '.5rem' }}>👤 Account</div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '2px', marginBottom: '1.5rem' }}>My Profile</h1>

      {/* Avatar & Name */}
      <div style={{ background: 'linear-gradient(135deg,rgba(0,230,118,.07),transparent)', border: '1px solid rgba(0,230,118,.2)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#1E2E20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#00E676', flexShrink: 0 }}>
          {(manager?.team_name || manager?.full_name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', lineHeight: 1 }}>{manager?.team_name || '—'}</div>
          <div style={{ color: '#5A7A5E', fontSize: '.85rem', marginTop: '.3rem' }}>{manager?.full_name}</div>
          <div style={{ color: '#5A7A5E', fontSize: '.8rem' }}>{manager?.department}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ fontSize: '.62rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '.2rem' }}>Status</div>
          <span style={{ fontSize: '.72rem', fontWeight: '800', letterSpacing: '1px', padding: '.3rem .8rem', borderRadius: '100px', background: 'rgba(0,230,118,.1)', color: '#00E676' }}>
            ✓ Verified
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Points', value: manager?.total_points ?? 0, color: '#00E676' },
          { label: 'Free Transfers', value: manager?.free_transfers ?? 1, color: '#64B5F6' },
          { label: 'Budget Left', value: `₦${manager?.budget ?? 100}M`, color: '#FFD700' },
          { label: 'Wildcard', value: manager?.wildcard_used ? 'Used' : 'Available', color: manager?.wildcard_used ? '#EF9A9A' : '#00E676' }
        ].map(s => (
          <div key={s.label} style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.2rem' }}>
            <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#5A7A5E', marginBottom: '.3rem' }}>{s.label}</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Edit Profile */}
      <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Profile Details</div>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{ background: 'transparent', border: '1px solid #1E2E20', color: '#5A7A5E', padding: '.4rem .9rem', borderRadius: '6px', fontSize: '.75rem', fontWeight: '700', cursor: 'pointer' }}>
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '1px', color: '#5A7A5E', marginBottom: '.3rem', textTransform: 'uppercase' }}>Team Name</div>
              <input style={styles.input} value={form.team_name} onChange={e => setForm({ ...form, team_name: e.target.value })} placeholder="Team Name" />
            </div>
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '1px', color: '#5A7A5E', marginBottom: '.3rem', textTransform: 'uppercase' }}>Full Name</div>
              <input style={styles.input} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Full Name" />
            </div>
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: '700', letterSpacing: '1px', color: '#5A7A5E', marginBottom: '.3rem', textTransform: 'uppercase' }}>Department</div>
              <input style={styles.input} value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Department" />
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button style={styles.btn} onClick={handleSave} disabled={loading}>{loading ? 'SAVING...' : 'SAVE CHANGES'}</button>
              <button style={styles.outlineBtn} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
            {[
              { label: 'Team Name', value: manager?.team_name },
              { label: 'Full Name', value: manager?.full_name },
              { label: 'Department', value: manager?.department },
              { label: 'Matric Number', value: manager?.matric_number }
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '.6rem 0', borderBottom: '1px solid #1E2E20' }}>
                <span style={{ fontSize: '.78rem', color: '#5A7A5E', fontWeight: '700' }}>{f.label}</span>
                <span style={{ fontSize: '.82rem', fontWeight: '600' }}>{f.value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Actions */}
      <div style={{ background: '#111A13', border: '1px solid #1E2E20', borderRadius: '12px', padding: '1.4rem' }}>
        <div style={{ fontWeight: '800', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>Account Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          <button style={styles.outlineBtn} onClick={handlePasswordReset}>🔑 Reset Password</button>
          <button style={{ ...styles.outlineBtn, borderColor: '#EF9A9A', color: '#EF9A9A' }} onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  input: { width: '100%', padding: '.8rem 1rem', borderRadius: '8px', border: '1px solid #1E2E20', background: '#080C0A', color: '#E8F5E9', fontSize: '.88rem', outline: 'none' },
  btn: { flex: 1, padding: '.8rem 1.5rem', borderRadius: '8px', background: '#00E676', color: '#080C0A', fontWeight: '800', fontSize: '.85rem', border: 'none', cursor: 'pointer', letterSpacing: '1px' },
  outlineBtn: { flex: 1, padding: '.8rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid #1E2E20', color: '#5A7A5E', fontWeight: '700', fontSize: '.85rem', cursor: 'pointer' }
}
