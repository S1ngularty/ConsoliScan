import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import "../../styles/css/SavedItems.css";
import { fetchSavedItems } from "../../services/customerService";

const SavedItems = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadSavedItems();
  }, []);

  const loadSavedItems = async () => {
    try {
      setLoading(true);
      const data = await fetchSavedItems();
      setItems(data || []);
    } catch (error) {
      console.error("Failed to load saved items:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading saved items...</div>;

  return (
    <div className="saved-items-page">
      <div className="page-header">
        <h1>Saved Items</h1>
        <p>Your favorite products and wishlist</p>
      </div>

      <div className="saved-items-grid">
        {items.length > 0 ? (
          items.map(item => (
            <div key={item._id} className="saved-item-card">
              <div className="item-image-container">
                <img 
                  src={item.product?.image?.url || 'https://via.placeholder.com/200'} 
                  alt={item.product?.name} 
                  className="item-image"
                />
                <button className="icon-btn" style={{ position: 'absolute', top: 10, right: 10, background: 'white', borderRadius: '50%', padding: 8 }}>
                  <Trash2 size={18} color="#EF4444" />
                </button>
              </div>
              <div className="item-details">
                <h3 className="item-name">{item.product?.name}</h3>
                <span className="item-price">₱{item.product?.price?.toFixed(2)}</span>
                
                <button className="add-to-cart-btn">
                  <ShoppingBag size={18} /> Add to Cart
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Heart size={48} className="empty-icon" />
            <h3>No saved items</h3>
            <p>Items you save will appear here for easy access.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedItems;
