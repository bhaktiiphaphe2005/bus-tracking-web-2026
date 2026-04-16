import { useState } from "react";
import StudentMap from "../components/StudentMap";

export default function StudentDashboard() {
  const [boardingStarted, setBoardingStarted] = useState(false);

  return (
    <div className="driver-screen">
      <div className="driver-map-area">
        {boardingStarted ? (
          <StudentMap boardingStarted={boardingStarted} />
        ) : (
          <div className="blank-map">
            <p>Press "I am Boarding" to track bus distance and ETA</p>
          </div>
        )}
      </div>

      <div className="driver-bottom-bar">
        {!boardingStarted ? (
          <button
            className="start-btn"
            style={{ background: "green" }}
            onClick={() => setBoardingStarted(true)}
          >
            I am Boarding
          </button>
        ) : (
          <button
            className="start-btn"
            style={{ background: "green", opacity: 0.9 }}
          >
            Boarding Active
          </button>
        )}
      </div>
    </div>
  );
}