import React from "react";
import axios from "axios";
import "../styles/LoginStyle.css";
import { googleSignIn, autoLogin } from "../services/loginService.js";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [credentials, setCredentials] = React.useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  React.useEffect(() => {
    autoLogin(navigate);
    return;
  }, []);
  const submitCredentials = async () => {};

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

          <h2>Welcome back</h2>
          <p className="subtitle">Please enter your details.</p>

          <button className="google-btn" onClick={() => googleSignIn(navigate)}>
            <img
              width="50"
              height="50"
              src="https://img.icons8.com/fluency/50/google-logo.png"
              alt="google-logo"
            />{" "}
            Log in with Google
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              onChange={(e) =>
                setCredentials((p) => ({ ...p, email: e.target.value }))
              }
              value={credentials.email}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              onChange={(e) =>
                setCredentials((p) => ({ ...p, password: e.target.value }))
              }
              value={credentials.password}
            />
          </div>

          <button className="login-button" onClick={submitCredentials}>
            Sign In
          </button>

          <p className="footer-text">
            Don't have an account? <span className="link">Sign up</span>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Branding (2/3 width) */}
      <div className="hero-section">
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
            <span className="hero-text">ConsoliScan</span>
          </div>
          <p className="sub-header">
            The future of smart shopping consolidation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
