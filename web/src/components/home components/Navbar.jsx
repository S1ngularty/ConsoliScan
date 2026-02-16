import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar__container">
        <div className="navbar__brand">
          <span className="brand__name">Consoliscan</span>
          <span className="brand__dotset" aria-hidden="true">
            <span className="dot dot--1"></span>
            <span className="dot dot--2"></span>
            <span className="dot dot--3"></span>
          </span>
        </div>

        <nav className="navbar__links" aria-label="Primary">
          <Link to="/" className="nav__link">Home</Link>
          <a href="#" className="nav__link">About Us</a>
          <a href="#" className="nav__link">Tips</a>
        </nav>

        <div className="navbar__actions">
          <Link to="/login">
            <button className="btn btn--login" type="button">Log In</button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
