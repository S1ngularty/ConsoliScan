import React, { useEffect } from "react";
import "../styles/css/global.css";
import "../styles/css/NavBar.css";
import "../styles/css/hero.css";
import "../styles/css/carousel.css";
import "../styles/css/appDownloadBanner.css";
import "../styles/css/footer.css";

import Navbar from "../components/home components/Navbar";
import Hero from "../components/home components/Hero";
import Carousel from "../components/home components/Carousel";
import AppDownloadBanner from "../components/home components/AppDownloadBanner";
import Footer from "../components/home components/Footer";
import ChatBot from "../components/home components/ChatBot";
import TopEvents from "../components/home components/TopEvents";

const Home = () => {
  useEffect(() => {
    // Add 'active' class to Home link
    const links = document.querySelectorAll('.nav__link');
    links.forEach(link => {
      if (link.getAttribute('href') === '/') {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }, []);

  return (
    <div className="home">
      <Navbar />
      <Hero />
      <Carousel />
      <TopEvents />
      <AppDownloadBanner />
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Home;
