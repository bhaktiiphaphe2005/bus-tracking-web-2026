export default function AdminDashboard({ onBackRoles }) {
  return (
    <div className="app-shell">
      <main className="mobile-page">
        <div className="section-gap">
          <div className="switch-row">
            <button className="ghost-btn" onClick={onBackRoles}>
              ← Back
            </button>
          </div>

          <div className="card">
            <div className="card-inner">
              <div className="driver-title">Admin Dashboard</div>
              <div className="driver-subtitle">
                Manage buses, routes, and trip activity
              </div>
            </div>
          </div>

          <div className="card">
            <div className="info-card">
              <div className="driver-info-grid">
                <div className="driver-info-box">
                  <div className="mini-label">Active Buses</div>
                  <div className="mini-value">4</div>
                </div>

                <div className="driver-info-box">
                  <div className="mini-label">Drivers Online</div>
                  <div className="mini-value">3</div>
                </div>

                <div className="driver-info-box full">
                  <div className="mini-label">Alert</div>
                  <div className="mini-value">Bus 2 deviated from route</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}