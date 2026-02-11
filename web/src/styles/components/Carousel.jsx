import React, { useState, useEffect } from "react";
import scanImage from "../assets/Scan.jpg";
import confirmImage from "../assets/Confirm.jpg";
import goImage from "../assets/Go.jpg";

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Actual images for the carousel
  const slides = [
    { id: 1, image: scanImage, alt: "Scan your items" },
    { id: 2, image: confirmImage, alt: "Confirm your selection" },
    { id: 3, image: goImage, alt: "Go and checkout" }
  ];

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === slides.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  // Optional: Auto-play functionality
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="carousel-container" aria-label="Image Carousel">
      <div className="carousel-wrapper">
        <div 
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={slide.id} className="carousel-slide">
              <img 
                src={slide.image} 
                alt={slide.alt} 
                className="slide-image"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
              />
            </div>
          ))}
        </div>

        <button 
          className="carousel-btn prev-btn" 
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          &#10094;
        </button>
        
        <button 
          className="carousel-btn next-btn" 
          onClick={nextSlide}
          aria-label="Next slide"
        >
          &#10095;
        </button>

        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`indicator-dot ${index === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Carousel;
