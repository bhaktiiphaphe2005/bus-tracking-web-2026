export default function StudentHeader({ busName, status }) {
  return (
    <div className="card">
      <div className="card-inner">
        <div className="student-topline">
          <span className="bus-emoji">🚌</span>
          <span>{busName}</span>
          <span className="header-divider">•</span>
          <span>{status}</span>
        </div>
      </div>
    </div>
  )
}