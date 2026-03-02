import React, { useState, useEffect } from "react";
import {
  Settings,
  Store,
  Clock,
  Receipt,
  DollarSign,
  Save,
  Info,
} from "lucide-react";
import Toast from "../../components/common/SnackbarComponent";
import {
  getSettings,
  updateSettings,
  updateBusinessHours,
  updateReceiptSettings,
  updateTaxSettings,
} from "../../services/settingsService";
import "../../styles/admin/SettingsPageStyle.css";

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("store");
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      console.log("Settings Result:", data);
      setSettings(data);
    } catch (error) {
      showToast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleSaveStoreInfo = async () => {
    try {
      setSaving(true);
      await updateSettings({
        storeName: settings.storeName,
        tagline: settings.tagline,
        logo: settings.logo,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        taxId: settings.taxId,
        businessPermitNumber: settings.businessPermitNumber,
        currency: settings.currency,
      });
      showToast("Store information updated successfully");
      fetchSettings();
    } catch (error) {
      showToast("Failed to update store information", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusinessHours = async () => {
    try {
      setSaving(true);
      await updateBusinessHours(settings.businessHours);
      showToast("Business hours updated successfully");
      fetchSettings();
    } catch (error) {
      showToast("Failed to update business hours", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReceiptSettings = async () => {
    try {
      setSaving(true);
      await updateReceiptSettings({
        receiptHeader: settings.receiptHeader,
        receiptFooter: settings.receiptFooter,
        showTaxOnReceipt: settings.showTaxOnReceipt,
        receiptTemplate: settings.receiptTemplate,
      });
      showToast("Receipt settings updated successfully");
      fetchSettings();
    } catch (error) {
      showToast("Failed to update receipt settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTaxSettings = async () => {
    try {
      setSaving(true);
      await updateTaxSettings({
        taxRate: settings.taxRate,
        taxLabel: settings.taxLabel,
      });
      showToast("Tax settings updated successfully");
      fetchSettings();
    } catch (error) {
      showToast("Failed to update tax settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value, nested = null) => {
    if (nested) {
      setSettings((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [nested]: value,
        },
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleBusinessHourChange = (day, field, value) => {
    setSettings((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value,
        },
      },
    }));
  };

  if (loading || !settings) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "store", label: "Store Info", icon: Store },
    { id: "hours", label: "Business Hours", icon: Clock },
    { id: "receipt", label: "Receipt", icon: Receipt },
    { id: "tax", label: "Tax & Finance", icon: DollarSign },
  ];

  return (
    <div className="settings-page">
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />

      <div className="settings-header">
        <div className="settings-header-content">
          <Settings className="header-icon" size={32} />
          <div>
            <h1>Store Settings</h1>
            <p>Manage your store configuration and preferences</p>
          </div>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="settings-content">
          {/* STORE INFO TAB */}
          {activeTab === "store" && (
            <div className="settings-section">
              <div className="section-header">
                <Store size={24} />
                <div>
                  <h2>Store Information</h2>
                  <p>Basic details about your business</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Store Name</label>
                  <input
                    type="text"
                    value={settings.storeName || ""}
                    onChange={(e) =>
                      handleInputChange("storeName", e.target.value)
                    }
                    placeholder="Consoli Scan"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Tagline</label>
                  <input
                    type="text"
                    value={settings.tagline || ""}
                    onChange={(e) =>
                      handleInputChange("tagline", e.target.value)
                    }
                    placeholder="Smart Retail Solutions"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={settings.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={settings.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="info@consoliscan.com"
                  />
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={settings.website || ""}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    placeholder="https://consoliscan.com"
                  />
                </div>

                <div className="form-group">
                  <label>Currency</label>
                  <input
                    type="text"
                    value={settings.currency || "PHP"}
                    onChange={(e) =>
                      handleInputChange("currency", e.target.value)
                    }
                    placeholder="PHP"
                  />
                </div>

                <div className="form-group">
                  <label>Tax ID / TIN</label>
                  <input
                    type="text"
                    value={settings.taxId || ""}
                    onChange={(e) => handleInputChange("taxId", e.target.value)}
                    placeholder="XXX-XXX-XXX-XXX"
                  />
                </div>

                <div className="form-group">
                  <label>Business Permit Number</label>
                  <input
                    type="text"
                    value={settings.businessPermitNumber || ""}
                    onChange={(e) =>
                      handleInputChange("businessPermitNumber", e.target.value)
                    }
                    placeholder="BP-XXXX-XXXX"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={settings.address?.street || ""}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value, "street")
                    }
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={settings.address?.city || ""}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value, "city")
                    }
                    placeholder="Manila"
                  />
                </div>

                <div className="form-group">
                  <label>Province</label>
                  <input
                    type="text"
                    value={settings.address?.province || ""}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value, "province")
                    }
                    placeholder="Metro Manila"
                  />
                </div>

                <div className="form-group">
                  <label>Zip Code</label>
                  <input
                    type="text"
                    value={settings.address?.zipCode || ""}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value, "zipCode")
                    }
                    placeholder="1000"
                  />
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={settings.address?.country || "Philippines"}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value, "country")
                    }
                    placeholder="Philippines"
                  />
                </div>
              </div>

              <button
                className="save-button"
                onClick={handleSaveStoreInfo}
                disabled={saving}
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Store Information"}
              </button>
            </div>
          )}

          {/* BUSINESS HOURS TAB */}
          {activeTab === "hours" && (
            <div className="settings-section">
              <div className="section-header">
                <Clock size={24} />
                <div>
                  <h2>Business Hours</h2>
                  <p>Set your operating schedule</p>
                </div>
              </div>

              <div className="business-hours-grid">
                {[
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ].map((day) => (
                  <div key={day} className="day-row">
                    <div className="day-label">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </div>

                    <div className="day-controls">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={
                            settings.businessHours?.[day]?.closed || false
                          }
                          onChange={(e) =>
                            handleBusinessHourChange(
                              day,
                              "closed",
                              e.target.checked,
                            )
                          }
                        />
                        <span>Closed</span>
                      </label>

                      {!settings.businessHours?.[day]?.closed && (
                        <>
                          <input
                            type="time"
                            value={
                              settings.businessHours?.[day]?.open || "08:00"
                            }
                            onChange={(e) =>
                              handleBusinessHourChange(
                                day,
                                "open",
                                e.target.value,
                              )
                            }
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={
                              settings.businessHours?.[day]?.close || "20:00"
                            }
                            onChange={(e) =>
                              handleBusinessHourChange(
                                day,
                                "close",
                                e.target.value,
                              )
                            }
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="save-button"
                onClick={handleSaveBusinessHours}
                disabled={saving}
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Business Hours"}
              </button>
            </div>
          )}

          {/* RECEIPT TAB */}
          {activeTab === "receipt" && (
            <div className="settings-section">
              <div className="section-header">
                <Receipt size={24} />
                <div>
                  <h2>Receipt Settings</h2>
                  <p>Customize receipt appearance and content</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Receipt Header Message</label>
                  <textarea
                    value={settings.receiptHeader || ""}
                    onChange={(e) =>
                      handleInputChange("receiptHeader", e.target.value)
                    }
                    placeholder="Thank you for shopping with us!"
                    rows={3}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Receipt Footer Message</label>
                  <textarea
                    value={settings.receiptFooter || ""}
                    onChange={(e) =>
                      handleInputChange("receiptFooter", e.target.value)
                    }
                    placeholder="Please keep this receipt for your records."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Receipt Template</label>
                  <select
                    value={settings.receiptTemplate || "STANDARD"}
                    onChange={(e) =>
                      handleInputChange("receiptTemplate", e.target.value)
                    }
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="COMPACT">Compact</option>
                    <option value="DETAILED">Detailed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.showTaxOnReceipt || false}
                      onChange={(e) =>
                        handleInputChange("showTaxOnReceipt", e.target.checked)
                      }
                    />
                    <span>Show tax breakdown on receipt</span>
                  </label>
                </div>
              </div>

              <button
                className="save-button"
                onClick={handleSaveReceiptSettings}
                disabled={saving}
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Receipt Settings"}
              </button>
            </div>
          )}

          {/* TAX TAB */}
          {activeTab === "tax" && (
            <div className="settings-section">
              <div className="section-header">
                <DollarSign size={24} />
                <div>
                  <h2>Tax & Financial Settings</h2>
                  <p>Configure tax rates and financial parameters</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(settings.taxRate || 0) * 100}
                    onChange={(e) =>
                      handleInputChange(
                        "taxRate",
                        parseFloat(e.target.value) / 100,
                      )
                    }
                    placeholder="12.00"
                  />
                  <small>
                    Current: {((settings.taxRate || 0) * 100).toFixed(2)}%
                  </small>
                </div>

                <div className="form-group">
                  <label>Tax Label</label>
                  <input
                    type="text"
                    value={settings.taxLabel || "VAT"}
                    onChange={(e) =>
                      handleInputChange("taxLabel", e.target.value)
                    }
                    placeholder="VAT"
                  />
                </div>

                <div className="form-group full-width">
                  <div className="info-box">
                    <Info size={18} />
                    <p>
                      The tax rate will be applied to all eligible products.
                      Make sure to comply with local tax regulations.
                    </p>
                  </div>
                </div>
              </div>

              <button
                className="save-button"
                onClick={handleSaveTaxSettings}
                disabled={saving}
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Tax Settings"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
