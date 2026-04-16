import RoleCard from "../components/home/RoleCard"

export default function RoleSelectionPage({
  onBack,
  onStudentLogin,
  onDriverLogin,
  onAdminLogin,
}) {
  return (
    <div className="app-shell">
      <main className="mobile-page">
        <div className="section-gap">
          <div className="switch-row">
            <button className="ghost-btn" onClick={onBack}>
              ← Back
            </button>
          </div>

          <div className="roles-header card">
            <div className="card-inner">
              <div className="roles-title">Choose Your Role</div>
              <div className="roles-text">
                Continue as Student, Driver, or Admin
              </div>
            </div>
          </div>

          <RoleCard
            title="Student"
            subtitle="Track bus, see ETA, get alerts"
            icon="🎓"
            onSignup={() => alert("Student Signup")}
            onLogin={onStudentLogin}
          />

          <RoleCard
            title="Driver"
            subtitle="Start trip, share live location"
            icon="🚌"
            onSignup={() => alert("Driver Signup")}
            onLogin={onDriverLogin}
          />

          <RoleCard
            title="Admin"
            subtitle="Manage routes, buses, and alerts"
            icon="👨‍💼"
            onSignup={() => alert("Admin Signup")}
            onLogin={onAdminLogin}
          />
        </div>
      </main>
    </div>
  )
}