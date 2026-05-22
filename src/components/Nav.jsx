export default function Nav({ activePage, setActivePage, onLogout }) {
  const links = [
    { id: 'home', label: 'Home' },
    { id: 'status', label: 'My Status' },
    { id: 'pickteam', label: 'Pick Team' },
    { id: 'transfers', label: 'Transfers' },
  ]

  return (
    <nav className="nav">
      <div className="logo" onClick={() => setActivePage('home')}>
        FFL<span className="logo-span">.</span>
      </div>
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
        <button className="nav-btn nav-cta" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  )
}
