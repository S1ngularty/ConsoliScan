import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__wrapper">

        {/* Top Section */}
        <div className="footer__top">

          {/* Brand */}
          <div className="footer__brand">
            <div className="brand__name">
              Consoliscan
              <span className="brand__dotset">
                <span className="dot dot--1"></span>
                <span className="dot dot--2"></span>
                <span className="dot dot--3"></span>
              </span>
            </div>

            <p className="footer__tagline">
              Smart Solutions for Sustainable Living.
              Helping you make shopping convenient.
            </p>

          </div>

          {/* Resources */}
          <div className="footer__links">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Shopping Guide</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>

          {/* Optional Newsletter */}
          <div className="footer__newsletter">
            <h4>Stay Updated</h4>
            <p>Get updates and sustainability tips.</p>

            <div className="newsletter__input">
              <input type="email" placeholder="Enter your email" />
              <button>Subscribe</button>
            </div>
          </div>

        </div>


        {/* Bottom */}
        <div className="footer__bottom">

          <p>
            © {new Date().getFullYear()} ConsoliScan. All rights reserved.
          </p>

          <div className="footer__legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Sitemap</a>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;
