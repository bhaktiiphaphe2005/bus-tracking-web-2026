import Card from "../common/Card"

export default function StudentMapCard({ eta }) {
  return (
    <Card>
      <div className="map-card">
        <div className="step-dots">
          <span className="active"></span>
          <span className="active"></span>
          <span></span>
        </div>

        <div className="eta-chip">{eta}</div>
        <div className="route-line"></div>
        <div className="bus-marker">🚌</div>
      </div>
    </Card>
  )
}