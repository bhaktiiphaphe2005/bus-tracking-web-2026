import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Constants ──────────────────────────────────────────────────────────────
// Matches your Spring Boot @RequestMapping("/api/bus")
const API_BASE = "http://localhost:8080/api/bus"; 
const UPDATE_INTERVAL_MS = 1000; 

// ─── Custom Leaflet Icons ────────────────────────────────────────────────────
const busIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:38px;height:38px;background:#F59E0B;border:3px solid #1C1917;
    border-radius:50% 50% 50% 4px;transform:rotate(-45deg);
    box-shadow:0 4px 12px rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;">
    <div style="transform:rotate(45deg);font-size:16px;">🚌</div>
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 34],
});

const stopIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:14px;height:14px;background:#FBBF24;border:2.5px solid #1C1917;
    border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);">
  </div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// ─── Map auto-pan component ──────────────────────────────────────────────────
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);
  return null;
}

// ─── Speed calculation helper (Haversine-based) ──────────────────────────────
function calcSpeedKmh(prev, curr) {
  if (!prev) return 0;
  const R = 6371; // Earth radius
  const dLat = ((curr.lat - prev.lat) * Math.PI) / 180;
  const dLon = ((curr.lng - prev.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((prev.lat * Math.PI) / 180) *
      Math.cos((curr.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const distKm = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
  const dtHours = (curr.ts - prev.ts) / 3600000;
  if (dtHours <= 0) return 0;
  return Math.min(distKm / dtHours, 120); 
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DriverMap({ driver, routeId, routeName, onLogout }) {
  const [tracking, setTracking] = useState(false);
  const [position, setPosition] = useState(null); 
  const [speed, setSpeed] = useState(0);
  const [routeStops, setRouteStops] = useState([]);
  const [roadPath, setRoadPath] = useState([]); // Track curved roads
  const [status, setStatus] = useState("idle"); 
  const [lastPosted, setLastPosted] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [accuracy, setAccuracy] = useState(null);
  
  // Track dynamic route info
  const [activeRouteId, setActiveRouteId] = useState(routeId || "ROUTE_A");
  const [activeRouteName, setActiveRouteName] = useState(routeName || "Route A");

  const prevPosRef = useRef(null);
  const intervalRef = useRef(null);
  const watchRef = useRef(null);

  // Fallback to BUS-101 if driver data is missing during testing
  const busId = driver?.assignedBusId || "BUS-101";

  // ── Fetch route stops and Active Bus metadata ──
  useEffect(() => {
    if (!busId) return;
    
    // Fetch stops AND exact true driving road shapes
    fetch(`${API_BASE}/${busId}/route`)
      .then((r) => r.json())
      .then(async (stops) => {
         setRouteStops(stops);
         if(stops && stops.length > 0) {
           try {
             const coords = stops.map(s => `${s.lng},${s.lat}`).join(';');
             const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
             const data = await res.json();
             const path = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
             setRoadPath(path);
           } catch(e) {
             console.error("OSRM Driver tracking fallback");
             setRoadPath(stops.map(s => [s.lat, s.lng]));
           }
         }
      })
      .catch(() => setRouteStops([]));

    // Fetch existing bus metadata to prevent accidental overwrites
    fetch(`${API_BASE}/all`)
      .then(r => r.json())
      .then(buses => {
        const myBus = buses.find(b => b.busId === busId);
        if(myBus) {
           setActiveRouteId(myBus.routeId);
           setActiveRouteName(myBus.routeName);
        }
      })
      .catch(console.error);

  }, [busId]);

  // ── Post location (Matches @PostMapping("/location")) ──
  const postLocation = useCallback(
    (lat, lng, spd) => {
      const payload = {
        busId,
        routeId: activeRouteId,
        routeName: activeRouteName,
        lat,
        lng,
        speedKmh: Math.round(spd * 10) / 10,
        timestamp: new Date().toISOString(),
      };
      
      fetch(`${API_BASE}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      .then((r) => {
        if (r.ok) {
          setLastPosted(new Date());
          setStatus("active");
          setErrorMsg("");
        } else {
          setStatus("error");
          setErrorMsg(`Server Sync Failed: ${r.status}`);
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Network Error: Backend offline");
      });
    },
    [busId, activeRouteId, activeRouteName]
  );

  // ── Tracking Logic ──
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMsg("GPS not supported");
      return;
    }

    setTracking(true);
    setStatus("active");

    watchRef.current = navigator.geolocation.watchPosition(
  (pos) => {
    const curr = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      ts: Date.now(),
    };
    setPosition({ lat: curr.lat, lng: curr.lng });
    setAccuracy(Math.round(pos.coords.accuracy));
    prevPosRef.current = curr;
  },
  (err) => setErrorMsg(`GPS Error: ${err.message}`),
  { 
    enableHighAccuracy: true, 
    maximumAge: 0, 
    timeout: 5000 
  } // Force high accuracy and no caching
);
    intervalRef.current = setInterval(() => {
      const cur = prevPosRef.current;
      if (cur) postLocation(cur.lat, cur.lng, speed);
    }, UPDATE_INTERVAL_MS);
  }, [postLocation, speed]);

  const stopTracking = useCallback(() => {
    setTracking(false);
    setStatus("idle");
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => () => stopTracking(), [stopTracking]);

  const routePolyline = routeStops.map((s) => [s.lat, s.lng]);
  const mapCenter = position ? [position.lat, position.lng] : [12.9716, 77.5946];

  return (
    <div style={styles.root}>
      {/* Header Section */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.busTag}>
            <span style={styles.busIcon}>🚌</span>
            <span style={styles.busId}>{busId}</span>
          </div>
          <div>
            <div style={styles.driverName}>{driver?.name || "Bus Driver"}</div>
            <div style={styles.routeLabel}>{routeName || "Active Route"}</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <StatusPill status={status} />
          <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {/* Map View */}
      <div style={styles.mapWrapper}>
        <MapContainer center={mapCenter} zoom={15} style={{ width: "100%", height: "100%" }}>
          <TileLayer 
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
/>
          {position && <RecenterMap position={[position.lat, position.lng]} />}
          
          {roadPath.length > 1 && (
            <Polyline positions={roadPath} pathOptions={{ color: "#F59E0B", weight: 6, opacity: 0.8 }} />
          )}

          {routeStops.map((stop, i) => (
            <Marker key={i} position={[stop.lat, stop.lng]} icon={stopIcon}>
              <Popup><strong>{stop.stopName}</strong></Popup>
            </Marker>
          ))}

          {position && (
            <Marker position={[position.lat, position.lng]} icon={busIcon}>
               <Popup>Live: {speed.toFixed(1)} km/h</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Bottom Control Panel */}
      <div style={styles.panel}>
        <div style={styles.statsRow}>
          <Stat label="SPEED" value={speed.toFixed(1)} unit="km/h" />
          <Stat label="ACCURACY" value={accuracy ? `±${accuracy}` : "—"} unit="m" />
          <Stat label="SYNC" value={lastPosted ? lastPosted.toLocaleTimeString() : "Wait"} unit="" />
        </div>

        {errorMsg && <div style={styles.errorBanner}>⚠ {errorMsg}</div>}

        <button 
          style={{ ...styles.trackBtn, ...(tracking ? styles.trackBtnStop : styles.trackBtnStart) }}
          onClick={tracking ? stopTracking : startTracking}
        >
          {tracking ? "● Stop Tracking" : "▶ Start Tracking"}
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components & Styles (Condensed) ──────────────────────────────────────
function Stat({ label, value, unit }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}<span style={styles.statUnit}> {unit}</span></div>
    </div>
  );
}

function StatusPill({ status }) {
  const colors = { idle: "#444", active: "#14532D", error: "#450A0A" };
  return (
    <div style={{ ...styles.pill, background: colors[status] || "#444" }}>
      {status.toUpperCase()}
    </div>
  );
}

const styles = {
  root: { display: "flex", flexDirection: "column", height: "100vh", background: "#000", color: "#fff", fontFamily: "monospace" },
  header: { display: "flex", justifyContent: "space-between", padding: "10px 20px", background: "#111", borderBottom: "1px solid #333" },
  headerLeft: { display: "flex", alignItems: "center", gap: "15px" },
  busTag: { background: "#F59E0B", color: "#000", padding: "5px 10px", borderRadius: "4px", fontWeight: "bold" },
  driverName: { fontSize: "16px", fontWeight: "bold" },
  routeLabel: { fontSize: "12px", color: "#888" },
  logoutBtn: { background: "none", border: "1px solid #444", color: "#aaa", cursor: "pointer", padding: "5px 10px" },
  pill: { padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  mapWrapper: { flex: 1 },
  panel: { padding: "20px", background: "#111", borderTop: "1px solid #333" },
  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "15px" },
  stat: { background: "#000", padding: "10px", borderRadius: "4px", border: "1px solid #222" },
  statLabel: { fontSize: "10px", color: "#666" },
  statValue: { fontSize: "18px", color: "#F59E0B", fontWeight: "bold" },
  statUnit: { fontSize: "12px", color: "#444" },
  trackBtn: { width: "100%", padding: "15px", borderRadius: "8px", border: "none", fontWeight: "bold", fontSize: "16px", cursor: "pointer" },
  trackBtnStart: { background: "#F59E0B", color: "#000" },
  trackBtnStop: { background: "#333", color: "#ff4444" },
  errorBanner: { background: "#450A0A", color: "#ff8888", padding: "10px", marginBottom: "10px", borderRadius: "4px", fontSize: "12px" }
};