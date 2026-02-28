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
  Info,
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
    pointsToCurrencyRate: 1, // Default: 1 point = 1 Peso
    maxRedeemPercent: 20,
    earnRate: 1,
    enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [touched, setTouched] = useState({});
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

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
      // Fallback or alert handled by UI state
    } finally {
      setLoading(false);
    }
  };

  // Validation rules
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "pointsToCurrencyRate":
        if (!value && value !== 0) error = "Point value is required";
        else if (isNaN(value)) error = "Value must be a number";
        else if (parseFloat(value) <= 0)
          error = "Value must be greater than 0";
        else if (parseFloat(value) > 1000) error = "Value is unusually high";
        break;

      case "maxRedeemPercent":
        if (value === "" || value === null) error = "Maximum redeem percent is required";
        else if (isNaN(value)) error = "Percent must be a number";
        else if (parseFloat(value) < 0) error = "Percent cannot be negative";
        else if (parseFloat(value) > 100) error = "Percent cannot exceed 100%";
        break;

      case "earnRate":
        if (!value && value !== 0) error = "Earn rate is required";
        else if (isNaN(value)) error = "Earn rate must be a number";
        else if (parseFloat(value) <= 0)
          error = "Earn rate must be greater than 0";
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
      config.pointsToCurrencyRate
    );
    newErrors.maxRedeemPercent = validateField(
      "maxRedeemPercent",
      config.maxRedeemPercent
    );
    newErrors.earnRate = validateField("earnRate", config.earnRate);
    return newErrors;
  };

  const handleInputChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleToggle = async (field) => {
    const newStatus = !config[field];
    
    setUpdatingStatus(true);
    try {
      // Call API to update status first
      await updateLoyaltyProgramStatus(newStatus);
      
      // Then update UI
      setConfig((prev) => ({ ...prev, [field]: newStatus }));
      
      // alert(`Loyalty program ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error("Failed to update program status:", error);
      alert("Failed to update program status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, config[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSave = async () => {
    const fields = ["pointsToCurrencyRate", "maxRedeemPercent", "earnRate"];
    const newTouched = {};
    fields.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    const formErrors = validateForm();
    setErrors(formErrors);

    const hasErrors = Object.values(formErrors).some((error) => error);
    if (hasErrors) {
      const firstError = Object.keys(formErrors).find(
        (field) => formErrors[field]
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
      const updatedConfig = await updateLoyaltyConfig({
        pointsToCurrencyRate: parseFloat(config.pointsToCurrencyRate),
        maxRedeemPercent: parseFloat(config.maxRedeemPercent),
        earnRate: parseFloat(config.earnRate),
        enabled: config.enabled,
      });
      
      setConfig(updatedConfig);
      setLastUpdated(updatedConfig.updatedAt);
      alert("Loyalty configuration saved successfully!");
    } catch (error) {
      console.error("Failed to save config:", error);
      alert(error.message || "Failed to save configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetClick = () => {
    setShowResetModal(true);
    setResetConfirmation("");
    setResetSuccess(false);
  };

  const handleConfirmReset = async () => {
    if (resetConfirmation !== "RESET POINTS") {
      alert("Please type 'RESET POINTS' to confirm");
      return;
    }

    setIsResetting(true);
    try {
      await resetLoyaltyPoints();
      setResetSuccess(true);
      // alert("All customer loyalty points have been reset to 0.");
      
      // Close modal after short delay to show success state
      setTimeout(() => {
        setShowResetModal(false);
        setResetConfirmation("");
        setResetSuccess(false);
        // Refresh config to get updated data
        fetchConfig();
      }, 1500);
    } catch (error) {
      console.error("Failed to reset points:", error);
      alert("Failed to reset loyalty points. Please try again.");
      setIsResetting(false);
    }
  };

  const calculateExamples = () => {
    // Mobile logic: pointsDiscount = points * pointsToCurrencyRate
    // So pointsToCurrencyRate is "Value per Point"
    const valuePerPoint = parseFloat(config.pointsToCurrencyRate) || 0;
    const earnRate = parseFloat(config.earnRate) || 0;
    const maxPercent = parseFloat(config.maxRedeemPercent) || 0;

    const examplePurchase = 1000;
    const pointsEarned = examplePurchase * earnRate;
    const maxRedeemValue = (examplePurchase * maxPercent) / 100;
    
    // How many points needed to get maxRedeemValue?
    // maxRedeemValue = pointsNeeded * valuePerPoint
    // pointsNeeded = maxRedeemValue / valuePerPoint
    const pointsNeededForMax = valuePerPoint > 0 ? maxRedeemValue / valuePerPoint : 0;

    return {
      examplePurchase,
      pointsEarned,
      valuePerPoint,
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
              Configure earning rates and redemption values for customer loyalty points
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
                  disabled={updatingStatus}
                />
                <label htmlFor="enabled" className="toggle-label">
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">
                    {updatingStatus ? "Updating..." : (config.enabled ? "Active" : "Inactive")}
                  </span>
                </label>
              </div>
            </div>
            <div className="card-body">
              <p className="card-description">
                Enable or disable the loyalty program. When inactive, customers cannot earn or redeem points, but their balances are preserved.
              </p>
            </div>
          </div>

          {/* Points Settings */}
          <div className="config-card">
            <div className="card-header">
              <div className="card-title">
                <Coins size={20} />
                <h3>Points Value & Earning</h3>
              </div>
            </div>
            <div className="card-body">
              {/* Points Value */}
              <div className="form-group" data-field="pointsToCurrencyRate">
                <label>
                  <DollarSign size={16} />
                  Point Value (₱) *
                </label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    value={config.pointsToCurrencyRate}
                    onChange={(e) =>
                      handleInputChange("pointsToCurrencyRate", e.target.value)
                    }
                    onBlur={() => handleBlur("pointsToCurrencyRate")}
                    step="0.01"
                    min="0.01"
                    className={errors.pointsToCurrencyRate ? "input-error" : ""}
                    disabled={!config.enabled}
                  />
                  <span className="input-suffix">Peso value per 1 point</span>
                </div>
                {errors.pointsToCurrencyRate && (
                  <div className="error-message">
                    <AlertCircle size={12} />
                    <span>{errors.pointsToCurrencyRate}</span>
                  </div>
                )}
                <div className="input-hint">
                  <Info size={12} />
                  Example: Enter <strong>1.00</strong> for 1 Point = ₱1.00. Enter <strong>0.01</strong> for 1 Point = ₱0.01.
                </div>
              </div>

              {/* Earn Rate */}
              <div className="form-group" data-field="earnRate">
                <label>
                  <TrendingUp size={16} />
                  Earning Rate *
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
                  How many points a customer earns for every Peso spent.
                </div>
              </div>

              {/* Maximum Redeem Percent */}
              <div className="form-group" data-field="maxRedeemPercent">
                <label>
                  <Percent size={16} />
                  Max Redemption Limit *
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
                  The maximum percentage of an order that can be paid using points.
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
                This action will reset <strong>ALL</strong> customer loyalty points to 0. This cannot be undone.
              </p>
              <button
                className="btn-reset"
                onClick={handleResetClick}
                disabled={isResetting || !config.enabled}
              >
                <RefreshCw size={16} className={isResetting ? "spin" : ""} />
                <span>{isResetting ? "Resetting..." : "Reset All Points"}</span>
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
                <h3>Program Preview</h3>
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
                  <div className="preview-label">1 Point Value</div>
                  <div className="preview-value">
                    ₱{parseFloat(config.pointsToCurrencyRate || 0).toFixed(2)}
                  </div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">Earning</div>
                  <div className="preview-value">
                    {config.earnRate || 0} pts / ₱1
                  </div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">Max Usage</div>
                  <div className="preview-value">
                    {config.maxRedeemPercent || 0}% of total
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
                <h3>Example Scenario</h3>
              </div>
            </div>
            <div className="card-body">
              <div className="example-scenario">
                <h4>Customer spends ₱{examples.examplePurchase.toLocaleString()}</h4>
                <div className="example-details">
                  <div className="example-row">
                    <span className="example-label">Points earned:</span>
                    <span className="example-value">
                      +{examples.pointsEarned.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="example-row">
                    <span className="example-label">Points value:</span>
                    <span className="example-value">
                      ₱{(examples.pointsEarned * examples.valuePerPoint).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="divider"></div>

                <h4>Redeeming on ₱{examples.examplePurchase.toLocaleString()} Order</h4>
                 <div className="example-details">
                  <div className="example-row">
                    <span className="example-label">Max redeemable ({(config.maxRedeemPercent || 0)}%):</span>
                    <span className="example-value">
                      -₱{examples.maxRedeemValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="example-row">
                    <span className="example-label">Points needed:</span>
                    <span className="example-value">
                      {examples.pointsNeededForMax.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              </div>

              <div className="notes-section">
                <h4>Rules & Notes:</h4>
                <ul className="notes-list">
                  <li>
                    <CheckCircle size={12} />
                    Points are awarded based on the final paid amount.
                  </li>
                  <li>
                    <CheckCircle size={12} />
                    Points value is fixed at ₱{parseFloat(config.pointsToCurrencyRate || 0).toFixed(2)} per point.
                  </li>
                  <li>
                    <CheckCircle size={12} />
                    Redemption is capped at {config.maxRedeemPercent}% of the order subtotal.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="summary-card">
            <div className="summary-header">
              <h3>Configuration Summary</h3>
            </div>
            <div className="summary-body">
              <p>
                Customers earn <strong>{config.earnRate} points</strong> for every ₱1 spent. 
                Each point is worth <strong>₱{parseFloat(config.pointsToCurrencyRate || 0).toFixed(2)}</strong>.
              </p>
              <div className="conversion-examples">
                <h4>Quick Look:</h4>
                <div className="conversion-grid">
                  <div className="conversion-item">
                    <span className="conversion-label">100 Points =</span>
                    <span className="conversion-value">
                      ₱{(100 * (parseFloat(config.pointsToCurrencyRate) || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="conversion-item">
                    <span className="conversion-label">500 Points =</span>
                    <span className="conversion-value">
                      ₱{(500 * (parseFloat(config.pointsToCurrencyRate) || 0)).toFixed(2)}
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
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Reload</span>
          </button>
          <div className="action-group">
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || !config.enabled}
            >
              {saving ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>Saving...</span>
                </>
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
                onClick={() => !isResetting && setShowResetModal(false)}
                disabled={isResetting}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="warning-message">
                <strong>Warning:</strong> This action will permanently reset ALL
                customer loyalty points to 0.
              </p>
              <ul className="warning-list">
                <li>All points will be lost immediately.</li>
                <li>This action cannot be undone.</li>
              </ul>
              <div className="confirmation-input">
                <label>
                  Type <strong>RESET POINTS</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  placeholder="RESET POINTS"
                  className="confirmation-input-field"
                  autoFocus
                  disabled={isResetting || resetSuccess}
                />
              </div>
              {resetSuccess && (
                <div className="success-message">
                  <CheckCircle size={16} />
                  <span>Points reset successfully!</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleConfirmReset}
                disabled={resetConfirmation !== "RESET POINTS" || isResetting || resetSuccess}
              >
                {isResetting ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span>Resetting...</span>
                  </>
                ) : resetSuccess ? (
                  <>
                    <CheckCircle size={16} />
                    <span>Done</span>
                  </>
                ) : (
                  "Confirm Reset"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .success-message {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #00A86B;
          margin-top: 12px;
          font-size: 14px;
          font-weight: 500;
        }
        .divider {
            height: 1px;
            background-color: #f1f5f9;
            margin: 12px 0;
        }
      `}</style>
    </div>
  );
};

export default LoyaltyConfigPage;
