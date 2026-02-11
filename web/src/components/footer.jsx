import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/css/footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Logo and Description */}
          <div className="footer-column footer-about">
            <Link to="/" className="footer-logo">
              <span className="logo-eco">Consoli</span>
              <span className="logo-bin">Scan</span>
            </Link>
            <p className="footer-description">
              The future of smart shopping consolidation. Smart solutions for sustainable living.
            </p>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/tips">Services</Link></li>
              <li><Link to="/history">Our Work</Link></li>
              <li><Link to="/register">Get Started</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer-column">
            <h3>Services</h3>
            <ul>
              <li><Link to="/tips">Waste Management</Link></li>
              <li><Link to="/tips">Recycling Solutions</Link></li>
              <li><Link to="/tips">AI Classification</Link></li>
              <li><Link to="/tips">Community Programs</Link></li>
              <li><Link to="/tips">Education & Tips</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-column">
            <h3>Contact Us</h3>
            <ul className="footer-contact">
              <li>
                <i className="fas fa-map-marker-alt"></i>
                <span>123 Green Street, Eco City, EC 12345</span>
              </li>
              <li>
                <i className="fas fa-phone"></i>
                <span>+1 (555) 123-4567</span>
              </li>
              <li>
                <i className="fas fa-envelope"></i>
                <span>info@ecobin.com</span>
              </li>
              <li>
                <i className="fas fa-clock"></i>
                <span>Mon - Fri: 9:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>&copy; {currentYear} WasteVision. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="separator">|</span>
            <Link to="/terms">Terms of Service</Link>
            <span className="separator">|</span>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;