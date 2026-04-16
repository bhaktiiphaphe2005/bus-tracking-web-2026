export default function HomeHero({ onGetStarted }) {
  return (
    <div className="home-shell">
      <div className="home-navbar">
        <div className="brand-mark">
          <span className="brand-icon">🚌</span>
          <span className="brand-text">CampusBus</span>
        </div>
      </div>

      <div className="home-hero-card">
        <div className="hero-badge">Live College Bus Tracking</div>

        <h1 className="hero-title">
          You&apos;ll Never Miss
          <br />
          Your Bus Again
        </h1>

        <p className="hero-text">
          Real-time bus tracking for students, drivers, and admin with live status,
          route updates, and quick access on mobile.
        </p>

        <div className="hero-visual">
          <div className="phone-mock">
            <div className="mini-map"></div>
            <div className="mini-bus">🚌</div>
            <div className="mini-chip top-chip">Bus 4B Live</div>
            <div className="mini-chip bottom-chip">ETA 8 min</div>
          </div>
        </div>

        <button className="hero-btn" onClick={onGetStarted}>
          Get Started
        </button>
      </div>
    </div>
  )
}