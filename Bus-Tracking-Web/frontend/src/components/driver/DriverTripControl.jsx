import Card from "../common/Card"

export default function DriverTripControl({ tripStarted, onToggleTrip }) {
  return (
    <Card>
      <div className="trip-card">
        <div className="trip-status-row">
          <span className={tripStarted ? "live-dot active-live" : "live-dot"}></span>
          <span className="trip-status-text">
            {tripStarted ? "Broadcasting live location" : "Trip is currently offline"}
          </span>
        </div>

        <button
          className={tripStarted ? "danger-btn" : "primary-btn"}
          onClick={onToggleTrip}
        >
          {tripStarted ? "End Trip" : "Start Trip"}
        </button>
      </div>
    </Card>
  )
}