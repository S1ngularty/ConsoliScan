import React, { useEffect } from "react";
import {
  X,
  Save,
  Package,
  Barcode,
  DollarSign,
  Box,
  Image as ImageIcon,
  Tag,
} from "lucide-react";
import "../../styles/admin/ProductModalStyle.css";
import { createProduct } from "../../services/productService";

function ProductModal({ isOpen, data, onClose, onSave }) {
  const [productInfo, setProductInfo] = React.useState(
    data
      ? { ...data }
      : {
          name: "",
          sku: "",
          price: "",
          barcode: "",
          barcodeType: "UPC",
          stockQuantity: "",
          description: "",
          images: [],
        }
  );
  
  const [uploading, setUploading] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [fileToUpload, setFileToUpload] = React.useState([])
  const fileInputRef = React.useRef(null);

  // Handle body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  // Reset form when opening with new data
  useEffect(() => {
    if (isOpen && data) {
      setProductInfo({ ...data });
      setSelectedImageIndex(0);
    } else if (isOpen && !data) {
      setProductInfo({
        name: "",
        sku: "",
        price: "",
        barcode: "",
        barcodeType: "UPC",
        stockQuantity: "",
        description: "",
        images: [],
      });
      setSelectedImageIndex(0);
    }
  }, [isOpen, data]);

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Barcode Types from your Schema Enum
  const barcodeTypes = ["UPC", "EAN_13", "EAN_8", "ISBN_10", "ISBN_13", "CODE_128", "QR"];

  const handleInput = (field, value) => {
    setProductInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setUploading(true);
    
    // Process each file
    const processFiles = async () => {
      const newImages = [...(productInfo.images || [])];
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
          console.warn(`File ${file.name} is not an image, skipping.`);
          continue;
        }
        
        const reader = new FileReader();
        
        await new Promise((resolve) => {
          reader.onload = (e) => {
            const imageUrl = e.target.result;
            
            if (i === 0 && newImages.length === 0) {
              // First image becomes main image
              newImages.unshift({ url: imageUrl });
            } else {
              newImages.push({ url: imageUrl });
            }
            resolve();
          };
          
          reader.onerror = () => {
            console.error("Failed to read file:", file.name);
            resolve();
          };
          
          reader.readAsDataURL(file);
        });
      }
      
      setProductInfo((prev) => ({
        ...prev,
        images: newImages,
      }));

      setFileToUpload((prev)=>({...prev, fileArray}))
      
      setUploading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    processFiles();
  };

  const removeImage = (index) => {
    const newImages = [...productInfo.images];
    newImages.splice(index, 1);
    
    setProductInfo((prev) => ({
      ...prev,
      images: newImages,
    }));
    
    // Adjust selected index if needed
    if (selectedImageIndex >= index) {
      if (newImages.length === 0) {
        setSelectedImageIndex(0);
      } else if (selectedImageIndex > 0) {
        setSelectedImageIndex(selectedImageIndex - 1);
      }
    }
  };

  const handleMainImageClick = () => {
    fileInputRef.current.click();
  };

  const handleSave = async () => {
   const isSave = createProduct(productInfo,fileToUpload)
   if(isSave) onSave()
  };

  // Handle overlay click - FIXED
  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay (not its children)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* HEADER - Fixed */}
        <header className="modal-header">
          <div className="header-title">
            <div className="icon-circle">
              <Package size={20} />
            </div>
            <div>
              <h2>{data ? "Edit Product" : "Add New Product"}</h2>
              <p className="subtitle">
                {data
                  ? `SKU: ${data.sku}`
                  : "Enter product specifications below"}
              </p>
            </div>
          </div>
          <button className="close-x" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="modal-scroll-content">
          <div className="modal-body-columns">
            {/* LEFT COLUMN: Basic Info & Inventory */}
            <div className="side-panel">
              <div>
                <div className="section-label">
                  <Tag size={14} /> General Information
                </div>

                <div className="input-group full">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={productInfo.name || ""}
                    placeholder="e.g. Premium Wireless Headphones"
                    onChange={(e) => handleInput("name", e.target.value)}
                  />
                </div>

                <div className="input-grid">
                  <div className="input-group">
                    <label>SKU (Stock Keeping Unit) *</label>
                    <input
                      type="text"
                      value={productInfo.sku || ""}
                      placeholder="PROD-123"
                      onChange={(e) => handleInput("sku", e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Price ($) *</label>
                    <div className="input-with-icon">
                      <DollarSign size={14} className="input-icon" />
                      <input
                        type="number"
                        value={productInfo.price || ""}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        onChange={(e) => handleInput("price", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="section-label">
                  <Barcode size={14} /> Barcode Details
                </div>
                <div className="input-grid">
                  <div className="input-group">
                    <label>Barcode Number</label>
                    <input
                      type="text"
                      value={productInfo.barcode || ""}
                      placeholder="1234567890"
                      onChange={(e) => handleInput("barcode", e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Barcode Type</label>
                    <select
                      value={productInfo.barcodeType || "UPC"}
                      onChange={(e) =>
                        handleInput("barcodeType", e.target.value)
                      }
                    >
                      {barcodeTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-group full">
                  <label>Stock Quantity *</label>
                  <div className="input-with-icon">
                    <Box size={14} className="input-icon" />
                    <input
                      type="number"
                      value={productInfo.stockQuantity || ""}
                      placeholder="0"
                      min="0"
                      onChange={(e) =>
                        handleInput("stockQuantity", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Media & Description */}
            <div className="side-panel">
              <div>
                <div className="section-label">
                  <ImageIcon size={14} /> Product Media
                </div>

                <div className="image-upload-grid">
                  {/* Main Image Preview */}
                  <div className="image-preview-main" onClick={handleMainImageClick}>
                    {uploading ? (
                      <div className="image-loading"></div>
                    ) : productInfo.images?.length > 0 ? (
                      <>
                        <img 
                          src={productInfo.images[selectedImageIndex]?.url} 
                          alt="Product" 
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFiles(e.target.files)}
                        />
                      </>
                    ) : (
                      <>
                        <div className="upload-placeholder">
                          <ImageIcon size={32} color="#94a3b8" />
                          <span>main image</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnails Grid */}
                  <div className="image-thumbnails">
                    <input
                      type="file"
                      ref={fileInputRef}
                      hidden
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFiles(e.target.files)}
                    />

                    {/* Add Button */}
                    <div
                      className="thumb-add"
                      onClick={() => fileInputRef.current.click()}
                    >
                      +
                    </div>

                    {/* Existing Images */}
                    {productInfo.images?.map((image, index) => (
                      <div 
                        key={index} 
                        className={`thumb-placeholder has-image ${index === selectedImageIndex ? 'selected' : ''}`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img src={image.url} alt={`Thumbnail ${index + 1}`} />
                        {productInfo.images.length > 1 && (
                          <div 
                            className="thumb-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                          >
                            ×
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Empty Placeholders */}
                    {Array.from({ 
                      length: Math.max(0, 3 - (productInfo.images?.length || 0)) 
                    }).map((_, index) => (
                      <div 
                        key={`empty-${index}`} 
                        className="thumb-placeholder"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="section-label">
                  <Box size={14} /> Description
                </div>
                <div className="input-group full">
                  <textarea
                    rows="6"
                    value={productInfo.description || ""}
                    placeholder="Write a detailed product description..."
                    onChange={(e) => handleInput("description", e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER - Fixed */}
        <footer className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <Save size={18} />
            <span>{data ? "Update Product" : "Save Product"}</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ProductModal;