export default function Home() {
  return (
    <div id="page-home">
      <div className="hero">
        <div className="hero-bg" />
        <div className="pitch-lines" />
        <div className="hero-inner">
          <div className="badge">⚡ 2025/26 Season — Now Live</div>
          <h1>
            FANTASY
            <span className="l2">FUNAAB</span>
            <span className="l3">Football League</span>
          </h1>
          <p>Pick your squad from real FUNAAB League players. Earn points. Climb the ranks. Claim the prize.</p>
          <div className="hero-actions">
            <button className="btn-primary">Join Now — Free</button>
            <button className="btn-outline">How It Works</button>
          </div>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-item"><span className="stat-num">312</span><span className="stat-label">Managers</span></div>
        <div className="stat-item"><span className="stat-num">₦500</span><span className="stat-label">Entry Fee</span></div>
        <div className="stat-item"><span className="stat-num">₦156,000</span><span className="stat-label">Prize Pool</span></div>
        <div className="stat-item"><span className="stat-num">15</span><span className="stat-label">Gameweeks</span></div>
        <div className="stat-item"><span className="stat-num">GW3</span><span className="stat-label">Current</span></div>
      </div>

      <div className="section-wrap">
        <div className="section-tag">⚡ Points System</div>
        <h2 className="section-title">Every Action.<br />Every Point.</h2>
        <p className="section-sub">Points calculated after every FUNAAB match. Captain scores double. Your bench covers injuries.</p>

        <div className="points-grid">
          <div className="points-card">
            <div className="pc-hd"><div className="pb pb-fwd">FWD</div>Forwards</div>
            <div className="pr"><span className="ac">Goal scored</span><span className="pv ppos">+6</span></div>
            <div className="pr"><span className="ac">Assist</span><span className="pv ppos">+3</span></div>
            <div className="pr"><span className="ac">Played 90 mins</span><span className="pv ppos">+2</span></div>
            <div className="pr"><span className="ac">Started match</span><span className="pv ppos">+1</span></div>
            <div className="pr"><span className="ac">Yellow card</span><span className="pv pneg">-1</span></div>
            <div className="pr"><span className="ac">Red card</span><span className="pv pneg">-3</span></div>
            <div className="pr"><span className="ac">Own goal</span><span className="pv pneg">-3</span></div>
            <div className="pr"><span className="ac">Penalty miss</span><span className="pv pneg">-2</span></div>
          </div>
          <div className="points-card">
            <div className="pc-hd"><div className="pb pb-mid">MID</div>Midfielders</div>
            <div className="pr"><span className="ac">Goal scored</span><span className="pv ppos">+5</span></div>
            <div className="pr"><span className="ac">Assist</span><span className="pv ppos">+3</span></div>
            <div className="pr"><span className="ac">Played 90 mins</span><span className="pv ppos">+2</span></div>
            <div className="pr"><span className="ac">Started match</span><span className="pv ppos">+1</span></div>
            <div className="pr"><span className="ac">Yellow card</span><span className="pv pneg">-1</span></div>
            <div className="pr"><span className="ac">Red card</span><span className="pv pneg">-3</span></div>
            <div className="pr"><span className="ac">Own goal</span><span className="pv pneg">-3</span></div>
          </div>
          <div className="points-card">
            <div className="pc-hd"><div className="pb pb-def">DEF</div><span style={{marginRight:'.4rem'}}>Defenders</span><div className="pb pb-gk">GK</div>Goalkeeper</div>
            <div className="pr"><span className="ac">Goal scored</span><span className="pv ppos">+4</span></div>
            <div className="pr"><span className="ac">Clean sheet</span><span className="pv ppos">+4</span></div>
            <div className="pr"><span className="ac">Assist</span><span className="pv ppos">+3</span></div>
            <div className="pr"><span className="ac">Played 90 mins</span><span className="pv ppos">+2</span></div>
            <div className="pr"><span className="ac">Started match</span><span className="pv ppos">+1</span></div>
            <div className="pr"><span className="ac">Yellow card</span><span className="pv pneg">-1</span></div>
            <div className="pr"><span className="ac">Red card</span><span className="pv pneg">-3</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
