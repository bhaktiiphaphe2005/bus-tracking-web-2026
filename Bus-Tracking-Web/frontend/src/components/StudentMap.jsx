import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAllBuses } from "../services/api";

// --- Custom Bus Icon (Orange/Yellow like your reference images) ---
const busIcon = L.divIcon({
  className: "custom-bus-icon",
  html: `<div style="
    width:34px; height:34px; background:#F59E0B; border:3px solid #1C1917; 
    border-radius:50% 50% 50% 4px; transform:rotate(-45deg);
    display:flex; align-items:center; justify-content:center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
    <div style="transform:rotate(45deg); font-size:16px;">🚌</div>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

// Component to handle the "Follow the Bus" camera movement
function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && !isNaN(coords[0])) {
      map.setView(coords, map.getZoom(), { animate: true });
    }
  }, [coords]);
  return null;
}

export default function StudentMap() {
  const [buses, setBuses] = useState([]);
  const [routeStops, setRouteStops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial focus on GIT Belagavi (matching your DB insert)
  const defaultCenter = [15.8152, 74.4871];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const busData = await getAllBuses();
        setBuses(busData);

        // Fetch route if we have a bus but don't have the stops yet
        if (busData.length > 0 && routeStops.length === 0) {
          const bus = busData[0];
          console.log("Fetching route for ID:", bus.routeId); // Check console (F12) for this!
          
          const res = await fetch(`http://localhost:8080/api/bus/${bus.busId}/route`);
          if (res.ok) {
            const stops = await res.json();
            console.log("Stops found:", stops.length);
            setRouteStops(stops);
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
    const timer = setInterval(fetchData, 1000); 
    return () => clearInterval(timer);
  }, [routeStops.length]); // This dependency ensures it keeps trying until stops are found

  if (loading) return <div style={styles.loader}>Initializing Live Route...</div>;

  // Coordinate array for the Polyline (Green Path)
  const pathCoords = routeStops.map(s => [s.lat, s.lng]);

  return (
    <div style={{ position: "relative", width: "100%", height: "92vh" }}>
      
      {/* Route Info Overlay */}
      <div style={styles.overlay}>
        <h3 style={styles.title}>Live Transit View</h3>
        <p style={styles.routeName}>
          {buses[0]?.routeName || "Route A"}
        </p>
        <div style={styles.stats}>
          <span>● {routeStops.length} Stops</span>
          <span style={{color: '#16a34a', marginLeft: '10px'}}>● Active</span>
        </div>
      </div>

      <MapContainer center={defaultCenter} zoom={14} style={{ width: "100%", height: "100%" }}>
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors' 
        />
        
        {/* Auto-follow the bus movement */}
        {buses.length > 0 && (
          <RecenterMap key={buses[0].lat} coords={[buses[0].lat, buses[0].lng]} />
        )}

        {/* 1. THE DASHED ROUTE PATH */}
        {pathCoords.length > 1 && (
          <Polyline 
            positions={pathCoords} 
            pathOptions={{ color: "#16a34a", weight: 4, opacity: 0.6, dashArray: "10, 10" }} 
          />
        )}

        {/* 2. THE STATION STOPS (Circle Markers) */}
        {routeStops.map((stop, i) => (
          <CircleMarker 
            key={i} 
            center={[stop.lat, stop.lng]} 
            radius={7}
            pathOptions={{ color: "#16a34a", fillColor: "white", fillOpacity: 1, weight: 2 }}
          >
            <Popup>
              <strong>{stop.stopName}</strong><br/>
              Stop Order: {stop.stopOrder}
            </Popup>
          </CircleMarker>
        ))}

        {/* 3. THE LIVE BUS MARKER */}
        {buses.map((bus) => (
          <Marker key={bus.busId} position={[bus.lat, bus.lng]} icon={busIcon}>
            <Popup>
              <div style={styles.popup}>
                <strong style={{color: '#D97706'}}>{bus.busId}</strong><br />
                <span>Speed: {bus.speedKmh} km/h</span><br />
                <span>Last Updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

const styles = {
  loader: { padding: "50px", textAlign: "center", fontFamily: "monospace", fontSize: "18px" },
  overlay: {
    position: "absolute", top: "20px", left: "60px", zIndex: 1000,
    background: "rgba(255, 255, 255, 0.95)", padding: "15px", borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)", border: "1px solid #ddd", minWidth: "160px"
  },
  title: { margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold", color: "#374151" },
  routeName: { margin: 0, fontSize: "12px", color: "#16a34a", fontWeight: "bold", textTransform: "uppercase" },
  stats: { fontSize: "10px", color: "#6B7280", marginTop: "5px", fontWeight: "bold" },
  popup: { fontFamily: "sans-serif", fontSize: "12px" }
};