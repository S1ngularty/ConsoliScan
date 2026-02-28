import React, { useState, useEffect } from "react";
import "../../styles/css/AuthStyle.css"; // We'll create this next
import {
  register,
  googleSignIn,
  signIn,
  autoLogin,
} from "../../services/loginService.js";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const AuthPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Auto-login on mount if user has valid session
  useEffect(() => {
    autoLogin(navigate);
  }, [navigate]);

  // Login State
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register State
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    sex: "male",
  });

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      setError("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await signIn(loginData.email, loginData.password, navigate);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (
      !registerData.name ||
      !registerData.email ||
      !registerData.password ||
      !registerData.age
    ) {
      setError("Please fill in all required fields");
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const payload = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        age: parseInt(registerData.age),
        sex: registerData.sex,
      };
      await register(payload, navigate);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${isRegistering ? "sign-up-mode" : ""}`}>
      <div className="forms-container">
        <div className="signin-signup">
          {/* LOGIN FORM */}
          <form className="sign-in-form" onSubmit={handleLoginSubmit}>
            <h2 className="title">Sign in</h2>
            {error && !isRegistering && (
              <div className="error-message">{error}</div>
            )}

            <div className="input-field">
              <i className="fas fa-user"></i>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={loginData.email}
                onChange={handleLoginChange}
              />
            </div>
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={loginData.password}
                onChange={handleLoginChange}
              />
            </div>
            <div className="auth-options">
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <span className="forgot-password">Forgot password?</span>
            </div>
            <button type="submit" className="btn solid" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Login"
              )}
            </button>
            <p className="social-text">Or Sign in with social platforms</p>
            <div className="social-media">
              <button
                type="button"
                className="social-icon"
                onClick={() => googleSignIn(navigate)}
              >
                <img
                  src="https://img.icons8.com/fluency/48/google-logo.png"
                  alt="Google"
                  width="24"
                />
              </button>
            </div>
          </form>

          {/* REGISTER FORM */}
          <form className="sign-up-form" onSubmit={handleRegisterSubmit}>
            <h2 className="title">Sign up</h2>
            {error && isRegistering && (
              <div className="error-message">{error}</div>
            )}

            <div className="input-field">
              <i className="fas fa-user"></i>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={registerData.name}
                onChange={handleRegisterChange}
              />
            </div>
            <div className="input-field">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={registerData.email}
                onChange={handleRegisterChange}
              />
            </div>
            <div className="input-row">
              <div className="input-field half">
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  value={registerData.age}
                  onChange={handleRegisterChange}
                />
              </div>
              <div className="input-field half">
                <select
                  name="sex"
                  value={registerData.sex}
                  onChange={handleRegisterChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={registerData.password}
                onChange={handleRegisterChange}
              />
            </div>
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
              />
            </div>
            <button type="submit" className="btn solid" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Sign Up"
              )}
            </button>
            <p className="social-text">Or Sign up with social platforms</p>
            <div className="social-media">
              <button
                type="button"
                className="social-icon"
                onClick={() => googleSignIn(navigate)}
              >
                <img
                  src="https://img.icons8.com/fluency/48/google-logo.png"
                  alt="Google"
                  width="24"
                />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="panels-container">
        <div className="panel left-panel">
          <div className="content">
            <h3>New here?</h3>
            <p>
              Join ConsoliScan today and experience the future of smart shopping
              consolidation.
            </p>
            <button
              className="btn transparent"
              onClick={() => {
                setIsRegistering(true);
                setError("");
              }}
            >
              Sign up
            </button>
          </div>
          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/online-registration-4489363-3723270.png"
            className="image"
            alt=""
          />
        </div>
        <div className="panel right-panel">
          <div className="content">
            <h3>One of us?</h3>
            <p>
              Welcome back. Sign in to access your dashboard and manage your
              shopping.
            </p>
            <button
              className="btn transparent"
              onClick={() => {
                setIsRegistering(false);
                setError("");
              }}
            >
              Sign in
            </button>
          </div>
          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/login-3305943-2757111.png"
            className="image"
            alt=""
          />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
