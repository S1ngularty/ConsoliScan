import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  CreditCard, 
  Clock, 
  Heart, 
  BookOpen, 
  ShieldCheck, 
  ChevronRight, 
  Bell, 
  Gift, 
  Star,
  QrCode
} from "lucide-react";
import "../../styles/css/UserDashboard.css";
import { fetchHomeData } from "../../services/customerService";
import { useNavigate } from "react-router-dom";

const UserDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [homeData, setHomeData] = useState({
    firstName: "User",
    cartItemCount: 0,
    eligibilityDiscountUsage: {
      discountUsed: 0,
      purchasedUsed: 0,
      weekEnd: "",
    },
    is_eligibility_verified: false,
    loyaltyPoints: 0,
    orderCount: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await fetchHomeData();
      if (data) setHomeData(prev => ({
        ...prev,
        ...data,
        firstName: data.firstName || prev.firstName
      }));
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loader"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Calculate Discount Progress
  const discountUsed = homeData.eligibilityDiscountUsage?.discountUsed || 0;
  const discountPct = Math.min((discountUsed / 125) * 100, 100);
  const capColor = discountPct >= 100 ? "#DC2626" : discountPct >= 80 ? "#FF9800" : "#00A86B";

  // Dynamic Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <div className="welcome-text">
          <h1>{getGreeting()}, {homeData.firstName}</h1>
          <p>Welcome back to ConsoliScan</p>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => navigate('/user/notifications')}>
            <Bell size={20} />
            <span className="dot"></span>
          </button>
        </div>
      </div>

      <div className="dashboard-content-wrapper">
        {/* Left Column */}
        <div className="dashboard-column-left">
          {/* Hero Points Section */}
          <div className="hero-points-card">
            <h3>Points Balance</h3>
            <div className="points-ring">
              <div className="points-content">
                <span className="points-value">{homeData.loyaltyPoints?.toLocaleString()}</span>
                <span className="points-label">pts</span>
              </div>
            </div>
            <button className="pill-btn" onClick={() => navigate('/user/loyalty')}>
              <Gift size={16} />
              <span>Use Points</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div className="section-container">
            <div className="section-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions-grid">
              <div className="action-card" onClick={() => navigate('/user/cart')}>
                <div className="action-icon">
                  <ShoppingBag size={24} />
                  {homeData.cartItemCount > 0 && <span className="badge">{homeData.cartItemCount}</span>}
                </div>
                <span className="action-title">My Cart</span>
              </div>
              
              <div className="action-card" onClick={() => navigate('/user/profile')}>
                <div className="action-icon">
                  <ShieldCheck size={24} color={!homeData.is_eligibility_verified ? "#EF4444" : "inherit"} />
                </div>
                <span className="action-title">Eligibility</span>
              </div>

              <div className="action-card" onClick={() => navigate('/user/orders')}>
                <div className="action-icon">
                  <Clock size={24} />
                </div>
                <span className="action-title">Order History</span>
              </div>

              <div className="action-card" onClick={() => navigate('/user/saved')}>
                <div className="action-icon">
                  <Heart size={24} />
                </div>
                <span className="action-title">Saved Items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-column-right">
          {/* Discount Cap Card */}
          <div className="discount-cap-card">
            <div className="section-header">
              <h2>Discount Cap</h2>
              <span className="see-all">Details</span>
            </div>
            <div className="cap-header">
              <div className="cap-info">
                <h3>Weekly Discount Cap</h3>
                <span className="cap-subtitle">Resets every Monday</span>
              </div>
              <div className="cap-amount">
                <div className="current-amount" style={{ color: capColor }}>₱{discountUsed.toFixed(2)}</div>
                <div className="max-amount">/ ₱125.00</div>
              </div>
            </div>
            <div className="progress-container">
              <div className="progress-labels">
                <span>Discount Used</span>
                <span style={{ color: capColor }}>{discountPct.toFixed(0)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${discountPct}%`, backgroundColor: capColor }}
                ></div>
              </div>
            </div>
          </div>

          {/* Exclusive Offers */}
          <div className="offers-section">
            <div className="section-header">
              <h2>Exclusive Offers</h2>
              <span className="see-all">View all</span>
            </div>
            <div className="offers-grid">
              <div className="offer-card" style={{ background: "linear-gradient(135deg, #00A86B 0%, #059669 100%)" }}>
                <div className="offer-icon-box">
                  <Heart size={24} color="white" />
                </div>
                <div className="offer-content">
                  <h3>Senior/PWD Special</h3>
                  <p>Get extra 5% off BNPC items</p>
                </div>
              </div>

              <div className="offer-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" }}>
                <div className="offer-icon-box">
                  <QrCode size={24} color="white" />
                </div>
                <div className="offer-content">
                  <h3>Scan & Save</h3>
                  <p>Track all your grocery scans</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
