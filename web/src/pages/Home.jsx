import React from "react";
import "../styles/css/global.css";
import "../styles/css/navbar.css";
import "../styles/css/hero.css";
import "../styles/css/carousel.css";
import "../styles/css/appDownloadBanner.css";
import "../styles/css/footer.css";

import Navbar from "../styles/components/Navbar";
import Hero from "../styles/components/Hero";
import Carousel from "../styles/components/Carousel";
import AppDownloadBanner from "../styles/components/AppDownloadBanner";
import Footer from "../styles/components/Footer";

const Home = () => {
  return (
    <div className="home">
      <Navbar />
      <Hero />
      <Carousel />
      <AppDownloadBanner />
      <Footer />
    </div>
  );
};

export default Home;
