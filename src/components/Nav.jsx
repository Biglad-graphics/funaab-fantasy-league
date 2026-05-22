export default function Nav({ activePage, setActivePage, onLogout, darkMode, toggleDarkMode, isAdmin }) {
  const links = [
    { id: 'home', label: 'Home' },
    { id: 'status', label: 'My Status' },
    { id: 'pickteam', label: 'Pick Team' },
    { id: 'transfers', label: 'Transfers' },
    ...(isAdmin ? [{ id: 'admin', label: '🔐 Admin' }] : [])
  ]

  return (
    <nav className="nav">
      <img
        src="/funaab-fantasy-league/logo.png"
        alt="FFL Logo"
        style={{ width: '42px', height: '42px', objectFit: 'contain', cursor: 'pointer' }}
        onClick={() => setActivePage('home')}
      />
      <div className="nav-links">
        {links.map(l => (
          <button
            key={l.id}
            className={`nav-btn ${activePage === l.id ? 'active' : ''}`}
            onClick={() => setActivePage(l.id)}
          >
            {l.label}
          </button>
        ))}
        <button className="nav-btn" onClick={toggleDarkMode} title="Toggle theme">
          {darkMode ? '☀️' : '🌙'}
        </button>
        <button className="nav-btn nav-cta" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  )
}
