import React, { useEffect } from "react";
import { X, Save, Package, Barcode, DollarSign, Box, Image as ImageIcon, Tag } from "lucide-react";
import "../../styles/admin/ProductModalStyle.css";

function ProductModal({ isOpen, data, Onclose }) {
  // Handle body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Barcode Types from your Schema Enum
  const barcodeTypes = ["UPC", "EAN_13", "EAN_8", "ISBN_10", "ISBN_13", "CODE_128", "QR"];

  return (
    <div className="modal-overlay" onClick={Onclose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER - Fixed */}
        <header className="modal-header">
          <div className="header-title">
            <div className="icon-circle">
              <Package size={20} />
            </div>
            <div>
              <h2>{data ? "Edit Product" : "Add New Product"}</h2>
              <p className="subtitle">{data ? `SKU: ${data.sku}` : "Enter product specifications below"}</p>
            </div>
          </div>
          <button className="close-x" onClick={Onclose}><X size={20} /></button>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="modal-scroll-content">
          <div className="modal-body-columns">
            
            {/* LEFT COLUMN: Basic Info & Inventory */}
            <div className="side-panel">
              <div>
                <div className="section-label"><Tag size={14} /> General Information</div>
                
                <div className="input-group full">
                  <label>Product Name</label>
                  <input type="text" defaultValue={data?.name} placeholder="e.g. Premium Wireless Headphones" />
                </div>

                <div className="input-grid">
                  <div className="input-group">
                    <label>SKU (Stock Keeping Unit)</label>
                    <input type="text" defaultValue={data?.sku} placeholder="PROD-123" />
                  </div>
                  <div className="input-group">
                    <label>Price ($)</label>
                    <div className="input-with-icon">
                      <DollarSign size={14} className="input-icon" />
                      <input type="number" defaultValue={data?.price} placeholder="0.00" step="0.01" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="section-label"><Barcode size={14} /> Barcode Details</div>
                <div className="input-grid">
                  <div className="input-group">
                    <label>Barcode Number</label>
                    <input type="text" defaultValue={data?.barcode} placeholder="1234567890" />
                  </div>
                  <div className="input-group">
                    <label>Barcode Type</label>
                    <select defaultValue={data?.barcodeType || "UPC"}>
                      {barcodeTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-group full">
                  <label>Stock Quantity</label>
                  <div className="input-with-icon">
                    <Box size={14} className="input-icon" />
                    <input type="number" defaultValue={data?.stockQuantity} placeholder="0" min="0" />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Media & Description */}
            <div className="side-panel">
              <div>
                <div className="section-label"><ImageIcon size={14} /> Product Media</div>
                
                <div className="image-upload-grid">
                  {/* Preview of existing images or placeholder */}
                  <div className="image-preview-main">
                    {data?.images?.[0]?.url ? (
                      <img src={data.images[0].url} alt="Product" />
                    ) : (
                      <div className="upload-placeholder">
                        <ImageIcon size={32} color="#94a3b8" />
                        <span>Main Image</span>
                      </div>
                    )}
                  </div>
                  <div className="image-thumbnails">
                    <div className="thumb-add">+ Add</div>
                    <div className="thumb-placeholder"></div>
                    <div className="thumb-placeholder"></div>
                    <div className="thumb-placeholder"></div>
                  </div>
                </div>
              </div>

              <div>
                <div className="section-label"><Box size={14} /> Description</div>
                <div className="input-group full">
                  <textarea 
                    rows="6" 
                    defaultValue={data?.description} 
                    placeholder="Write a detailed product description..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER - Fixed */}
        <footer className="modal-footer">
          <button className="btn-secondary" onClick={Onclose}>Cancel</button>
          <button className="btn-primary">
            <Save size={18} />
            <span>{data ? "Update Product" : "Save Product"}</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ProductModal;