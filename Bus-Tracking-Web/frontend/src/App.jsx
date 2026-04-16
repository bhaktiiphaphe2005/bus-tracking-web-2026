import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import StudentMap from "./components/StudentMap";
import DriverMap from "./components/DriverMap";

function AppContent() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={() => navigate("/dashboard")} />} />
      
      {/* Student View */}
      <Route path="/dashboard" element={<StudentMap />} />

      {/* Driver View */}
      <Route 
        path="/driver" 
        element={
          <DriverMap 
            driver={user} 
            routeId={user?.assignedRouteId || "R-01"} 
            routeName={user?.assignedRouteName || "Campus Express"}
            onLogout={() => {
              localStorage.clear();
              navigate("/login");
            }}
          />
        } 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}