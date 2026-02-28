import React, { useState } from "react";
import "../../styles/css/LoginStyle.css"; // Reuse login styles
import { register, googleSignIn } from "../../services/loginService.js";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    sex: "male" // default
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submitRegistration = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.age) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: parseInt(formData.age),
        sex: formData.sex
      };

      await register(payload, navigate);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-split">
      <div className="form-section">
        <div className="form-content">
          <div className="logo-group">
            <div className="cart-icon-wrapper">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <h1 className="logo-text">
              <span className="brand-c">C</span>onsoliScan
            </h1>
          </div>

          <h2>Create Account</h2>
          <p className="subtitle">Join us for smarter shopping.</p>

          {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              onChange={handleChange}
              value={formData.name}
              className="animated-input"
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="name@company.com"
              onChange={handleChange}
              value={formData.email}
              className="animated-input"
            />
          </div>

          <div className="input-row" style={{ display: 'flex', gap: '10px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Age</label>
              <input
                type="number"
                name="age"
                placeholder="25"
                onChange={handleChange}
                value={formData.age}
                className="animated-input"
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Gender</label>
              <select
                name="sex"
                onChange={handleChange}
                value={formData.sex}
                className="animated-input"
                style={{ height: '48px', background: 'transparent' }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
              value={formData.password}
              className="animated-input"
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              onChange={handleChange}
              value={formData.confirmPassword}
              className="animated-input"
            />
          </div>

          <button className="login-button" onClick={submitRegistration} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign Up"}
          </button>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <button className="google-btn" onClick={() => googleSignIn(navigate)}>
            <img
              width="24"
              height="24"
              src="https://img.icons8.com/fluency/50/google-logo.png"
              alt="google-logo"
            />
            Google
          </button>

          <p className="footer-text">
            Already have an account? <span className="link" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Sign in</span>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Branding (2/3 width) */}
      <div className="hero-section">
        <div className="floating-icon icon-1">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        </div>
        <div className="floating-icon icon-2">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        </div>
        <div className="floating-icon icon-3">
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M2 12h20"></path></svg>
        </div>
        <div className="floating-icon icon-4">
          <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
        </div>

        <div className="hero-content">
          <div className="hero-logo-horizontal">
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span style={{ fontSize: "48px", fontWeight: "800", letterSpacing: "-1px" }}>ConsoliScan</span>
          </div>
          <p className="sub-header">
            Join the future of smart shopping consolidation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
