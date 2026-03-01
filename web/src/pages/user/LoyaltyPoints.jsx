import React, { useState, useEffect } from "react";
import {
  Star,
  TrendingUp,
  TrendingDown,
  History,
  Gift,
  ChevronRight,
  Trophy,
  Heart,
  X,
  CheckCircle,
} from "lucide-react";
import "../../styles/css/LoyaltyPoints.css";
import { fetchHomeData, fetchOrders } from "../../services/customerService";
import { useNavigate } from "react-router-dom";

const LoyaltyPoints = () => {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      const [homeData, ordersData] = await Promise.all([
        fetchHomeData(),
        fetchOrders(),
      ]);

      setPoints(homeData?.loyaltyPoints || 0);

      // Extract points history from orders
      const pointsHistory = (ordersData || [])
        .filter((o) => o.pointsEarned > 0 || o.pointsRedeemed > 0)
        .map((o) => {
          if (o.pointsEarned > 0) {
            return {
              id: o._id + "_earned",
              type: "earned",
              desc: `Earned from Order #${o.checkoutCode}`,
              points: o.pointsEarned,
              date: o.confirmedAt,
            };
          }
          if (o.pointsRedeemed > 0) {
            return {
              id: o._id + "_redeemed",
              type: "redeemed",
              desc: `Redeemed on Order #${o.checkoutCode}`,
              points: o.pointsRedeemed,
              date: o.confirmedAt,
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setHistory(pointsHistory);
    } catch (error) {
      console.error("Failed to load loyalty data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading points...</div>;

  // Calculate progress to next reward tier
  const nextTierPoints = 1000;
  const progressToNext = Math.min((points / nextTierPoints) * 100, 100);
  const pointsUntilNext = Math.max(nextTierPoints - points, 0).toFixed(2);

  return (
    <div className="loyalty-page">
      {/* Hero Points Section */}
      <div className="hero-points-card">
        <div className="points-header">
          <h3>Your Points Balance</h3>
          <div className="trophy-icon">
            <Trophy size={32} />
          </div>
        </div>
        <div className="points-ring">
          <div className="points-content">
            <span className="points-value">{points.toLocaleString()}</span>
            <span className="points-label">pts</span>
          </div>
        </div>
        <div className="points-progress">
          <div className="progress-info">
            <span className="progress-label">
              {pointsUntilNext} pts to Gold Tier
            </span>
            <span className="progress-percentage">
              {progressToNext.toFixed(0)}%
            </span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressToNext}%` }}
            ></div>
          </div>
        </div>
        <button className="pill-btn" onClick={() => setShowRedeemModal(true)}>
          <Gift size={16} />
          <span>Redeem Rewards</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Points Activity Section */}
      <div className="section-header">
        <h2>Recent Activity</h2>
        <span className="see-all">View all</span>
      </div>
      <div className="activity-grid">
        {history.length > 0 ? (
          history.slice(0, 6).map((item) => (
            <div key={item.id} className="activity-card">
              <div className={`activity-icon ${item.type}`}>
                {item.type === "earned" ? (
                  <TrendingUp size={20} />
                ) : (
                  <TrendingDown size={20} />
                )}
              </div>
              <div className="activity-content">
                <h4>{item.desc}</h4>
                <span className="activity-date">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
              <div
                className={`activity-points ${item.type === "earned" ? "plus" : "minus"}`}
              >
                {item.type === "earned" ? "+" : "-"}
                {item.points} pts
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-card">
            <History size={32} className="empty-icon" />
            <p>No points activity yet.</p>
            <span className="empty-subtitle">
              Start shopping to earn points!
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="section-header">
        <h2>Quick Actions</h2>
      </div>
      <div className="quick-actions-grid">
        <div className="action-card" onClick={() => navigate("/user/orders")}>
          <div className="action-icon">
            <History size={24} />
          </div>
          <span className="action-title">Order History</span>
        </div>
        <div className="action-card" onClick={() => setShowRedeemModal(true)}>
          <div className="action-icon">
            <Gift size={24} />
          </div>
          <span className="action-title">Redeem Rewards</span>
        </div>
        <div className="action-card" onClick={() => navigate("/user/saved")}>
          <div className="action-icon">
            <Heart size={24} />
          </div>
          <span className="action-title">Saved Items</span>
        </div>
      </div>

      {/* Redeem Rewards Modal */}
      {showRedeemModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>How to Redeem Rewards</h2>
              <button
                className="close-btn"
                onClick={() => setShowRedeemModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="redeem-steps">
                <div className="step-item">
                  <div className="step-icon">
                    <Star size={24} />
                  </div>
                  <div className="step-content">
                    <h4>Earn Points</h4>
                    <p>Earn 1 point for every ₱1 spent on eligible items.</p>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-icon">
                    <Trophy size={24} />
                  </div>
                  <div className="step-content">
                    <h4>Reach Tiers</h4>
                    <p>
                      Accumulate points to unlock higher tiers for better
                      conversion rates.
                    </p>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-icon">
                    <CheckCircle size={24} />
                  </div>
                  <div className="step-content">
                    <h4>Checkout Redemption</h4>
                    <p>
                      On the checkout page, look for the "Use Points" option.
                      You can apply your points to get a direct discount on your
                      total bill.
                    </p>
                  </div>
                </div>
              </div>

              <div className="conversion-info">
                <h4>Current Conversion Rate</h4>
                <div className="rate-card">
                  <span className="rate-points">100 Points</span>
                  <span className="rate-equals">=</span>
                  <span className="rate-currency">₱1.00 Discount</span>
                </div>
                <p className="note">
                  *Maximum redemption of 30% of total order value.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="submit-btn"
                onClick={() => setShowRedeemModal(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyPoints;
