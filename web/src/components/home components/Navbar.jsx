import React, { useState } from "react";
import { Link } from "react-router-dom";
import ShoppingHacks from "./ShoppingHacks";
import { Sparkles } from "lucide-react";

const Navbar = () => {
  const [showHacks, setShowHacks] = useState(false);

  return (
    <>
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
            <Link to="/about-us" className="nav__link">About Us</Link>
            <button className="nav__link special" onClick={() => setShowHacks(true)}>
              <Sparkles size={16} />
              Smart Tips
            </button>
          </nav>

          <div className="navbar__actions">
            <Link to="/login">
              <button className="btn btn--login" type="button">Log In</button>
            </Link>
          </div>
        </div>
      </header>
      <ShoppingHacks isOpen={showHacks} onClose={() => setShowHacks(false)} />
    </>
  );
};

export default Navbar;
