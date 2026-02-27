import React, { useEffect } from "react";
import Navbar from "../components/home components/Navbar";
import Footer from "../components/home components/Footer";
import ChatBot from "../components/home components/ChatBot";
import "../styles/css/global.css";
import "../styles/css/aboutUs.css";
import egoImage from "../styles/assets/Ego.png";
import sachzieImage from "../styles/assets/sachzie.jpg";
import leviImage from "../styles/assets/levi.jpg";
import developmentImage from "../styles/assets/development.jpg";
import { QrCode, ShieldCheck, BrainCircuit, Star, Tag, FileText, LayoutDashboard, History } from "lucide-react";

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

  const features = [
    { icon: <QrCode size={24} />, title: "QR-Based Checkout", desc: "Aggregated transaction encoding into single QR code for seamless payment processing" },
    { icon: <ShieldCheck size={24} />, title: "Blockchain Security", desc: "Immutable transaction logging and real-time inventory synchronization" },
    { icon: <BrainCircuit size={24} />, title: "Predictive Analytics", desc: "ML-driven insights on inventory trends and customer buying behavior" },
    { icon: <Star size={24} />, title: "Loyalty Program", desc: "Points accrual system with automated redemption and tiered rewards" },
    { icon: <Tag size={24} />, title: "BNPC Compliance", desc: "Automated 5% discount application for verified Senior and PWD customers" },
    // { icon: <FileText size={24} />, title: "Digital Receipts", desc: "Blockchain-verified transaction records with PDF export capability" },
    // { icon: <LayoutDashboard size={24} />, title: "Admin Dashboard", desc: "Real-time analytics, sales reporting, and inventory oversight" },
    { icon: <History size={24} />, title: "Order History", desc: "Comprehensive purchase tracking with receipt archival" },
  ];

  return (
    <div className="about-us-page">
      {/* Background Decorative Blobs */}
      <div className="background-container">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="about-hero">
        <h1 className="hero__title">
          <span className="title__line">About ConsoliScan</span>
        </h1>
        <p>A Smart Solution for Efficient Grocery Shopping</p>
      </section>

      {/* Team */}
      <section className="about-section">
        <div className="about-section-header center">
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
              To provide grocery shoppers with a smart and user-friendly platform that simplifies 
              purchasing decisions, helps them track spending, manage shopping lists, and make budget-conscious choices. 
              We aim to enhance convenience, reduce unnecessary purchases,
              and support more mindful consumption through accessible technology.
            </p>
          </div>
          <div className="mv-card">
            <div className="mv-icon vision">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            </div>
            <h3>Our Vision</h3>
            <p>
              We envision a future where grocery shopping is seamless, informed, and empowering. 
              By giving users meaningful insights into their buying habits and expenses, 
              we strive to promote smarter spending, reduced waste, and a more responsible approach to everyday consumption.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Container */}
      <div className="distinctive-container">
        <section className="about-section">
          <div className="about-section-header center">
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
              <img src={developmentImage} alt="ConsoliScan Development Story" />
            </div>
          </div>
        </section>
      </div>

      {/* Core Features Container */}
      <div className="distinctive-container">
        <section className="about-section">
          <div className="about-section-header center">
            <span className="section-label">Core Features</span>
            <h2>What Drives Our Project</h2>
          </div>
          <div className="values-grid">
            {features.map((feature, index) => (
              <div key={index} className="value-card">
                <div className="value-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
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
      <ChatBot />
    </div>
  );
};

export default AboutUs;
