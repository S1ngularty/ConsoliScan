const mongoose = require("mongoose");

/**
 * Return Model
 *
 * Tracks customer returns with inspection & fulfillment options:
 *  - PENDING: Return initiated, QR generated
 *  - VALIDATED: Cashier scanned QR/entered code
 *  - INSPECTED: Cashier completed inspection (PASSED or REJECTED)
 *  - COMPLETED: Loyalty points awarded or item swapped
 *  - REJECTED: Item failed inspection
 *  - CANCELLED: Return voided before completion
 */

const ReturnSchema = new mongoose.Schema(
  {
    /* ======================
       CORE RELATIONSHIPS
    ======================= */
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ======================
       ITEM DATA
    ======================= */
    originalItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    originalItemName: {
      type: String,
      required: true,
    },

    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ======================
       RETURN REASON
    ======================= */
    returnReason: {
      type: String,
      enum: [
        "changed_mind",
        "defective",
        "damaged",
        "not_as_described",
        "wrong_item",
        "other",
      ],
      default: "changed_mind",
    },

    returnReasonNotes: {
      type: String,
      default: "",
    },

    /* ======================
       INSPECTION
    ======================= */
    inspectionStatus: {
      type: String,
      enum: ["PENDING", "PASSED", "REJECTED"],
      default: "PENDING",
    },

    inspectionNotes: {
      type: String,
      default: "",
    },

    /* ======================
       FULFILLMENT TYPE
    ======================= */
    fulfillmentType: {
      type: String,
      enum: ["LOYALTY_CONVERSION", "ITEM_SWAP", null],
      default: null,
    },

    /* ======================
       LOYALTY FULFILLMENT
    ======================= */
    loyaltyPointsAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ======================
       ITEM SWAP FULFILLMENT
    ======================= */
    replacementItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    replacementItemName: {
      type: String,
      default: "",
    },

    /* ======================
       QR / AUTH TOKEN
       Signed JWT for offline validation
    ======================= */
    qrToken: {
      type: String,
      required: true,
      index: true,
    },

    /* ======================
       STATE MACHINE
       PENDING    — customer initiated, QR generated
       VALIDATED  — cashier scanned QR/entered code
       INSPECTED  — cashier completed inspection
       COMPLETED  — loyalty/swap fulfilled
       REJECTED   — failed inspection
       CANCELLED  — voided before completion
    ======================= */
    status: {
      type: String,
      enum: [
        "PENDING",
        "VALIDATED",
        "INSPECTED",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },

    /* ======================
       TIMESTAMPS
    ======================= */
    initiatedAt: {
      type: Date,
      default: Date.now,
    },

    validatedAt: {
      type: Date,
      default: null,
    },

    inspectedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    /* ======================
       BLOCKCHAIN LINK
    ======================= */
    blockchainTxId: {
      type: String,
      default: null,
    },

    blockchainHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ── Virtuals ─────────────────────────────────────────────────────────────── */
ReturnSchema.virtual("isComplete").get(function () {
  return this.status === "COMPLETED";
});

ReturnSchema.virtual("isRejected").get(function () {
  return this.status === "REJECTED";
});

ReturnSchema.virtual("inspectionPassed").get(function () {
  return this.inspectionStatus === "PASSED";
});

module.exports = mongoose.model("Return", ReturnSchema);
