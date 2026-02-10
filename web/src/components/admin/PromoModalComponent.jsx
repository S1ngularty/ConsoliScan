// src/pages/admin/promo/components/PromoModal.jsx
import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Calendar,
  Percent,
  DollarSign,
  Tag,
  ShoppingCart,
  Package,
  Gift,
  AlertCircle,
} from "lucide-react";
import "../../styles/admin/discount/PromoModalStyle.css";
import { getSelections,createPromo, } from "../../services/promoService";

const PromoModal = ({ isOpen, onClose, onSave, data, mode }) => {
  const isEditMode = mode === "edit";

  // Updated to match Mongoose schema
  const [formData, setFormData] = useState({
    promoName: { promo: "" },
    code: "",
    promoType: "percentage",
    value: "",
    scope: "cart",
    targetIds: [],
    minPurchase: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
    active: true,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Set default dates when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().split("T")[0];

      if (isEditMode && data) {
        // For edit mode, use existing data
        setFormData({
          promoName: { promo: data.promoName?.promo || "" },
          code: data.code || "",
          promoType: data.promoType || "percentage",
          value: data.value || "",
          scope: data.scope || "cart",
          targetIds: Array.isArray(data.targetIds) ? data.targetIds : [],
          minPurchase: data.minPurchase || "",
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().split("T")[0]
            : today,
          endDate: data.endDate
            ? new Date(data.endDate).toISOString().split("T")[0]
            : nextMonthStr,
          usageLimit: data.usageLimit || "",
          active: data.active ?? true,
        });
      } else {
        // For create mode, set defaults
        setFormData(prev => ({
          ...prev,
          startDate: today,
          endDate: nextMonthStr,
          scope: "cart",
        }));
      }
      
      // Fetch selections
      fetchSelections();
      setErrors({});
    }
  }, [isOpen, data, isEditMode]);

  const fetchSelections = async () => {
    const result = await getSelections();
    if (result.products) setProducts(result.products);
    if (result.categories) setCategories(result.categories);
  };

  // Simple form change handler
  const handleChange = (field, value) => {
    // Clear targetIds when scope changes
    if (field === "scope" && value !== formData.scope) {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        targetIds: [],
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Handle promo name change (nested object)
  const handlePromoNameChange = (value) => {
    setFormData(prev => ({
      ...prev,
      promoName: { promo: value }
    }));
    
    if (errors.promoName) {
      setErrors(prev => ({ ...prev, promoName: "" }));
    }
  };

  // Simple target toggle
  const handleTargetToggle = (id) => {
    const newTargetIds = formData.targetIds.includes(id)
      ? formData.targetIds.filter((targetId) => targetId !== id)
      : [...formData.targetIds, id];

    handleChange("targetIds", newTargetIds);
  };

  // Generate code
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "PROMO-";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleChange("code", code);
  };

  // Submit handler - updated to match Mongoose schema
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    const newErrors = {};
    if (!formData.promoName.promo.trim())
      newErrors.promoName = "Promo name is required";
    if (!formData.code.trim()) newErrors.code = "Promo code is required";
    if (!formData.value) newErrors.value = "Value is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";

    if (
      (formData.scope === "category" || formData.scope === "product") &&
      formData.targetIds.length === 0
    ) {
      newErrors.targetIds = `Please select at least one ${formData.scope}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data matching Mongoose schema
      const saveData = {
        promoName: { promo: formData.promoName.promo.trim() },
        code: formData.code.trim(),
        promoType: formData.promoType,
        value: parseFloat(formData.value),
        scope: formData.scope,
        targetIds: formData.scope !== 'cart' ? formData.targetIds : [],
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        active: formData.active,
      };

      await onSave(saveData);
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="promo-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="promo-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <header className="promo-modal-header">
            <div className="header-title">
              <div className="icon-circle">
                <Gift size={20} />
              </div>
              <div>
                <h2>{isEditMode ? "Edit Promo" : "Create New Promo"}</h2>
                <p className="subtitle">
                  {isEditMode
                    ? "Update promo details"
                    : "Create a new promotional offer"}
                </p>
              </div>
            </div>
            <button type="button" className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </header>

          <div className="promo-modal-scroll-content">
            <div className="promo-modal-body">
              <div className="form-columns">
                {/* Left Column */}
                <div className="form-column">
                  {/* Promo Name */}
                  <div className="form-group">
                    <label>
                      <Tag size={14} />
                      Promo Name *
                    </label>
                    <input
                      type="text"
                      value={formData.promoName.promo}
                      onChange={(e) =>
                        handlePromoNameChange(e.target.value)
                      }
                      placeholder="e.g., Summer Sale 2024"
                      className={errors.promoName ? "input-error" : ""}
                    />
                    {errors.promoName && (
                      <div className="error-message">
                        <AlertCircle size={12} />
                        <span>{errors.promoName}</span>
                      </div>
                    )}
                  </div>

                  {/* Promo Code */}
                  <div className="form-group">
                    <label>
                      <Tag size={14} />
                      Promo Code *
                    </label>
                    <div className="code-input-group">
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => handleChange("code", e.target.value)}
                        placeholder="e.g., SUMMER24"
                        className={errors.code ? "input-error" : ""}
                      />
                      <button
                        type="button"
                        className="generate-code-btn"
                        onClick={generateCode}
                      >
                        Generate
                      </button>
                    </div>
                    {errors.code && (
                      <div className="error-message">
                        <AlertCircle size={12} />
                        <span>{errors.code}</span>
                      </div>
                    )}
                  </div>

                  {/* Promo Type & Value */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Promo Type *</label>
                      <div className="type-toggle">
                        <button
                          type="button"
                          className={`type-option ${formData.promoType === "percentage" ? "active" : ""}`}
                          onClick={() =>
                            handleChange("promoType", "percentage")
                          }
                        >
                          <Percent size={16} />
                          <span>Percentage</span>
                        </button>
                        <button
                          type="button"
                          className={`type-option ${formData.promoType === "fixed" ? "active" : ""}`}
                          onClick={() => handleChange("promoType", "fixed")}
                        >
                          <DollarSign size={16} />
                          <span>Fixed Amount</span>
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Discount Value *</label>
                      <div className="value-input-group">
                        {formData.promoType === "percentage" ? (
                          <Percent size={16} className="input-icon" />
                        ) : (
                          <DollarSign size={16} className="input-icon" />
                        )}
                        <input
                          type="number"
                          value={formData.value}
                          onChange={(e) =>
                            handleChange("value", e.target.value)
                          }
                          placeholder={
                            formData.promoType === "percentage" ? "10" : "5.00"
                          }
                          step={
                            formData.promoType === "percentage" ? "1" : "0.01"
                          }
                          min="0"
                          max={
                            formData.promoType === "percentage"
                              ? "100"
                              : undefined
                          }
                          className={errors.value ? "input-error" : ""}
                        />
                        {formData.promoType === "percentage" && (
                          <span className="value-suffix">%</span>
                        )}
                      </div>
                      {errors.value && (
                        <div className="error-message">
                          <AlertCircle size={12} />
                          <span>{errors.value}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scope */}
                  <div className="form-group">
                    <label>Scope *</label>
                    <div className="scope-toggle">
                      <button
                        type="button"
                        className={`scope-option ${formData.scope === "cart" ? "active" : ""}`}
                        onClick={() => handleChange("scope", "cart")}
                      >
                        <ShoppingCart size={16} />
                        <span>Cart</span>
                      </button>
                      <button
                        type="button"
                        className={`scope-option ${formData.scope === "category" ? "active" : ""}`}
                        onClick={() => handleChange("scope", "category")}
                      >
                        <Package size={16} />
                        <span>Category</span>
                      </button>
                      <button
                        type="button"
                        className={`scope-option ${formData.scope === "product" ? "active" : ""}`}
                        onClick={() => handleChange("scope", "product")}
                      >
                        <Gift size={16} />
                        <span>Product</span>
                      </button>
                    </div>
                  </div>

                  {/* TARGET SELECTION */}
                  <div
                    className="form-group"
                    style={{
                      opacity:
                        formData.scope === "category" ||
                        formData.scope === "product"
                          ? 1
                          : 0.5,
                      pointerEvents:
                        formData.scope === "category" ||
                        formData.scope === "product"
                          ? "auto"
                          : "none",
                    }}
                  >
                    <label>
                      {formData.scope === "category"
                        ? "Select Categories"
                        : "Select Products"}{" "}
                      *
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        {formData.scope === "cart"
                          ? "(Disabled - select Category or Product scope first)"
                          : ""}
                      </span>
                    </label>

                    {(formData.scope === "category" ||
                      formData.scope === "product") && (
                      <>
                        <div
                          style={{
                            padding: "12px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            backgroundColor: "#f8fafc",
                            marginBottom: "10px",
                          }}
                        >
                          <div style={{ marginBottom: "8px" }}>
                            <strong>Available {formData.scope}s:</strong>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            {(formData.scope === "category"
                              ? categories
                              : products
                            ).map((item) => (
                              <button
                                key={item._id}
                                type="button"
                                onClick={() => handleTargetToggle(item._id)}
                                style={{
                                  padding: "6px 12px",
                                  border: formData.targetIds.includes(item._id)
                                    ? "2px solid #8b5cf6"
                                    : "1px solid #cbd5e1",
                                  backgroundColor: formData.targetIds.includes(
                                    item._id,
                                  )
                                    ? "#f3e8ff"
                                    : "white",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  color: formData.targetIds.includes(item._id)
                                    ? "#7c3aed"
                                    : "#475569",
                                }}
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>

                          {formData.targetIds.length > 0 && (
                            <div
                              style={{
                                marginTop: "12px",
                                paddingTop: "12px",
                                borderTop: "1px solid #e2e8f0",
                              }}
                            >
                              <strong>Selected:</strong>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "6px",
                                  marginTop: "6px",
                                }}
                              >
                                {formData.targetIds.map((id) => {
                                  const item = (
                                    formData.scope === "category"
                                      ? categories
                                      : products
                                  ).find((item) => item._id === id);
                                  return item ? (
                                    <span
                                      key={id}
                                      style={{
                                        padding: "4px 10px",
                                        backgroundColor: "#f3e8ff",
                                        color: "#7c3aed",
                                        borderRadius: "16px",
                                        fontSize: "12px",
                                      }}
                                    >
                                      {item.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {errors.targetIds && (
                          <div className="error-message">
                            <AlertCircle size={12} />
                            <span>{errors.targetIds}</span>
                          </div>
                        )}

                        <small className="input-hint">
                          Click items to select/deselect. Selected:{" "}
                          {formData.targetIds.length} {formData.scope}(s)
                        </small>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="form-column">
                  {/* Date Range */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <Calendar size={14} />
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          handleChange("startDate", e.target.value)
                        }
                        className={errors.startDate ? "input-error" : ""}
                      />
                      {errors.startDate && (
                        <div className="error-message">
                          <AlertCircle size={12} />
                          <span>{errors.startDate}</span>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>
                        <Calendar size={14} />
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          handleChange("endDate", e.target.value)
                        }
                        min={formData.startDate}
                        className={errors.endDate ? "input-error" : ""}
                      />
                      {errors.endDate && (
                        <div className="error-message">
                          <AlertCircle size={12} />
                          <span>{errors.endDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Usage Limit */}
                  <div className="form-group">
                    <label>Usage Limit</label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) =>
                        handleChange("usageLimit", e.target.value)
                      }
                      placeholder="Leave empty for unlimited"
                      min="1"
                      className={errors.usageLimit ? "input-error" : ""}
                    />
                    {errors.usageLimit && (
                      <div className="error-message">
                        <AlertCircle size={12} />
                        <span>{errors.usageLimit}</span>
                      </div>
                    )}
                    <small className="input-hint">
                      Maximum number of times this promo can be used. Leave
                      empty for unlimited.
                    </small>
                  </div>

                  {/* Minimum Purchase */}
                  <div className="form-group">
                    <label>Minimum Purchase (₱)</label>
                    <div className="input-with-icon">
                      <DollarSign size={14} className="input-icon" />
                      <input
                        type="number"
                        value={formData.minPurchase}
                        onChange={(e) =>
                          handleChange("minPurchase", e.target.value)
                        }
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className={errors.minPurchase ? "input-error" : ""}
                      />
                    </div>
                    {errors.minPurchase && (
                      <div className="error-message">
                        <AlertCircle size={12} />
                        <span>{errors.minPurchase}</span>
                      </div>
                    )}
                    <small className="input-hint">
                      Minimum cart total required to use this promo. Set to 0
                      for no minimum.
                    </small>
                  </div>

                  {/* Active Status */}
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) =>
                          handleChange("active", e.target.checked)
                        }
                      />
                      <span className="checkmark"></span>
                      <span className="checkbox-text">Active</span>
                    </label>
                    <small className="input-hint">
                      Inactive promos won't be available for customers to use
                    </small>
                  </div>
                </div>
              </div>
              
              {/* Submit button inside scrollable content */}
              <div className="promo-modal-footer" style={{ 
                marginTop: "20px", 
                paddingTop: "20px", 
                borderTop: "1px solid #e2e8f0",
                background: "transparent" 
              }}>
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{isSubmitting ? "Saving..." : isEditMode ? "Update Promo" : "Create Promo"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromoModal;