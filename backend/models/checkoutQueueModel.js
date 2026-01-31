const mongoose = require("mongoose");

const checkoutQueueSchema = new mongoose.Schema(
  {
    /* ======================
       IDENTIFIER (QR TARGET)
    ====================== */

    checkoutCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    /* ======================
       ACTORS
    ====================== */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    /* ======================
       ITEMS SNAPSHOT
    ====================== */

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },

        name: String,       // POS display
        sku: String,

        quantity: {
          type: Number,
          required: true
        },

        unitPrice: {
          type: Number,
          required: true
        },

        categoryType: String,

        isBNPCEligible: Boolean
      }
    ],

    /* ======================
       TOTALS SNAPSHOT
    ====================== */

    totals: {
      subtotal: {
        type: Number,
        required: true
      },

      discountTotal: {
        type: Number,
        required: true
      },

      finalTotal: {
        type: Number,
        required: true
      }
    },

    /* ======================
       DISCOUNT SNAPSHOT
    ====================== */

    discountSnapshot: {
      eligible: Boolean,
      eligibleItemsCount: Number,

      bnpcSubtotal: Number,
      cappedBNPCAmount: Number,

      discountApplied: Number,

      weeklyDiscountUsed: Number,
      weeklyPurchaseUsed: Number,

      remainingDiscountCap: Number,
      remainingPurchaseCap: Number
    },

    /* ======================
       USER ELIGIBILITY
    ====================== */

    userEligibility: {
      isPWD: Boolean,
      isSenior: Boolean
    },

    /* ======================
       VOUCHER (OPTIONAL)
    ====================== */

    voucher: {
      code: String,
      discountAmount: Number
    },

    /* ======================
       WEEKLY USAGE SNAPSHOT
    ====================== */

    weeklyUsageSnapshot: {
      bnpcAmountUsed: Number,
      discountUsed: Number
    },

    /* ======================
       STATE MACHINE
    ====================== */

    status: {
      type: String,
      enum: [
        "PENDING",    // created, QR shown
        "SCANNED",    // POS scanned
        "LOCKED",     // cashier confirmed
        "PAID",       // payment success
        "CANCELLED",
        "EXPIRED"
      ],
      default: "PENDING"
    },

    scannedAt: Date,
    lockedAt: Date,
    paidAt: Date,

    /* ======================
       SAFETY & LIFETIME
    ====================== */

    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CheckoutQueue", checkoutQueueSchema);
