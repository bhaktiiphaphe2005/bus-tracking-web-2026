export default function RoleCard({ title, subtitle, icon, onLogin, onSignup }) {
  return (
    <div className="role-card">
      <div className="role-top">
        <div className="role-icon">{icon}</div>
        <div>
          <div className="role-title">{title}</div>
          <div className="role-subtitle">{subtitle}</div>
        </div>
      </div>

      <div className="role-actions">
        <button className="role-btn secondary-btn" onClick={onSignup}>
          Signup
        </button>
        <button className="role-btn primary-btn" onClick={onLogin}>
          Login
        </button>
      </div>
    </div>
  )
}