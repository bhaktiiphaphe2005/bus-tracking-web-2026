import Card from "../common/Card"
import StatusBadge from "../common/StatusBadge"

export default function StudentBusInfo({ busName, route, driver, nextStop, status }) {
  return (
    <Card>
      <div className="info-card">
        <div className="info-top">
          <div>
            <div className="bus-name">{busName}</div>
            <div className="bus-route">{route}</div>
          </div>

          <StatusBadge text={status} />
        </div>

        <div className="info-line">
          Driver: <strong>{driver}</strong> • Next stop: <strong>{nextStop}</strong>
        </div>

        <button className="primary-btn">✓ I&apos;m Boarding</button>
      </div>
    </Card>
  )
}