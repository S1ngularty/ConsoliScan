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
      index: true,
    },

    /* ======================
       ACTORS
    ====================== */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    userType: {
      type: String,
      enum: ["guest", "user"],
      default: "guest",
    },

    cashier: {
      cashierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      name: {
        type: String,
        default: "",
      },
    },

    /* ======================
       CUSTOMER VERIFICATION (ADD THIS)
    ====================== */
    customerVerification: {
      type: {
        type: String,
        enum: ["regular", "senior", "pwd", null],
        default: null,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      verificationSource: {
        type: String,
        enum: ["app", "manual", null],
        default: null,
      },
      verifiedAt: Date,
      verifiedBy: {
        cashierId: mongoose.Schema.Types.ObjectId,
        name: String,
      },
    },

    /* ======================
       ITEMS SNAPSHOT
    ====================== */
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        sku: String,
        quantity: {
          type: Number,
          required: true,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        categoryType: String,
        isBNPCEligible: Boolean,
        // Track if product is BNPC eligible
        isBNPCProduct: Boolean,
        bnpcCategory: String,
        discountScopes: [String], // SENIOR, PWD, etc.
      },
    ],

    /* ======================
       BNPC TRACKING (ADD THIS)
    ====================== */
    bnpcProducts: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
        quantity: Number,
        bnpcCategory: String,
        discountScopes: [String],
        requiresVerification: Boolean,
      },
    ],

    /* ======================
       TOTALS SNAPSHOT
    ====================== */
    totals: {
      subtotal: {
        type: Number,
        required: true,
      },
      // Separate BNPC subtotal
      bnpcSubtotal: {
        type: Number,
        default: 0,
      },
      discountTotal: {
        type: Number,
        required: true,
      },
      finalTotal: {
        type: Number,
        required: true,
      },
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
      remainingPurchaseCap: Number,
    },

    /* ======================
       USER ELIGIBILITY
    ====================== */
    userEligibility: {
      isPWD: Boolean,
      isSenior: Boolean,
      verified: Boolean,
    },

    /* ======================
       VOUCHER (OPTIONAL)
    ====================== */
    voucher: {
      code: String,
      discountAmount: Number,
    },

    /* ======================
       WEEKLY USAGE SNAPSHOT
    ====================== */
    weeklyUsageSnapshot: {
      bnpcAmountUsed: Number,
      discountUsed: Number,
    },

    /* ======================
       STATE MACHINE
    ====================== */
    status: {
      type: String,
      enum: [
        "PENDING",
        "SCANNED",
        "LOCKED",
        "PAID",
        "CANCELLED",
        "EXPIRED",
      ],
      default: "PENDING",
    },
    scannedAt: Date,
    lockedAt: Date,
    paidAt: Date,

    /* ======================
       PAYMENT DATA (ADD THIS)
    ====================== */
    payment: {
      cashReceived: Number,
      changeDue: Number,
      paymentMethod: {
        type: String,
        enum: ["cash", "card", "mobile"],
        default: "cash",
      },
      bookletUsed: Number,
      transactionId: String,
    },

    /* ======================
       SAFETY & LIFETIME
    ====================== */
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CheckoutQueue", checkoutQueueSchema);