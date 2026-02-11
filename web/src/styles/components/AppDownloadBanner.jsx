import React from "react";

const AppDownloadBanner = () => {
  return (
    <section className="app-banner-container" aria-label="Download App">
      <div className="app-banner-card">
        {/* Left: Store Badges */}
        <div className="app-badges">
          <button className="store-badge apple-badge">
            <svg className="store-icon" viewBox="0 0 384 512" width="24" fill="currentColor">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-54.5-65-53.1-92.3zm-132.3-163c22.2-24.8 42.1-53.9 39.7-84.5-23.7 3.3-50.6 15.2-69.7 37.5-17 19.4-32.9 50.8-29.6 81.3 27 2.5 45.2-14.1 59.6-34.3z"/>
            </svg>
            <div className="badge-text">
              <span className="badge-small">Download on the</span>
              <span className="badge-large">App Store</span>
            </div>
          </button>
          
          <button className="store-badge google-badge">
            <svg className="store-icon" viewBox="0 0 512 512" width="24" fill="currentColor">
              <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
            </svg>
            <div className="badge-text">
              <span className="badge-small">GET IT ON</span>
              <span className="badge-large">Google Play</span>
            </div>
          </button>
        </div>

        {/* Center: Text */}
        <div className="app-text-content">
          <h2 className="app-title">ConsoliScan App</h2>
          <div className="app-divider"></div>
          <p className="app-subtitle">Scan QR code to download</p>
        </div>

        {/* Right: QR Code */}
        <div className="app-qr">
          <div className="qr-placeholder">
            <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6zM7 7h-2v-2h2zM19 7h-2v-2h2zM7 19h-2v-2h2zM19 19h-2v-2h2z"/>
              <path d="M10 3h4v2h-4zM3 10h2v4H3zM10 19h4v2h-4zM19 10h2v4h-2zM10 10h4v4h-4z"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadBanner;
