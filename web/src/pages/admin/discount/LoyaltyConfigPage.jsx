// src/pages/admin/loyalty/LoyaltyConfigPage.jsx
import React, { useState, useEffect } from "react";
import {
  Save,
  Settings,
  Gift,
  DollarSign,
  Percent,
  Award,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  TrendingUp,
  Coins,
} from "lucide-react";
import "../../../styles/admin/discount/LoyaltyConfigPageStyle.css";
import Loader from "../../../components/common/LoaderComponent";
import {
  getLoyaltyConfig,
  updateLoyaltyConfig,
  resetLoyaltyPoints,
  updateLoyaltyProgramStatus,
} from "../../../services/loyaltyConfigService";

const LoyaltyConfigPage = () => {
  const [config, setConfig] = useState({
    pointsToCurrencyRate: 100, // Points per ₱1
    maxRedeemPercent: 20, // Maximum % of order that can be paid with points
    earnRate: 1, // Points per peso spent
    enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [touched, setTouched] = useState({});
  const [resetButton, setResetButton] = useState(true);

  // Fetch config on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getLoyaltyConfig();
      if (data) {
        setConfig(data);
        setLastUpdated(data.updatedAt);
      }
    } catch (error) {
      console.error("Failed to fetch loyalty config:", error);
    } finally {
      setLoading(false);
    }
  };

  // Validation rules
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "pointsToCurrencyRate":
        if (!value || isNaN(value)) error = "Points rate is required";
        else if (parseFloat(value) <= 0)
          error = "Points rate must be greater than 0";
        else if (parseFloat(value) > 1000) error = "Points rate is too high";
        break;

      case "maxRedeemPercent":
        if (!value && value !== 0) error = "Maximum redeem percent is required";
        else if (isNaN(value)) error = "Percent must be a number";
        else if (parseFloat(value) < 0) error = "Percent cannot be negative";
        else if (parseFloat(value) > 100) error = "Percent cannot exceed 100%";
        break;

      case "earnRate":
        if (!value || isNaN(value)) error = "Earn rate is required";
        else if (parseFloat(value) <= 0)
          error = "Earn rate must be greater than 0";
        else if (parseFloat(value) > 10) error = "Earn rate is too high";
        break;

      default:
        break;
    }

    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    newErrors.pointsToCurrencyRate = validateField(
      "pointsToCurrencyRate",
      config.pointsToCurrencyRate,
    );
    newErrors.maxRedeemPercent = validateField(
      "maxRedeemPercent",
      config.maxRedeemPercent,
    );
    newErrors.earnRate = validateField("earnRate", config.earnRate);
    return newErrors;
  };

  const handleInputChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));

    // Validate on change if field has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleToggle = async (field) => {
    try {
      setConfig((prev) => ({ ...prev, [field]: !prev[field] }));
      await updateLoyaltyProgramStatus(!config.enabled);
    } catch (error) {
      setConfig((prev) => ({ ...prev, [field]: !prev[field] }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, config[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSave = async () => {
    // Mark all fields as touched
    const fields = ["pointsToCurrencyRate", "maxRedeemPercent", "earnRate"];
    const newTouched = {};
    fields.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    // Validate form
    const formErrors = validateForm();
    setErrors(formErrors);

    // Check if there are any errors
    const hasErrors = Object.values(formErrors).some((error) => error);
    if (hasErrors) {
      // Scroll to first error
      const firstError = Object.keys(formErrors).find(
        (field) => formErrors[field],
      );
      if (firstError) {
        const element = document.querySelector(`[data-field="${firstError}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    setSaving(true);

    try {
      const updatedConfig = await updateLoyaltyConfig(config);
      setConfig(updatedConfig);
      setLastUpdated(updatedConfig.updatedAt);

      // Show success message (you can replace with a toast)
      alert("Loyalty configuration saved successfully!");
    } catch (error) {
      console.error("Failed to save config:", error);
      setErrors((prev) => ({
        ...prev,
        _form:
          error.message || "Failed to save configuration. Please try again.",
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleResetClick = () => {
    setShowResetModal(true);
  };

  const handleConfirmReset = async (confirm) => {
    try {
      await resetLoyaltyPoints();
      setShowResetModal(false);
      setResetButton(!resetButton);
      alert("All customer loyalty points have been reset to 0.");
    } catch (error) {
      console.error("Failed to reset points:", error);
      alert("Failed to reset loyalty points. Please try again.");
    }
  };

  // Calculate example values for better understanding (in PHP)
  const calculateExamples = () => {
    const pointsRate = parseFloat(config.pointsToCurrencyRate) || 100; // Points per ₱1
    const earnRate = parseFloat(config.earnRate) || 1; // Points per peso spent
    const maxPercent = parseFloat(config.maxRedeemPercent) || 20; // % of order

    const examplePurchase = 1000; // ₱1000 purchase
    const pointsEarned = examplePurchase * earnRate;
    const pointValue = 1 / pointsRate; // Value of 1 point in pesos (₱)
    const maxRedeemValue = (examplePurchase * maxPercent) / 100;
    const pointsNeededForMax = maxRedeemValue / pointValue;

    return {
      examplePurchase,
      pointsEarned,
      pointValue,
      maxRedeemValue,
      pointsNeededForMax,
    };
  };

  const examples = calculateExamples();

  if (loading) {
    return (
      <div className="loyalty-config-container">
        <div className="loading-container">
          <Loader variant="page" />
        </div>
      </div>
    );
  }

  return (
    <div className="loyalty-config-container">
      {/* Header */}
      <header className="loyalty-header">
        <div className="header-content">
          <div className="header-icon">
            <Award size={32} />
          </div>
          <div>
            <h1 className="loyalty-title">Loyalty Program Configuration</h1>
            <p className="loyalty-subtitle">
              Configure how customers earn and redeem loyalty points (in PHP ₱)
            </p>
          </div>
        </div>
        {lastUpdated && (
          <div className="last-updated">
            <span>Last updated: {new Date(lastUpdated).toLocaleString()}</span>
          </div>
        )}
      </header>

      <div className="config-content">
        {/* Left Column: Configuration */}
        <div className="config-column">
          {/* Status Toggle */}
          <div className="config-card">
            <div className="card-header">
              <div className="card-title">
                <Settings size={20} />
                <h3>Program Status</h3>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={config.enabled}
                  onChange={() => handleToggle("enabled")}
                  className="toggle-input"
                />
                <label htmlFor="enabled" className="toggle-label">
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">
                    {config.enabled ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>
            </div>
            <div className="card-body">
              <p className="card-description">
                When inactive, customers cannot earn or redeem loyalty points.
                Existing points will be preserved.
              </p>
            </div>
          </div>

          {/* Points Settings */}
          <div className="config-card">
            <div className="card-header">
              <div className="card-title">
                <Coins size={20} />
                <h3>Points Conversion (PHP)</h3>
              </div>
            </div>
            <div className="card-body">
              {/* Points to Currency Rate */}
              <div className="form-group" data-field="pointsToCurrencyRate">
                <label>
                  <Coins size={16} />
                  Points to Peso Rate *
                </label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    value={config.pointsToCurrencyRate}
                    onChange={(e) =>
                      handleInputChange("pointsToCurrencyRate", e.target.value)
                    }
                    onBlur={() => handleBlur("pointsToCurrencyRate")}
                    step="1"
                    min="1"
                    max="1000"
                    className={errors.pointsToCurrencyRate ? "input-error" : ""}
                    disabled={!config.enabled}
                  />
                  <span className="input-suffix">points = ₱1.00</span>
                </div>
                {errors.pointsToCurrencyRate && (
                  <div className="error-message">
                    <AlertCircle size={12} />
                    <span>{errors.pointsToCurrencyRate}</span>
                  </div>
                )}
                <div className="input-hint">
                  How many loyalty points equal ₱1.00 in discount
                </div>
              </div>

              {/* Maximum Redeem Percent */}
              <div className="form-group" data-field="maxRedeemPercent">
                <label>
                  <Percent size={16} />
                  Maximum Redeem Percent *
                </label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    value={config.maxRedeemPercent}
                    onChange={(e) =>
                      handleInputChange("maxRedeemPercent", e.target.value)
                    }
                    onBlur={() => handleBlur("maxRedeemPercent")}
                    step="1"
                    min="0"
                    max="100"
                    className={errors.maxRedeemPercent ? "input-error" : ""}
                    disabled={!config.enabled}
                  />
                  <span className="input-suffix">% of order total</span>
                </div>
                {errors.maxRedeemPercent && (
                  <div className="error-message">
                    <AlertCircle size={12} />
                    <span>{errors.maxRedeemPercent}</span>
                  </div>
                )}
                <div className="input-hint">
                  Maximum percentage of order total that can be paid with points
                </div>
              </div>

              {/* Earn Rate */}
              <div className="form-group" data-field="earnRate">
                <label>
                  <TrendingUp size={16} />
                  Points Earn Rate *
                </label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    value={config.earnRate}
                    onChange={(e) =>
                      handleInputChange("earnRate", e.target.value)
                    }
                    onBlur={() => handleBlur("earnRate")}
                    step="0.1"
                    min="0.1"
                    max="10"
                    className={errors.earnRate ? "input-error" : ""}
                    disabled={!config.enabled}
                  />
                  <span className="input-suffix">points per ₱1 spent</span>
                </div>
                {errors.earnRate && (
                  <div className="error-message">
                    <AlertCircle size={12} />
                    <span>{errors.earnRate}</span>
                  </div>
                )}
                <div className="input-hint">
                  How many points customers earn for each ₱1.00 spent
                </div>
              </div>
            </div>
          </div>

          {/* Reset Points Card */}
          <div className="config-card danger-card">
            <div className="card-header">
              <div className="card-title">
                <RefreshCw size={20} />
                <h3>Reset All Points</h3>
              </div>
            </div>
            <div className="card-body">
              <p className="warning-text">
                <Shield size={16} />
                This action will reset ALL customer loyalty points to 0. This
                cannot be undone and should only be used when migrating to a new
                points system or starting fresh.
              </p>
              <button
                className="btn-reset"
                onClick={handleResetClick}
                disabled={!config.enabled}
              >
                <RefreshCw size={16} />
                <span>Reset All Points</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Examples */}
        <div className="preview-column">
          {/* Program Preview */}
          <div className="preview-card">
            <div className="card-header">
              <div className="card-title">
                <Award size={20} />
                <h3>Program Preview (PHP)</h3>
              </div>
              <div
                className={`program-status ${config.enabled ? "active" : "inactive"}`}
              >
                {config.enabled ? (
                  <>
                    <CheckCircle size={14} />
                    <span>Active</span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} />
                    <span>Inactive</span>
                  </>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="preview-grid">
                <div className="preview-item">
                  <div className="preview-label">Points Value</div>
                  <div className="preview-value">
                    1 point = ₱
                    {(1 / (config.pointsToCurrencyRate || 100)).toFixed(4)}
                  </div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">Earn Rate</div>
                  <div className="preview-value">
                    {config.earnRate || 1} point
                    {config.earnRate !== 1 ? "s" : ""} per ₱1
                  </div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">Max Redemption</div>
                  <div className="preview-value">
                    {config.maxRedeemPercent || 20}% of order
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Example Calculations */}
          <div className="example-card">
            <div className="card-header">
              <div className="card-title">
                <Coins size={20} />
                <h3>Example Calculations (PHP)</h3>
              </div>
            </div>
            <div className="card-body">
              <div className="example-scenario">
                <h4>Scenario: Customer spends ₱{examples.examplePurchase}</h4>
                <div className="example-details">
                  <div className="example-row">
                    <span className="example-label">Points earned:</span>
                    <span className="example-value">
                      {examples.pointsEarned.toFixed(0)} points
                    </span>
                  </div>
                  <div className="example-row">
                    <span className="example-label">Value per point:</span>
                    <span className="example-value">
                      ₱{examples.pointValue.toFixed(4)}
                    </span>
                  </div>
                  <div className="example-row">
                    <span className="example-label">
                      Max points redeemable:
                    </span>
                    <span className="example-value">
                      {examples.pointsNeededForMax.toFixed(0)} points
                      <span className="example-note">
                        (worth ₱{examples.maxRedeemValue.toFixed(2)})
                      </span>
                    </span>
                  </div>
                  <div className="example-row">
                    <span className="example-label">Customer pays:</span>
                    <span className="example-value">
                      ₱
                      {(
                        examples.examplePurchase - examples.maxRedeemValue
                      ).toFixed(2)}
                      <span className="example-note">
                        + {examples.pointsNeededForMax.toFixed(0)} points
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="notes-section">
                <h4>Important Notes:</h4>
                <ul className="notes-list">
                  <li>
                    <CheckCircle size={12} />
                    Points are awarded after payment is confirmed
                  </li>
                  <li>
                    <CheckCircle size={12} />
                    Points never expire (unless program is discontinued)
                  </li>
                  <li>
                    <CheckCircle size={12} />
                    Points cannot be transferred between accounts
                  </li>
                  <li>
                    <CheckCircle size={12} />
                    Returns will deduct earned points proportionally
                  </li>
                  <li>
                    <CheckCircle size={12} />
                    Points are based on PHP (₱) currency
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="summary-card">
            <div className="summary-header">
              <h3>Configuration Summary (PHP)</h3>
            </div>
            <div className="summary-body">
              <p>
                With these settings, customers earn{" "}
                <strong>
                  {config.earnRate} point{config.earnRate !== 1 ? "s" : ""}
                </strong>{" "}
                for every ₱1 spent. Each point is worth{" "}
                <strong>
                  ₱{(1 / (config.pointsToCurrencyRate || 100)).toFixed(4)}
                </strong>
                . They can redeem points for up to{" "}
                <strong>{config.maxRedeemPercent}%</strong> of their order
                total.
              </p>
              <div className="conversion-examples">
                <h4>Quick Examples:</h4>
                <div className="conversion-grid">
                  <div className="conversion-item">
                    <span className="conversion-label">₱100 purchase:</span>
                    <span className="conversion-value">
                      Earns {config.earnRate * 100} points
                    </span>
                  </div>
                  <div className="conversion-item">
                    <span className="conversion-label">₱500 purchase:</span>
                    <span className="conversion-value">
                      Earns {config.earnRate * 500} points
                    </span>
                  </div>
                  <div className="conversion-item">
                    <span className="conversion-label">
                      {config.pointsToCurrencyRate} points:
                    </span>
                    <span className="conversion-value">
                      Worth ₱1.00 discount
                    </span>
                  </div>
                  <div className="conversion-item">
                    <span className="conversion-label">
                      {config.pointsToCurrencyRate * 10} points:
                    </span>
                    <span className="conversion-value">
                      Worth ₱10.00 discount
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="config-footer">
        <div className="footer-actions">
          <button
            className="btn-secondary"
            onClick={fetchConfig}
            disabled={saving}
          >
            <RefreshCw size={16} />
            <span>Reload</span>
          </button>
          <div className="action-group">
            {errors._form && (
              <div className="form-error">
                <AlertCircle size={14} />
                <span>{errors._form}</span>
              </div>
            )}
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || !config.enabled}
            >
              {saving ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <div className="modal-icon danger">
                <AlertCircle size={24} />
              </div>
              <h3>Reset All Loyalty Points</h3>
              <button
                className="modal-close"
                onClick={() => setShowResetModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="warning-message">
                <strong>Warning:</strong> This action will permanently reset ALL
                customer loyalty points to 0. This includes all customers,
                regardless of their current point balance.
              </p>
              <ul className="warning-list">
                <li>All points will be lost and cannot be recovered</li>
                <li>This action cannot be undone</li>
                <li>Customers will be notified of the reset</li>
                <li>Consider exporting point data before proceeding</li>
              </ul>
              <div className="confirmation-input">
                <label>
                  Type <strong>RESET POINTS</strong> to confirm:
                </label>
                <input
                  type="text"
                  id="confirmationText"
                  placeholder="RESET POINTS"
                  className="confirmation-input-field"
                  onChange={(e) =>
                    setResetButton(
                      e.target.value === "RESET POINTS" ? !resetButton : true,
                    )
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleConfirmReset}
                disabled={resetButton}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyConfigPage;
