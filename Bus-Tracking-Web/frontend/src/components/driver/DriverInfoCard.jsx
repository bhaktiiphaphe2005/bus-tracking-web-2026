import Card from "../common/Card"

export default function DriverInfoCard({ driver, nextStop, students }) {
  return (
    <Card>
      <div className="info-card">
        <div className="driver-info-grid">
          <div className="driver-info-box">
            <div className="mini-label">Driver</div>
            <div className="mini-value">{driver}</div>
          </div>

          <div className="driver-info-box">
            <div className="mini-label">Next Stop</div>
            <div className="mini-value">{nextStop}</div>
          </div>

          <div className="driver-info-box full">
            <div className="mini-label">Students Waiting</div>
            <div className="mini-value">{students}</div>
          </div>
        </div>
      </div>
    </Card>
  )
}