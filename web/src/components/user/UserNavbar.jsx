import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/css/NavBar.css";

const UserNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("isLogin");
    navigate("/login");
  };

  return (
    <header className="navbar user-navbar">
      <div className="navbar__container">
        <Link to="/user/dashboard" className="navbar__brand" style={{ textDecoration: 'none' }}>
          <span className="brand__name">Consoliscan</span>
          <span className="brand__dotset" aria-hidden="true">
            <span className="dot dot--1"></span>
            <span className="dot dot--2"></span>
            <span className="dot dot--3"></span>
          </span>
        </Link>

        <nav className="navbar__links" aria-label="User Navigation">
          <Link to="/user/dashboard" className="nav__link">Dashboard</Link>
          <Link to="/user/orders" className="nav__link">Orders</Link>
          <Link to="/user/saved" className="nav__link">Saved</Link>
          <Link to="/user/loyalty" className="nav__link">Loyalty</Link>
          <Link to="/user/help" className="nav__link">Help</Link>
          <Link to="/user/profile" className="nav__link">Profile</Link>
        </nav>

        <div className="navbar__actions">
          <button 
            className="btn btn--login" 
            type="button" 
            onClick={handleLogout}
            style={{ backgroundColor: '#DC2626' }} // Red for logout
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default UserNavbar;
