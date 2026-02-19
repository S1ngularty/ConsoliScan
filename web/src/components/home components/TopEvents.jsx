import React from "react";
import "../../styles/css/topEvents.css";

const TopEvents = () => {
  const events = [
    {
      id: 1,
      title: "GAIN POINTS",
      description:"",
      link: "#"
    },
    {
      id: 2,
      title: "Event Title 2",
      description: "Description for event 2. This is a placeholder description that you can edit later.",
      link: "#"
    }
  ];

  return (
    <section className="top-events-section">
      <h2 className="section-title">TOP EVENTS</h2>
      
      <div className="events-container">
        <button className="nav-btn prev" aria-label="Previous">
          &#10094;
        </button>

        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-image-placeholder">
                {/* Image Placeholder */}
              </div>
              <div className="event-details">
                <h3 className="event-title">{event.title}</h3>
                <p className="event-description">{event.description}</p>
                <a href={event.link} className="read-more">Read more →</a>
              </div>
            </div>
          ))}
        </div>

        <button className="nav-btn next" aria-label="Next">
          &#10095;
        </button>
      </div>
    </section>
  );
};

export default TopEvents;
