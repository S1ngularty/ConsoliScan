import React from "react";
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

const Home = () => {
  return (
    <div className="home">
      <Navbar />
      <Hero />
      <Carousel />
      <AppDownloadBanner />
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Home;
