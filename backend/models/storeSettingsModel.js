const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
  {
    // =========================
    // STORE IDENTITY (singleton)
    // =========================
    _id: {
      type: String,
      default: "store_settings",
    },

    // =========================
    // BASIC INFO
    // =========================
    storeName: {
      type: String,
      required: true,
      default: "Consoli Scan",
    },
    tagline: {
      type: String,
      default: "Smart Retail Solutions",
    },
    logo: {
      type: String,
      default: "",
    },

    // =========================
    // CONTACT INFO
    // =========================
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      province: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "Philippines" },
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },

    // =========================
    // BUSINESS INFO
    // =========================
    taxId: {
      type: String,
      default: "",
    },
    businessPermitNumber: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      default: "PHP",
    },

    // =========================
    // OPERATING HOURS
    // =========================
    businessHours: {
      monday: { open: String, close: String, closed: Boolean },
      tuesday: { open: String, close: String, closed: Boolean },
      wednesday: { open: String, close: String, closed: Boolean },
      thursday: { open: String, close: String, closed: Boolean },
      friday: { open: String, close: String, closed: Boolean },
      saturday: { open: String, close: String, closed: Boolean },
      sunday: { open: String, close: String, closed: Boolean },
    },

    // =========================
    // RECEIPT SETTINGS
    // =========================
    receiptHeader: {
      type: String,
      default: "Thank you for shopping with us!",
    },
    receiptFooter: {
      type: String,
      default: "Please keep this receipt for your records.",
    },
    showTaxOnReceipt: {
      type: Boolean,
      default: true,
    },
    receiptTemplate: {
      type: String,
      enum: ["STANDARD", "COMPACT", "DETAILED"],
      default: "STANDARD",
    },

    // =========================
    // TAX CONFIGURATION
    // =========================
    taxRate: {
      type: Number,
      default: 0.12,
      min: 0,
      max: 1,
    },
    taxLabel: {
      type: String,
      default: "VAT",
    },

    // =========================
    // LOYALTY PROGRAM
    // =========================
    loyaltyEnabled: {
      type: Boolean,
      default: true,
    },
    pointsPerPeso: {
      type: Number,
      default: 1,
    },
    pesosPerPoint: {
      type: Number,
      default: 1,
    },

    // =========================
    // INVENTORY THRESHOLDS
    // =========================
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    autoReorderEnabled: {
      type: Boolean,
      default: false,
    },

    // =========================
    // AUDIT
    // =========================
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);
