import React, { useEffect } from "react";
import Navbar from "../components/home components/Navbar";
import Footer from "../components/home components/Footer";
import "../styles/css/global.css";
import "../styles/css/aboutUs.css";
import egoImage from "../styles/assets/Ego.png";
import sachzieImage from "../styles/assets/sachzie.jpg";
import leviImage from "../styles/assets/levi.jpg";

const AboutUs = () => {
  useEffect(() => {
    // Add 'active' class to About Us link
    const links = document.querySelectorAll('.nav__link');
    links.forEach(link => {
      if (link.getAttribute('href') === '/about-us') {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }, []);

  return (
    <div className="about-us-page">
      <Navbar />

      {/* Hero Section */}
      <section className="about-hero">
        <h1>About ConsoliScan</h1>
        <p>A Smart Solution for Efficient Grocery Shopping</p>
      </section>

{/* Team */}
      <section className="about-section">
        <div className="section-header">
          <span className="section-label">Our Team</span>
          <h2>The Students Behind ConsoliScan</h2>
        </div>
        <div className="team-grid">
          {[
            { id: 1, name: "Sachzie Ilagan", role: "Developer", image: sachzieImage },
            { id: 2, name: "Levi Penaverde", role: "Developer", image: leviImage },
            { id: 3, name: "Ianzae Ego", role: "Developer", image: egoImage }
          ].map((member) => (
            <div key={member.id} className="team-card">
              <div className="member-image">
                <img src={member.image} alt={member.name} />
              </div>
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="about-section">
        <div className="mission-vision-grid">
          <div className="mv-card">
            <div className="mv-icon mission">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.4z"/></svg>
            </div>
            <h3>Our Mission</h3>
            <p>
              To provide a smart, accessible tool that simplifies the grocery shopping experience. 
              We aim to help users track their purchases, reduce food waste, and make smarter, 
              budget-friendly decisions through innovative technology.
            </p>
          </div>
          <div className="mv-card">
            <div className="mv-icon vision">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            </div>
            <h3>Our Vision</h3>
            <p>
              We envision a world where technology bridges the gap between consumption and sustainability. 
              By empowering individuals with data-driven insights, we hope to foster a community 
              conscious of their shopping habits and environmental impact.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Container */}
      <div className="distinctive-container">
        <section className="about-section">
          <div className="section-header">
            <span className="section-label">Our Story</span>
          </div>
          <div className="story-container">
            <div className="story-content">
              <h2>From Concept to Smart Assistant</h2>
              <p>
                ConsoliScan started with a simple question: "How can we make grocery shopping less chaotic and more efficient?" 
                We noticed that many people struggle with long lines, manual item scanning, and tracking products they are buying.
              </p>
              <p>
                Combining our passion for technology with everyday needs, we developed a solution that does more than just list items. 
                We built a system that scans, organizes, and analyzes your shopping habits.
              </p>
              <p>
                What began as a student project has grown into a comprehensive tool designed to save you time and money 
                while promoting sustainable living habits.
              </p>
            </div>
            <div className="story-image">
              {/* Image Placeholder */}
              <span>[Story Image Placeholder]</span>
            </div>
          </div>
        </section>
      </div>

      {/* Values Container */}
      <div className="distinctive-container">
        <section className="about-section">
          <div className="section-header">
            <span className="section-label">Our Values</span>
            <h2>What Drives Our Project</h2>
          </div>
          <div className="values-grid">
            {[
              { title: "Efficiency", text: "Streamlining your shopping process to save valuable time." },
              { title: "Sustainability", text: "Promoting eco-friendly choices and reducing food waste." },
              { title: "User-Centric", text: "Designing with the user's real-world needs in mind." },
              { title: "Innovation", text: "Leveraging technology to solve everyday problems." },
              { title: "Accessibility", text: "Making smart tools available to everyone, everywhere." },
              { title: "Transparency", text: "Providing clear insights into your shopping habits." }
            ].map((value, index) => (
              <div key={index} className="value-card">
                <div className="value-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </div>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CTA */}
      <section className="about-cta">
        <h2>Try ConsoliScan Today!</h2>
        <p>Help us improve by testing our system—your feedback matters.</p>
        <div className="cta-buttons">
          <button className="cta-btn btn-primary">Get Started</button>
          <button className="cta-btn btn-secondary">Learn More</button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
