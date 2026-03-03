import React from "react";
import heroImage from "../../styles/assets/image 1.jpg";

const Hero = () => {
  return (
    <section className="hero" role="region" aria-label="Homepage hero">
      <div className="hero__card">
        <div className="hero__content">
          <h1 className="hero__title">
            <span className="title__line">Smart Solutions for</span>
            <span className="title__line">Sustainable</span>
            <span className="title__line title__accent">Grocery Experience</span>
          </h1>

          <p className="hero__subtitle">
            Smart grocery shopping, powered by intelligence, 
            built for a sustainable future.
          </p>

          <button className="btn btn--primary" type="button">
            Learn More
          </button>
        </div>

        <div className="hero__image" aria-label="Image placeholder">
          <img 
            src={heroImage} 
            alt="Smart Solutions" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
