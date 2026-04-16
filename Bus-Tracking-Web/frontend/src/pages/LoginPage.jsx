import { useState } from "react";
import { studentLogin, driverLogin } from "../services/api"; // Ensure these are exported in api.js

export default function LoginPage({ onLogin, onGoSignup }) {
  const [role, setRole] = useState("student"); // "student" or "driver"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let userData;
      // 1. Choose the correct API call based on role
      if (role === "student") {
        userData = await studentLogin({ username: email, password });
      } else {
        userData = await driverLogin({ username: email, password });
      }

      // 2. Pass the data back to your App.js or AuthProvider
      if (onLogin) onLogin(userData);
      
      console.log("Login successful:", userData);
    } catch (err) {
      setError(err || "Invalid credentials");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-phone">
        <div className="auth-glow"></div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-logo-wrap">
            <div className="auth-logo-box">🚌</div>
          </div>

          <h1 className="auth-brand">CampusBus</h1>
          <p className="auth-tag">Live College Transport</p>

          {error && <p style={{ color: "red", fontSize: "12px", textAlign: "center" }}>{error}</p>}

          {/* Role Selection - Important for your Backend logic */}
          <div className="auth-field-group">
            <label className="auth-label">LOGIN AS</label>
            <select 
              className="auth-input" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ backgroundColor: '#fff', color: '#000', cursor: 'pointer' }}
            >
              <option value="student">Student</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          <div className="auth-field-group">
            <label className="auth-label">
              {role === "student" ? "EMAIL" : "DRIVER USERNAME"}
            </label>
            <input
              type={role === "student" ? "email" : "text"}
              className="auth-input"
              placeholder={role === "student" ? "student@college.edu" : "e.g., driver101"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field-group">
            <label className="auth-label">PASSWORD</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn">
            Sign In <span>→</span>
          </button>

          <p className="auth-footer">
  Don't have an account?{" "}
  <button 
    type="button" 
    className="auth-link-btn" 
    onClick={onGoSignup}  // <--- Check this line carefully!
  >
    Register
  </button>
</p>
        </form>
      </div>
    </div>
  );
}