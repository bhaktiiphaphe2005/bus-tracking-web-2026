export default function DriverHeader({ busName, route }) {
  return (
    <div className="card">
      <div className="card-inner">
        <div className="driver-topline">
          <span className="bus-emoji">🚌</span>
          <div>
            <div className="driver-title">{busName}</div>
            <div className="driver-subtitle">{route}</div>
          </div>
        </div>
      </div>
    </div>
  )
}