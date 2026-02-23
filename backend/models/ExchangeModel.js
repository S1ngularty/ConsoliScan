const mongoose = require("mongoose");

/**
 * Exchange Model
 *
 * Mirrors your existing ExchangeSchema but adds:
 *  - PENDING status (QR generated, waiting for cashier)
 *  - customerId / cashierId references
 *  - qrToken + qrExpiresAt for signed QR flow
 *  - originalItemName / replacementItemName for receipt display
 *  - initiatedAt for audit trail
 *
 * Drop into: models/exchangeModel.js
 */
const ExchangeSchema = new mongoose.Schema(
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
      type: String,
      required: true,
    },

    originalItemName: {
      type: String,
      default: "",
    },

    replacementItemId: {
      type: String,
      default: null,
    },

    replacementItemName: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ======================
       QR / AUTH TOKEN
       Signed JWT stored here so cashier endpoint can
       verify it without a separate lookup.
    ======================= */
    qrToken: {
      type: String,
      required: true,
      index: true,
    },

    /* ======================
       STATE MACHINE
       PENDING   — customer generated QR, not yet at cashier
       VALIDATED — cashier scanned QR, item condition OK
       COMPLETED — replacement scanned, inventory updated
       EXPIRED   — QR/exchange window lapsed
       CANCELLED — voided before completion
    ======================= */
    status: {
      type: String,
      enum: ["PENDING", "VALIDATED", "COMPLETED", "EXPIRED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    /* ======================
       TIMESTAMPS (granular)
       Top-level fields so Mongoose indexes/queries work cleanly.
       Also mirrored inside `timestamps` sub-doc for backwards
       compat with your original ExchangeSchema shape.
    ======================= */
    initiatedAt: {
      type: Date,
      default: Date.now,
    },

    timestamps: {
      validatedAt: { type: Date, default: null },
      completedAt: { type: Date, default: null },
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
    timestamps: true, // createdAt / updatedAt (Mongoose built-in)
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ── Virtuals ─────────────────────────────────────────────────────────────── */
ExchangeSchema.virtual("isComplete").get(function () {
  return this.status === "COMPLETED";
});

module.exports = mongoose.model("Exchange", ExchangeSchema);
