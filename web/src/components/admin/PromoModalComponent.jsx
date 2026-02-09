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
import "../../styles/admin/discount/PromoModalStyle.css"
const PromoModal = ({ isOpen, onClose, onSave, data, mode }) => {
  const isEditMode = mode === "edit";

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
  const [touched, setTouched] = useState({});

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && data) {
        setFormData({
          promoName: { promo: data.promoName?.promo || "" },
          code: data.code || "",
          promoType: data.promoType || "percentage",
          value: data.value || "",
          scope: data.scope || "cart",
          targetIds: data.targetIds || [],
          minPurchase: data.minPurchase || "",
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : "",
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : "",
          usageLimit: data.usageLimit || "",
          active: data.active ?? true,
        });
      } else {
        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthStr = nextMonth.toISOString().split('T')[0];

        setFormData({
          promoName: { promo: "" },
          code: "",
          promoType: "percentage",
          value: "",
          scope: "cart",
          targetIds: [],
          minPurchase: "",
          startDate: today,
          endDate: nextMonthStr,
          usageLimit: "",
          active: true,
        });
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, data, isEditMode]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};

    // Promo name validation
    if (!formData.promoName.promo.trim()) {
      newErrors.promoName = "Promo name is required";
    } else if (formData.promoName.promo.length < 3) {
      newErrors.promoName = "Promo name must be at least 3 characters";
    }

    // Code validation
    if (!formData.code.trim()) {
      newErrors.code = "Promo code is required";
    } else if (!/^[A-Z0-9-_]+$/i.test(formData.code)) {
      newErrors.code = "Code can only contain letters, numbers, hyphens and underscores";
    }

    // Value validation
    if (!formData.value || isNaN(formData.value)) {
      newErrors.value = "Value is required";
    } else if (formData.promoType === "percentage" && (formData.value < 1 || formData.value > 100)) {
      newErrors.value = "Percentage must be between 1 and 100";
    } else if (formData.promoType === "fixed" && formData.value <= 0) {
      newErrors.value = "Fixed amount must be greater than 0";
    }

    // Date validation
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    } else if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    // Usage limit validation
    if (formData.usageLimit && (isNaN(formData.usageLimit) || formData.usageLimit < 1)) {
      newErrors.usageLimit = "Usage limit must be a positive number";
    }

    // Min purchase validation
    if (formData.minPurchase && (isNaN(formData.minPurchase) || formData.minPurchase < 0)) {
      newErrors.minPurchase = "Minimum purchase must be 0 or greater";
    }

    return newErrors;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
    
    if (errors[parent]) {
      setErrors((prev) => ({ ...prev, [parent]: "" }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateForm()[field];
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      // Scroll to first error
      const firstError = Object.keys(formErrors)[0];
      const element = document.querySelector(`[data-field="${firstError}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Format data for API
      const saveData = {
        ...formData,
        value: parseFloat(formData.value),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      };

      await onSave(saveData);
      onClose();
    } catch (error) {
      console.error("Failed to save promo:", error);
      setErrors((prev) => ({
        ...prev,
        _form: error.message || "Failed to save promo. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "PROMO-";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange("code", code);
  };

  const getTitle = () => {
    return isEditMode ? "Edit Promo" : "Create New Promo";
  };

  const getButtonText = () => {
    return isSubmitting ? "Saving..." : (isEditMode ? "Update Promo" : "Create Promo");
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="promo-modal-overlay" onClick={handleOverlayClick}>
      <div className="promo-modal-container" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <header className="promo-modal-header">
            <div className="header-title">
              <div className="icon-circle">
                <Gift size={20} />
              </div>
              <div>
                <h2>{getTitle()}</h2>
                <p className="subtitle">
                  {isEditMode ? "Update promo details" : "Create a new promotional offer"}
                </p>
              </div>
            </div>
            <button type="button" className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </header>

          {/* Body */}
          <div className="promo-modal-body">
            <div className="form-columns">
              {/* Left Column */}
              <div className="form-column">
                {/* Promo Name */}
                <div className="form-group" data-field="promoName">
                  <label>
                    <Tag size={14} />
                    Promo Name *
                  </label>
                  <input
                    type="text"
                    value={formData.promoName.promo}
                    onChange={(e) => handleNestedChange("promoName", "promo", e.target.value)}
                    onBlur={() => handleBlur("promoName")}
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
                <div className="form-group" data-field="code">
                  <label>
                    <Tag size={14} />
                    Promo Code *
                  </label>
                  <div className="code-input-group">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleInputChange("code", e.target.value)}
                      onBlur={() => handleBlur("code")}
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
                  <div className="form-group" data-field="promoType">
                    <label>Promo Type *</label>
                    <div className="type-toggle">
                      <button
                        type="button"
                        className={`type-option ${formData.promoType === "percentage" ? "active" : ""}`}
                        onClick={() => handleInputChange("promoType", "percentage")}
                      >
                        <Percent size={16} />
                        <span>Percentage</span>
                      </button>
                      <button
                        type="button"
                        className={`type-option ${formData.promoType === "fixed" ? "active" : ""}`}
                        onClick={() => handleInputChange("promoType", "fixed")}
                      >
                        <DollarSign size={16} />
                        <span>Fixed Amount</span>
                      </button>
                    </div>
                  </div>

                  <div className="form-group" data-field="value">
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
                        onChange={(e) => handleInputChange("value", e.target.value)}
                        onBlur={() => handleBlur("value")}
                        placeholder={formData.promoType === "percentage" ? "10" : "5.00"}
                        step={formData.promoType === "percentage" ? "1" : "0.01"}
                        min="0"
                        max={formData.promoType === "percentage" ? "100" : undefined}
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
                <div className="form-group" data-field="scope">
                  <label>Scope *</label>
                  <div className="scope-toggle">
                    <button
                      type="button"
                      className={`scope-option ${formData.scope === "cart" ? "active" : ""}`}
                      onClick={() => handleInputChange("scope", "cart")}
                    >
                      <ShoppingCart size={16} />
                      <span>Cart</span>
                    </button>
                    <button
                      type="button"
                      className={`scope-option ${formData.scope === "category" ? "active" : ""}`}
                      onClick={() => handleInputChange("scope", "category")}
                    >
                      <Package size={16} />
                      <span>Category</span>
                    </button>
                    <button
                      type="button"
                      className={`scope-option ${formData.scope === "product" ? "active" : ""}`}
                      onClick={() => handleInputChange("scope", "product")}
                    >
                      <Gift size={16} />
                      <span>Product</span>
                    </button>
                  </div>
                </div>

                {/* Target IDs (if scope is category or product) */}
                {(formData.scope === "category" || formData.scope === "product") && (
                  <div className="form-group">
                    <label>
                      Target {formData.scope === "category" ? "Categories" : "Products"}
                    </label>
                    <div className="target-ids-input">
                      <input
                        type="text"
                        placeholder={`Enter ${formData.scope} IDs separated by commas`}
                        onChange={(e) => {
                          const ids = e.target.value
                            .split(",")
                            .map(id => id.trim())
                            .filter(id => id);
                          handleInputChange("targetIds", ids);
                        }}
                      />
                      <small className="input-hint">
                        Enter valid MongoDB ObjectIDs separated by commas
                      </small>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="form-column">
                {/* Date Range */}
                <div className="form-row">
                  <div className="form-group" data-field="startDate">
                    <label>
                      <Calendar size={14} />
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      onBlur={() => handleBlur("startDate")}
                      className={errors.startDate ? "input-error" : ""}
                    />
                    {errors.startDate && (
                      <div className="error-message">
                        <AlertCircle size={12} />
                        <span>{errors.startDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group" data-field="endDate">
                    <label>
                      <Calendar size={14} />
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                      onBlur={() => handleBlur("endDate")}
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
                <div className="form-group" data-field="usageLimit">
                  <label>Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => handleInputChange("usageLimit", e.target.value)}
                    onBlur={() => handleBlur("usageLimit")}
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
                    Maximum number of times this promo can be used. Leave empty for unlimited.
                  </small>
                </div>

                {/* Minimum Purchase */}
                <div className="form-group" data-field="minPurchase">
                  <label>Minimum Purchase ($)</label>
                  <div className="input-with-icon">
                    <DollarSign size={14} className="input-icon" />
                    <input
                      type="number"
                      value={formData.minPurchase}
                      onChange={(e) => handleInputChange("minPurchase", e.target.value)}
                      onBlur={() => handleBlur("minPurchase")}
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
                    Minimum cart total required to use this promo. Set to 0 for no minimum.
                  </small>
                </div>

                {/* Active Status */}
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => handleInputChange("active", e.target.checked)}
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

            {/* Form level error */}
            {errors._form && (
              <div className="form-error">
                <AlertCircle size={14} />
                <span>{errors._form}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="promo-modal-footer">
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
                  <span>{getButtonText()}</span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default PromoModal;