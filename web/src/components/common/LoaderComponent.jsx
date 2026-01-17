import React from "react";
import "../../styles/common/LoaderComponentStyle.css";

/**
 * @param {string} variant - "page" (full screen), "section" (container fill), or "button" (inline)
 * @param {string} color - "white" or "green" (defaults to green)
 * @param {string} size - size in pixels (only applies to non-button variants)
 */
function Loader({ variant = "section", color = "green", size = "40px" }) {
  
  // Logic for different variants
  const containerClass = `loader-wrapper ${variant}`;
  const spinnerClass = `spinner ${color}`;

  return (
    <div className={containerClass}>
      <div 
        className={spinnerClass} 
        style={{ 
          width: variant === "button" ? "16px" : size, 
          height: variant === "button" ? "16px" : size 
        }}
      ></div>
      {variant === "page" && <p className="loader-text">Loading ConsoliScan...</p>}
    </div>
  );
}

export default Loader;