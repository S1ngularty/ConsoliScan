const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    // =========================
    // BASIC INFO
    // =========================
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    contactPerson: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },

    // =========================
    // BUSINESS INFO
    // =========================
    businessType: {
      type: String,
      enum: [
        "WHOLESALER",
        "MANUFACTURER",
        "DISTRIBUTOR",
        "SERVICE_PROVIDER",
        "OTHER",
      ],
      default: "WHOLESALER",
    },
    taxId: {
      type: String,
      default: "",
    },
    paymentTerms: {
      type: String,
      default: "NET_30",
      enum: ["IMMEDIATE", "NET_15", "NET_30", "NET_60", "NET_90", "CUSTOM"],
    },

    // =========================
    // FINANCIAL
    // =========================
    creditLimit: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },

    // =========================
    // PRODUCTS SUPPLIED
    // =========================
    productsSupplied: [
      {
        type: String,
      },
    ],

    // =========================
    // STATUS & RATING
    // =========================
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },

    // =========================
    // AUDIT
    // =========================
    notes: {
      type: String,
      default: "",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
// supplierSchema.index({ name: 1 });
supplierSchema.index({ status: 1 });

module.exports = mongoose.model("Supplier", supplierSchema);
