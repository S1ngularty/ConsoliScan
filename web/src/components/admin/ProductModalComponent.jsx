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
  AlertCircle,
} from "lucide-react";
import "../../styles/admin/ProductModalStyle.css";
import {
  handleProductRequest,
  removeImageRequest,
} from "../../services/productService";
import Loader from "../common/LoaderComponent";

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
        },
  );

  const [uploading, setUploading] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [fileToUpload, setFileToUpload] = React.useState([]);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(false);

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
      setErrors({});
      setTouched({});
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
      setErrors({});
      setTouched({});
    }
  }, [isOpen, data]);

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Barcode Types from your Schema Enum
  const barcodeTypes = [
    "UPC",
    "EAN_13",
    "EAN_8",
    "ISBN_10",
    "ISBN_13",
    "CODE_128",
    "QR",
  ];

  // Validation rules
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "name":
        if (!value.trim()) error = "Product name is required";
        else if (value.length < 2)
          error = "Product name must be at least 2 characters";
        else if (value.length > 100)
          error = "Product name must be less than 100 characters";
        break;

      case "sku":
        if (!value.trim()) error = "SKU is required";
        else if (!/^[A-Za-z0-9\-_]+$/.test(value))
          error =
            "SKU can only contain letters, numbers, hyphens and underscores";
        else if (value.length > 50)
          error = "SKU must be less than 50 characters";
        break;

      case "price":
        if (!value && value !== 0) error = "Price is required";
        else if (isNaN(value)) error = "Price must be a number";
        else if (parseFloat(value) < 0) error = "Price cannot be negative";
        else if (parseFloat(value) > 1000000)
          error = "Price cannot exceed $1,000,000";
        break;

      case "stockQuantity":
        if (!value && value !== 0) error = "Stock quantity is required";
        else if (isNaN(value)) error = "Stock quantity must be a number";
        else if (parseInt(value) < 0)
          error = "Stock quantity cannot be negative";
        else if (!Number.isInteger(parseFloat(value)))
          error = "Stock quantity must be a whole number";
        break;

      case "barcode":
        if (value && value.length > 50)
          error = "Barcode must be less than 50 characters";
        break;

      default:
        break;
    }

    return error;
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate required fields
    newErrors.name = validateField("name", productInfo.name);
    newErrors.sku = validateField("sku", productInfo.sku);
    newErrors.price = validateField("price", productInfo.price);
    newErrors.stockQuantity = validateField(
      "stockQuantity",
      productInfo.stockQuantity,
    );
    newErrors.barcode = validateField("barcode", productInfo.barcode);

    // Validate at least one image for new products
    if (!data && (!productInfo.images || productInfo.images.length === 0)) {
      newErrors.images = "At least one product image is required";
    }

    return newErrors;
  };

  const handleInput = (field, value) => {
    setProductInfo((prev) => ({ ...prev, [field]: value }));

    // Validate on change if field has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, productInfo[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploading(true);

    // Clear image error when user starts uploading
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: "" }));
    }

    // Validate file types and sizes
    const validFiles = [];
    const invalidFiles = [];

    fileArray.forEach((file) => {
      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        invalidFiles.push(`${file.name} is not an image`);
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} exceeds 5MB limit`);
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        images: invalidFiles.join(", "),
      }));
    }

    if (validFiles.length === 0) {
      setUploading(false);
      return;
    }

    // Process each valid file
    const processFiles = async () => {
      const newImages = [...(productInfo.images || [])];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];

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

      setFileToUpload((prev) => [...prev, ...validFiles]);

      setUploading(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
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

    // Remove corresponding file from fileToUpload if it exists
    if (fileToUpload.length > index) {
      const newFiles = [...fileToUpload];
      newFiles.splice(index, 1);
      setFileToUpload(newFiles);
    }

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
    // Mark all fields as touched
    setIsLoading(true);
    const allFields = ["name", "sku", "price", "stockQuantity", "barcode"];
    const newTouched = {};
    allFields.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    // Validate entire form
    const formErrors = validateForm();
    setErrors(formErrors);

    // Check if there are any errors
    const hasErrors = Object.values(formErrors).some((error) => error);

    if (hasErrors) {
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors).find(
        (field) => formErrors[field],
      );
      if (firstErrorField) {
        const element = document.querySelector(
          `[data-field="${firstErrorField}"]`,
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }
      setIsLoading(false);
      return;
    }

    try {
      const isSave = await handleProductRequest(
        productInfo,
        fileToUpload,
        data ? "put" : "post",
      );
      if (isSave) {
        onSave();
      }
    } catch (error) {
      console.error("Failed to save product:", error);
      setErrors((prev) => ({
        ...prev,
        _form: error.message || "Failed to save product. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const removeImg = async (publicId, index) => {
    console.log(publicId);
    if (!publicId) return;
    const result = removeImageRequest(data._id, publicId);
    if (result) removeImage(index);
  };

  // Handle overlay click
  const handleOverlayClick = (e) => {
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

                <div className="input-group full" data-field="name">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={productInfo.name || ""}
                    placeholder="e.g. Premium Wireless Headphones"
                    onChange={(e) => handleInput("name", e.target.value)}
                    onBlur={() => handleBlur("name")}
                    className={errors.name ? "input-error" : ""}
                  />
                  {errors.name && (
                    <div className="error-message">
                      <AlertCircle size={12} />
                      <span>{errors.name}</span>
                    </div>
                  )}
                </div>

                <div className="input-grid">
                  <div className="input-group" data-field="sku">
                    <label>SKU (Stock Keeping Unit) *</label>
                    <input
                      type="text"
                      value={productInfo.sku || ""}
                      placeholder="PROD-123"
                      onChange={(e) => handleInput("sku", e.target.value)}
                      onBlur={() => handleBlur("sku")}
                      className={errors.sku ? "input-error" : ""}
                    />
                    {errors.sku && (
                      <div className="error-message">
                        <AlertCircle size={12} />
                        <span>{errors.sku}</span>
                      </div>
                    )}
                  </div>
                  <div className="input-group" data-field="price">
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
                        onBlur={() => handleBlur("price")}
                        className={errors.price ? "input-error" : ""}
                      />
                    </div>
                    {errors.price && (
                      <div className="error-message">
                        <AlertCircle size={12} />
                        <span>{errors.price}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="section-label">
                  <Barcode size={14} /> Barcode Details
                </div>
                <div className="input-grid">
                  <div className="input-group" data-field="barcode">
                    <label>Barcode Number</label>
                    <input
                      type="text"
                      value={productInfo.barcode || ""}
                      placeholder="1234567890"
                      onChange={(e) => handleInput("barcode", e.target.value)}
                      onBlur={() => handleBlur("barcode")}
                      className={errors.barcode ? "input-error" : ""}
                    />
                    {errors.barcode && (
                      <div className="error-message">
                        <AlertCircle size={12} />
                        <span>{errors.barcode}</span>
                      </div>
                    )}
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

                <div className="input-group full" data-field="stockQuantity">
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
                      onBlur={() => handleBlur("stockQuantity")}
                      className={errors.stockQuantity ? "input-error" : ""}
                    />
                  </div>
                  {errors.stockQuantity && (
                    <div className="error-message">
                      <AlertCircle size={12} />
                      <span>{errors.stockQuantity}</span>
                    </div>
                  )}
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
                  <div
                    className="image-preview-main"
                    onClick={handleMainImageClick}
                  >
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

                  {/* Image error display */}
                  {errors.images && (
                    <div className="error-message">
                      <AlertCircle size={12} />
                      <span>{errors.images}</span>
                    </div>
                  )}

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
                        className={`thumb-placeholder has-image ${
                          index === selectedImageIndex ? "selected" : ""
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img src={image.url} alt={`Thumbnail ${index + 1}`} />
                        {productInfo.images.length > 1 && (
                          <div
                            className="thumb-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              image.public_id
                                ? removeImg(image.public_id, index)
                                : removeImage(index);
                            }}
                          >
                            ×
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Empty Placeholders */}
                    {Array.from({
                      length: Math.max(
                        0,
                        3 - (productInfo.images?.length || 0),
                      ),
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

        {/* Form level error */}
        {errors._form && (
          <div className="form-error">
            <AlertCircle size={16} />
            <span>{errors._form}</span>
          </div>
        )}

        {/* FOOTER - Fixed */}
        <footer className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader variant={"button"} color={"white"}></Loader>
            ) : (
              <>
                <Save size={18} />
                <span>{data ? "Update Product" : "Save Product"}</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ProductModal;
