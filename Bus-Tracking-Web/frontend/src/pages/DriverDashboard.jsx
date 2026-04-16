import { useState } from "react";
import DriverMap from "../components/DriverMap";

export default function DriverDashboard() {
  const [tripStarted, setTripStarted] = useState(false);

  const handleStartTrip = () => {
    setTripStarted(true);
  };

  const handleEndTrip = () => {
    setTripStarted(false);
  };

  return (
    <div className="driver-screen">
      <div className="driver-map-area">
        {tripStarted ? (
          <DriverMap tripStarted={tripStarted} />
        ) : (
          <div className="blank-map">
            <p>Click Start to begin trip</p>
          </div>
        )}
      </div>

      <div className="driver-bottom-bar">
        <button className="side-btn">Run</button>

        {!tripStarted ? (
          <button className="start-btn" onClick={handleStartTrip}>
            Start
          </button>
        ) : (
          <button
            className="start-btn"
            style={{ background: "red" }}
            onClick={handleEndTrip}
          >
            End
          </button>
        )}

        <button className="side-btn">Add Route</button>
      </div>
    </div>
  );
}