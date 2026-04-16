import { useState } from "react";
import { studentSignup } from "../services/api"; // Import the API function

export default function SignupPage({ onGoLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // Renamed from gmail to match backend
  const [usn, setUsn] = useState("");     // Added USN
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    
    try {
      // Calling the backend via the service we created earlier
      await studentSignup({ name, email, usn, password });
      alert("Registration Successful!");
      onGoLogin(); // Redirect to login page
    } catch (err) {
      setError(err); // This will show "Email already exists" or "USN already exists"
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-phone">
        <div className="auth-glow"></div>
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1 className="auth-brand">Create Account</h1>
          
          {error && <p style={{ color: "red", fontSize: "12px", textAlign: "center" }}>{error}</p>}

          {/* NAME FIELD */}
          <div className="auth-field-group">
            <label className="auth-label">NAME</label>
            <input type="text" className="auth-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* EMAIL FIELD */}
          <div className="auth-field-group">
            <label className="auth-label">EMAIL</label>
            <input type="email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {/* USN FIELD (Required by your Backend) */}
          <div className="auth-field-group">
            <label className="auth-label">USN</label>
            <input type="text" className="auth-input" placeholder="Enter USN" value={usn} onChange={(e) => setUsn(e.target.value)} required />
          </div>

          {/* PASSWORD FIELD */}
          <div className="auth-field-group">
            <label className="auth-label">PASSWORD</label>
            <input type="password" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="auth-submit-btn">Sign Up <span>→</span></button>

          <p className="auth-footer">
            Already have an account? <button type="button" className="auth-link-btn" onClick={onGoLogin}>Login</button>
          </p>
        </form>
      </div>
    </div>
  );
}