import React from "react";
import { HeartHandshake, ScanLine, Bell, ChevronRight } from "lucide-react";
import "../../styles/css/topEvents.css";

const TopEvents = () => {
  const offers = [
    {
      id: 1,
      title: "Senior/PWD Special",
      description: "Get extra 5% off BNPC items",
      icon: <HeartHandshake size={32} color="white" />,
      color: "#00A86B", // Brand Green
      link: "/eligibility"
    },
    {
      id: 2,
      title: "Scan & Save",
      description: "Track all your grocery scans",
      icon: <ScanLine size={32} color="white" />,
      color: "#0f172a", // Dark Slate
      link: "/scan"
    },
    {
      id: 3,
      title: "Weekly Cap Alert",
      description: "Never miss your discount limit",
      icon: <Bell size={32} color="white" />,
      color: "#3b82f6", // Blue
      link: "/notifications"
    }
  ];

  return (
    <section className="exclusive-offers-section">
      <div className="section-header">
        <h2 className="section-title">Exclusive Offers</h2>
      </div>

      <div className="offers-grid-container">
        {offers.map((offer) => (
          <div 
            key={offer.id} 
            className="offer-card"
            style={{ backgroundColor: offer.color }}
            onClick={() => window.location.href = offer.link}
          >
            <div className="offer-icon-wrapper">
              {offer.icon}
            </div>
            <div className="offer-content">
              <h3 className="offer-title">{offer.title}</h3>
              <p className="offer-description">{offer.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopEvents;
