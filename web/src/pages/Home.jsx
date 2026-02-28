import React, { useEffect } from "react";
import "../styles/css/global.css";
import "../styles/css/NavBar.css";
import "../styles/css/hero.css";
import "../styles/css/carousel.css";
import "../styles/css/appDownloadBanner.css";
import "../styles/css/footer.css";
import "../styles/css/home.css"; // Added new CSS file for home styles

import Navbar from "../components/home components/Navbar";
import Hero from "../components/home components/Hero";
import Carousel from "../components/home components/Carousel";
import AppDownloadBanner from "../components/home components/AppDownloadBanner";
import Footer from "../components/home components/Footer";
import ChatBot from "../components/common/Chatbot";
import TopEvents from "../components/home components/TopEvents";

const Home = () => {
  useEffect(() => {
    // Add 'active' class to Home link
    const links = document.querySelectorAll(".nav__link");
    links.forEach((link) => {
      if (link.getAttribute("href") === "/") {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }, []);

  return (
    <div className="home">
      {/* Background Decorative Blobs */}
      <div className="background-container">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
      </div>

      <Navbar />
      <Hero />
      <Carousel />
      {/* TopEvents removed as per user request to remove "Exclusive offers" */}

      {/* Why You’ll Love It Section & Shop With Confidence */}
      <section className="features-section">
        <div className="features-wrapper">
          {/* Left Column: Why You’ll Love It */}
          <div className="features-container">
            <div className="section-header center">
              <span className="section-label">Why You’ll Love It</span>
              <h2>The Smarter Way to Shop</h2>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>Faster Checkout</h3>
                <p>No more long waiting lines.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"></div>
                <h3>Full Price Transparency</h3>
                <p>See your total before you reach the counter.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"></div>
                <h3>Automatic Discounts</h3>
                <p>
                  Eligible discounts like Senior and PWD are applied accurately.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"></div>
                <h3>Convenient & Easy to Use</h3>
                <p>Simple interface designed for everyday shoppers.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Shop With Confidence */}
          <div className="confidence-card">
            <div className="confidence-content">
              <h2 className="confidence-title">
                <span className="title__line">Your Grocery</span>
                <span className="title__line">Experience,</span>
                <span className="title__line title__accent">Simplified.</span>
              </h2>

              <ul className="confidence-list">
                <li>
                  <span className="check-icon">✓</span>
                  Clear breakdown of prices and taxes
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  Secure checkout process
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  Accurate billing
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  No hidden charges
                </li>
              </ul>
            </div>

            <div className="budget-card-wrapper">
              <div className="budget-card">
                <div className="budget-icon"></div>
                <h3>Stay on Budget</h3>
                <p>Track your spending in real time while shopping.</p>
                <p>Avoid surprises and shop with control.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>Make your grocery trips faster and easier today.</p>
          <button className="cta-button">Start Shopping Now</button>
        </div>
      </section>

      <AppDownloadBanner />
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Home;
