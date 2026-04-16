import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import StudentMap from "./components/StudentMap";
import DriverMap from "./components/DriverMap";

// A simple authentication wrapper to guard private pages
function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");
  if (!user) {
    // Force redirect to login if no user data string exists in storage
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppContent() {
  const navigate = useNavigate();
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  return (
    <Routes>
      {/* Default Route: Redirects to Login immediately */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Login Page */}
      <Route 
        path="/login" 
        element={
          <LoginPage 
            onLogin={(userData) => {
              localStorage.setItem("user", JSON.stringify(userData));
              
              // Determine if it was a driver or student login
              if (userData && userData.assignedBusId) {
                navigate("/driver"); // Redirect Driver
              } else {
                navigate("/dashboard"); // Redirect Student
              }
            }} 
            onGoSignup={() => navigate("/signup")}
          />
        } 
      />

      {/* Registration Page */}
      <Route 
        path="/signup" 
        element={
          <SignupPage 
            onGoLogin={() => navigate("/login")} 
          />
        } 
      />
      
      {/* Student View (Secured) */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <StudentMap />
          </ProtectedRoute>
        } 
      />

      {/* Driver View (Secured) */}
      <Route 
        path="/driver" 
        element={
          <ProtectedRoute>
            <DriverMap 
              driver={user} 
              routeId={user?.assignedRouteId || "R-01"} 
              routeName={user?.assignedRouteName || "Campus Express"}
              onLogout={() => {
                localStorage.removeItem("user");
                navigate("/login");
              }}
            />
          </ProtectedRoute>
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