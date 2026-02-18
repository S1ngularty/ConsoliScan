import React, { useState, useEffect } from "react";
import scanImage from "../../styles/assets/Scan.jpg";
import confirmImage from "../../styles/assets/Confirm.jpg";
import goImage from "../../styles/assets/Go.jpg";
import "../../styles/css/carousel.css";

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      id: 1,
      image: scanImage,
      alt: "Scan your items",
      title: "Scan Items",
      description: "Quickly scan products using your device camera for instant recognition."
    },
    {
      id: 2,
      image: confirmImage,
      alt: "Confirm your selection",
      title: "Confirm Selection",
      description: "Review and confirm your selected items before proceeding."
    },
    {
      id: 3,
      image: goImage,
      alt: "Go and checkout",
      title: "Fast Checkout",
      description: "Complete your checkout quickly and efficiently."
    }
  ];

  const nextSlide = () => {
    setCurrentIndex(prev =>
      prev === slides.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex(prev =>
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentSlide = slides[currentIndex];

  return (
    <section className="carousel-layout">

      {/* LEFT: Square Carousel */}
      <div className="carousel-container">
        <div className="carousel-wrapper">

          <div
            className="carousel-track"
            style={{
              transform: `translateY(-${currentIndex * 100}%)`
            }}
          >
            {slides.map(slide => (
              <div key={slide.id} className="carousel-slide">
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className="slide-image"
                />
              </div>
            ))}
          </div>

          <button className="carousel-btn prev-btn" onClick={prevSlide}>
            &#9650; {/* Up Arrow */}
          </button>

          <button className="carousel-btn next-btn" onClick={nextSlide}>
            &#9660; {/* Down Arrow */}
          </button>

        </div>
      </div>

      {/* RIGHT: Description placeholder */}
      <div className="carousel-description">
        <div 
          className="description-track"
          style={{
            transform: `translateY(-${currentIndex * 100}%)`
          }}
        >
          {slides.map(slide => (
            <div key={slide.id} className="description-slide">
              <h2>{slide.title}</h2>
              <p>{slide.description}</p>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};

export default Carousel;
