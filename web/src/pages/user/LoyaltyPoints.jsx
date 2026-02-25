import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, TrendingDown, History } from 'lucide-react';
import "../../styles/css/LoyaltyPoints.css";
import { fetchHomeData, fetchOrders } from "../../services/customerService";

const LoyaltyPoints = () => {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      const [homeData, ordersData] = await Promise.all([
        fetchHomeData(),
        fetchOrders()
      ]);

      setPoints(homeData?.loyaltyPoints || 0);

      // Extract points history from orders
      const pointsHistory = (ordersData || [])
        .filter(o => o.pointsEarned > 0 || o.pointsRedeemed > 0)
        .map(o => {
          if (o.pointsEarned > 0) {
            return {
              id: o._id + '_earned',
              type: 'earned',
              desc: `Earned from Order #${o.checkoutCode}`,
              points: o.pointsEarned,
              date: o.confirmedAt
            };
          }
          if (o.pointsRedeemed > 0) {
            return {
              id: o._id + '_redeemed',
              type: 'redeemed',
              desc: `Redeemed on Order #${o.checkoutCode}`,
              points: o.pointsRedeemed,
              date: o.confirmedAt
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

  return (
    <div className="loyalty-page">
      <div className="loyalty-hero">
        <div className="star-icon-wrapper">
          <Star size={48} fill="white" color="white" />
        </div>
        <div className="points-balance">{points.toLocaleString()}</div>
        <div className="points-label">Total Points Available</div>
      </div>

      <div className="history-section">
        <div className="history-header">
          <h2>Points Activity</h2>
        </div>
        
        <div className="history-list">
          {history.length > 0 ? (
            history.map(item => (
              <div key={item.id} className="history-item">
                <div className="item-left">
                  <div className={`item-icon ${item.type}`}>
                    {item.type === 'earned' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div className="item-desc">
                    <h4>{item.desc}</h4>
                    <span className="item-date">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={`item-points ${item.type === 'earned' ? 'plus' : 'minus'}`}>
                  {item.type === 'earned' ? '+' : '-'}{item.points} pts
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <History size={32} className="empty-icon" />
              <p>No points activity yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyPoints;
