import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  FileText, 
  Download, 
  ChevronRight, 
  Tag, 
  Package, 
  X,
  Calendar,
  CheckCircle,
  CreditCard
} from "lucide-react";
import "../../styles/css/OrderHistory.css";
import { fetchOrders, downloadReceipt } from "../../services/customerService";

const OrderHistory = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchOrders();
      setOrders(data || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e, orderId, checkoutCode) => {
    e.stopPropagation();
    try {
      setDownloadingId(orderId);
      await downloadReceipt(orderId, checkoutCode);
    } catch (error) {
      alert("Failed to download receipt");
    } finally {
      setDownloadingId(null);
    }
  };

  const getFilteredOrders = () => {
    if (!orders.length) return [];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (filter) {
      case "week":
        return orders.filter((o) => new Date(o.confirmedAt) >= startOfWeek);
      case "month":
        return orders.filter((o) => new Date(o.confirmedAt) >= startOfMonth);
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  // Calculations for Stats
  const totalSpent = filteredOrders.reduce((sum, o) => sum + (o.finalAmountPaid || 0), 0);
  const totalPoints = filteredOrders.reduce((sum, o) => sum + (o.loyaltyDiscount?.pointsEarned || o.pointsEarned || 0), 0);

  if (loading) {
    return <div className="loading-state">Loading orders...</div>;
  }

  return (
    <div className="order-history-page">
      <div className="page-header">
        <h1>Order History</h1>
        <p>Track your purchases and download receipts</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">₱{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span className="stat-label">Total Spent</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalPoints.toLocaleString()}</span>
          <span className="stat-label">Points Earned</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{filteredOrders.length}</span>
          <span className="stat-label">Total Orders</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        {['all', 'week', 'month'].map(f => (
          <button 
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All Orders' : f === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <div key={order._id} className="order-card" onClick={() => setSelectedOrder(order)}>
              <div className="order-header">
                <div className="store-info">
                  <div className="store-icon">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <span className="order-id">Order #{order.checkoutCode}</span>
                    <span className="order-date">{new Date(order.confirmedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="order-amount">
                  <span className="final-amount">₱{order.finalAmountPaid?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  {(order.pointsEarned > 0) && (
                    <div className="points-earned">+{order.pointsEarned} pts</div>
                  )}
                </div>
              </div>

              <div className="items-preview">
                <div className="items-label">
                  <Package size={14} />
                  {order.items?.length || 0} Items
                </div>
                {(order.items || []).slice(0, 2).map((item, i) => (
                  <div key={i} className="preview-item">
                    <span>
                      <span className="item-qty">x{item.quantity}</span>
                      {item.name}
                    </span>
                    <span className="item-price">₱{(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {(order.items?.length || 0) > 2 && (
                  <div className="more-items">+{order.items.length - 2} more items</div>
                )}
              </div>

              <div className="card-footer">
                <div className="status-chip">
                  <span className="status-dot"></span>
                  {order.status || "Confirmed"}
                </div>
                <div className="card-actions">
                  <button 
                    className="action-btn"
                    onClick={(e) => handleDownload(e, order._id, order.checkoutCode)}
                    disabled={downloadingId === order._id}
                  >
                    {downloadingId === order._id ? "Saving..." : (
                      <>
                        <Download size={16} /> Receipt
                      </>
                    )}
                  </button>
                  <button className="action-btn primary">
                    Details <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <ShoppingBag className="empty-icon" />
            <h3>No orders found</h3>
            <p>You haven't placed any orders in this period.</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Order Details</h2>
                <p>#{selectedOrder.checkoutCode}</p>
              </div>
              <button className="icon-btn" onClick={() => setSelectedOrder(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-row">
                  <span className="detail-label"><Calendar size={14}/> Date</span>
                  <span className="detail-value">{new Date(selectedOrder.confirmedAt).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label"><CheckCircle size={14}/> Status</span>
                  <span className="detail-value" style={{ color: '#00A86B' }}>{selectedOrder.status || "Confirmed"}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3 className="section-title">Items</h3>
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="detail-row">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="detail-value">₱{(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="detail-section">
                <h3 className="section-title">Payment Summary</h3>
                <div className="detail-row">
                  <span className="detail-label">Subtotal</span>
                  <span className="detail-value">₱{selectedOrder.baseAmount?.toFixed(2)}</span>
                </div>
                
                {(selectedOrder.discountBreakdown?.total > 0) && (
                  <div className="detail-row">
                    <span className="detail-label" style={{ color: '#00A86B' }}>Total Savings</span>
                    <span className="detail-value" style={{ color: '#00A86B' }}>-₱{selectedOrder.discountBreakdown.total.toFixed(2)}</span>
                  </div>
                )}

                <div className="total-row">
                  <span>Total Paid</span>
                  <span>₱{selectedOrder.finalAmountPaid?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="action-btn"
                onClick={(e) => handleDownload(e, selectedOrder._id, selectedOrder.checkoutCode)}
              >
                <Download size={16} /> Download Receipt
              </button>
              <button className="action-btn" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
