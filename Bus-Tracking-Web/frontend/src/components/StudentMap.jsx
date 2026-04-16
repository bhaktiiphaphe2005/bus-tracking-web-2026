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

// Component to handle the "Follow the Bus" camera movement without breaking zoom
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && !isNaN(lat)) {
      map.panTo([lat, lng], { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

// Function to fetch actual road snapped geometry using OSRM public API
const getRoadSnap = async (stops) => {
  if (!stops || stops.length < 2) return stops.map(s => [s.lat, s.lng]);
  try {
    const coords = stops.map(s => `${s.lng},${s.lat}`).join(';');
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
    if (!res.ok) throw new Error("OSRM err");
    const data = await res.json();
    return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]); // Swap back to [lat, lng] for Leaflet
  } catch(e) {
    console.error("OSRM failed, falling back to straight lines", e);
    return stops.map(s => [s.lat, s.lng]);
  }
};

export default function StudentMap() {
  const [buses, setBuses] = useState([]);
  const [routeStopsMap, setRouteStopsMap] = useState({});
  const [etaData, setEtaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSidebarBus, setActiveSidebarBus] = useState(null);

  // Initial focus on GIT Belagavi
  const defaultCenter = [15.8152, 74.4871];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const busData = await getAllBuses();
        setBuses(busData);

        const newStopsMap = { ...routeStopsMap };

        // Fetch routes AND their snapped mapping lines for all active buses
        for (const bus of busData) {
          if (!newStopsMap[bus.busId]) {
            const res = await fetch(`http://localhost:8080/api/bus/${bus.busId}/route`);
            if (res.ok) {
              const stops = await res.json();
              if (stops && stops.length > 0) {
                 const roadPath = await getRoadSnap(stops);
                 newStopsMap[bus.busId] = { stops, roadPath };
              }
            }
          }
        }
        
        // Update map state if anything changed
        if (Object.keys(newStopsMap).length > Object.keys(routeStopsMap).length) {
          setRouteStopsMap(newStopsMap);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        if(loading) setLoading(false);
      }
    };

    fetchData();
    const timer = setInterval(fetchData, 3000); 
    return () => clearInterval(timer);
    // Note: Omit routeStopsMap from deps so we don't clear timers rapidly
  }, [loading, routeStopsMap]);

  // Use OSRM true-driving ETAs to calculate exact duration & road distance!
  const fetchLiveETAs = async (bus) => {
    if (!bus) return;
    const routeObj = routeStopsMap[bus.busId];
    if (!routeObj || !routeObj.stops) return;

    try {
      const promises = routeObj.stops.map(async (stop) => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${bus.lng},${bus.lat};${stop.lng},${stop.lat}?overview=false`);
          const data = await res.json();
          if (data.code !== 'Ok') throw new Error("OSRM routing failed");
          const routeRes = data.routes[0];
          
          const km = (routeRes.distance / 1000).toFixed(1);
          const etaMin = Math.round(routeRes.duration / 60);
          const arrivalTime = new Date(Date.now() + etaMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return { stop: stop.stopName, km, etaMin, arrivalTime };
        } catch(e) {
           return { stop: stop.stopName, km: "--", etaMin: "--", arrivalTime: "Unknown" };
        }
      });
      
      const newEtaData = await Promise.all(promises);
      setEtaData(newEtaData);
      setActiveSidebarBus(bus);
      setSidebarOpen(true);
    } catch (err) {
      console.error("Failed to fetch ETAs:", err);
    }
  };

  if (loading) return <div style={styles.loader}>Initializing Multi-Bus Maps...</div>;

  return (
    <div style={{ position: "relative", width: "100%", height: "92vh", overflow: "hidden", display: "flex" }}>
      
      {/* Route Info Overlay (Left) */}
      <div style={styles.overlay}>
        <h3 style={styles.title}>Live Transit View</h3>
        <p style={{fontSize: "11px", color: "#666", marginBottom: "5px"}}>Active Buses Tracking: {buses.length}</p>
        
        {buses.map((b, i) => (
          <div key={b.busId} style={{ marginTop: "8px", borderLeft: `3px solid ${i % 2 === 0 ? "#16a34a" : "#8b5cf6"}`, paddingLeft: "5px" }}>
            <p style={{...styles.routeName, color: i % 2 === 0 ? "#16a34a" : "#8b5cf6"}}>{b.routeName || b.busId}</p>
            <div style={styles.stats}>
              <span>● {routeStopsMap[b.busId]?.stops?.length || 0} Stops</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer center={defaultCenter} zoom={14} style={{ width: "100%", height: "100%" }}>
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap contributors' 
          />
          
          {/* Mapping individual realistic driving lines */}
          {buses.map((bus, i) => {
            const routeObj = routeStopsMap[bus.busId] || { stops: [], roadPath: [] };
            const { stops: routeStops, roadPath: pathCoords } = routeObj;
            const color = i % 2 === 0 ? "#16a34a" : "#8b5cf6"; 

            return (
              <React.Fragment key={bus.busId}>
                {pathCoords.length > 1 && (
                  <Polyline 
                    positions={pathCoords} 
                    pathOptions={{ color: color, weight: 6, opacity: 0.8 }} 
                  />
                )}

                {routeStops.map((stop, j) => (
                  <CircleMarker 
                    key={`stop-${bus.busId}-${j}`} 
                    center={[stop.lat, stop.lng]} 
                    radius={8}
                    eventHandlers={{ click: () => fetchLiveETAs(bus) }}
                    pathOptions={{ color: color, fillColor: color, fillOpacity: 1, weight: 3 }}
                  >
                    <Popup>
                      <strong>{stop.stopName}</strong><br/>
                      <small>Route: {bus.routeName}</small><br/>
                      <button onClick={() => fetchLiveETAs(bus)} style={{...styles.etaBtn, background: color}}>View Live ETAs</button>
                    </Popup>
                  </CircleMarker>
                ))}

                <Marker position={[bus.lat, bus.lng]} icon={busIcon} eventHandlers={{ click: () => fetchLiveETAs(bus) }}>
                  <Popup>
                    <div style={styles.popup}>
                      <strong style={{color: '#D97706'}}>{bus.busId} ({bus.routeName})</strong><br />
                      <span>Speed: {bus.speedKmh} km/h</span><br />
                      <button onClick={() => fetchLiveETAs(bus)} style={{...styles.etaBtn, background: color}}>View Route ETAs</button>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* Right Sidebar for ETA */}
      {sidebarOpen && activeSidebarBus && (
        <div style={styles.sidebar}>
          <button style={styles.closeBtn} onClick={() => setSidebarOpen(false)}>×</button>
          
          <div style={styles.sidebarHeader}>
            <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>{activeSidebarBus.busId || "BUS-XXX"}</p>
            <h2 style={{ color: "white", fontSize: "18px", margin: "4px 0 12px 0" }}>{activeSidebarBus.routeName || "Current Route"}</h2>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={styles.badge}>{activeSidebarBus.speedKmh ? activeSidebarBus.speedKmh + ' km/h' : '-- km/h'}</span>
              <span style={{...styles.badge, color: "#a78bfa", borderColor: "#6d28d9", background: "rgba(109, 40, 217, 0.2)"}}>LIVE ETA</span>
            </div>
          </div>

          <div style={styles.sidebarBody}>
            <p style={{ color: "#9ca3af", fontSize: "11px", fontWeight: "bold", letterSpacing: "1px", marginBottom: "20px" }}>
              ROUTE STOPS (ESTIMATED)
            </p>

            <div style={styles.timeline}>
              <div style={styles.timelineItem}>
                <div style={{...styles.timelineDot, background: "#10b981", borderColor: "#10b981"}}></div>
                <div style={styles.timelineLine}></div>
                <div style={styles.timelineContent}>
                  <strong style={{ color: "#10b981" }}>Current position</strong>
                  <div style={{ marginTop: "4px" }}><span style={{...styles.badge, borderColor: "#10b981", color: "#10b981", background: "transparent"}}>En route</span></div>
                </div>
              </div>

              {etaData.map((eta, i) => (
                <div style={styles.timelineItem} key={i}>
                  <div style={styles.timelineDot}></div>
                  {i !== etaData.length - 1 && <div style={styles.timelineLine}></div>}
                  <div style={styles.timelineContent}>
                    <strong style={{ color: "white", letterSpacing: "0.5px" }}>{eta.stop}</strong>
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{...styles.badge, borderColor: "#3b82f6", color: "#60a5fa", background: "rgba(59, 130, 246, 0.1)"}}>~{eta.etaMin} min</span>
                      <span style={styles.statBox}>{eta.arrivalTime}</span>
                      <span style={styles.statBox}>{eta.km} km</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

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
  popup: { fontFamily: "sans-serif", fontSize: "12px" },
  etaBtn: { background: "#16a34a", color: "white", border: "none", padding: "6px 10px", borderRadius: "4px", cursor: "pointer", marginTop: "5px", fontSize: "12px" },
  sidebar: {
    width: "350px", height: "100%", background: "#1f2937", borderLeft: "1px solid #374151",
    boxShadow: "-4px 0 15px rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", flexDirection: "column",
    transition: "transform 0.3s ease-in-out", fontFamily: "sans-serif"
  },
  closeBtn: {
    position: "absolute", right: "15px", top: "15px", background: "transparent", border: "1px solid #4b5563",
    color: "white", borderRadius: "4px", width: "30px", height: "30px", cursor: "pointer", fontSize: "18px",
    display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s"
  },
  sidebarHeader: {
    padding: "20px", borderBottom: "1px solid #374151", position: "relative"
  },
  badge: {
    border: "1px solid #4b5563", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", color: "#d1d5db"
  },
  sidebarBody: {
    flex: 1, padding: "20px", overflowY: "auto"
  },
  timeline: {
    position: "relative",
  },
  timelineItem: {
    position: "relative", paddingLeft: "30px", paddingBottom: "30px"
  },
  timelineDot: {
    position: "absolute", left: "0", top: "4px", width: "12px", height: "12px",
    borderRadius: "50%", border: "2px solid #3b82f6", background: "#1f2937", zIndex: 2
  },
  timelineLine: {
    position: "absolute", left: "5px", top: "16px", bottom: "-4px", width: "2px",
    background: "#374151", zIndex: 1
  },
  timelineContent: {
    position: "relative", top: "-2px"
  },
  statBox: {
    border: "1px solid #374151", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", color: "#9ca3af"
  }
};