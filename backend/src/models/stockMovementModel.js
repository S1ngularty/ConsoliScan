const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    // =========================
    // PRODUCT REFERENCE
    // =========================
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // =========================
    // MOVEMENT TYPE
    // =========================
    type: {
      type: String,
      required: true,
      enum: [
        "SALE",
        "PURCHASE",
        "RETURN",
        "ADJUSTMENT",
        "DAMAGE",
        "EXPIRY",
        "TRANSFER",
        "RECOUNT",
      ],
    },

    // =========================
    // QUANTITY
    // =========================
    quantityBefore: {
      type: Number,
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    quantityAfter: {
      type: Number,
      required: true,
    },

    // =========================
    // REFERENCES
    // =========================
    referenceType: {
      type: String,
      enum: ["ORDER", "PURCHASE", "ADJUSTMENT", "RETURN", "OTHER"],
      default: "OTHER",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // =========================
    // AUDIT
    // =========================
    reason: {
      type: String,
      default: "",
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1 });
stockMovementSchema.index({ performedBy: 1 });

module.exports = mongoose.model("StockMovement", stockMovementSchema);
