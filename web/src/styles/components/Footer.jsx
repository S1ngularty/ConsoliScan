import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer-container" aria-label="Site Footer">
      <div className="footer-content">
        {/* Brand Column */}
        <div className="footer-brand">
          <div className="brand__name">
            Consoliscan
            <span className="brand__dotset" aria-hidden="true">
              <span className="dot dot--1"></span>
              <span className="dot dot--2"></span>
              <span className="dot dot--3"></span>
            </span>
          </div>
          <p className="footer-tagline">
            Smart Solutions for Sustainable Living
          </p>
          <div className="social-icons">
            <a href="https://www.facebook.com/schzpncn/" aria-label="Facebook">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="#" aria-label="Twitter">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
          </div>
        </div>

        {/* Links Column 1 */}
        <div className="footer-links">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Our Team</a></li>
            
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="footer-links">
          <h4>Resources</h4>
          <ul>
            <li><a href="#">Shopping Guide</a></li>
            <li><a href="#">Community Forum</a></li>
            <li><a href="#">Help Center</a></li>
          </ul>
        </div>

        {/* Links Column 3 */}
        <div className="footer-links">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Cookie Policy</a></li>
            <li><a href="#">Accessibility</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ConsoliScan. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Sitemap</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
