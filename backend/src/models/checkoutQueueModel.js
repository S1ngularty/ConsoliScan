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

    userEmail: {
      type: String,
      default: null,
    },

    userName: {
      type: String,
      default: null,
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
       CUSTOMER VERIFICATION
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
        enum: ["app", "system", "manual", null],
        default: null,
      },
      verificationDate: Date,
      verifiedBy: {
        cashierId: mongoose.Schema.Types.ObjectId,
        name: String,
      },
    },

    /* ======================
       ITEMS SNAPSHOT (DETAILED)
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
        salePrice: Number,
        saleActive: Boolean,
        isBNPCEligible: {
          type: Boolean,
          default: false,
        },
        isBNPCProduct: {
          type: Boolean,
          default: false,
        },
        excludedFromDiscount: {
          type: Boolean,
          default: false,
        },
        category: {
          id: mongoose.Schema.Types.ObjectId,
          name: String,
          isBNPC: Boolean,
        },
        unit: String,
        itemTotal: Number,
      },
    ],

    /* ======================
       BNPC PRODUCTS TRACKING
    ====================== */
    bnpcProducts: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
        salePrice: Number,
        saleActive: Boolean,
        quantity: Number,
        unit: String,
        category: mongoose.Schema.Types.ObjectId,
        categoryName: String,
        isBNPCEligible: {
          type: Boolean,
          default: false,
        },
        requiresVerification: {
          type: Boolean,
          default: true,
        },
        itemTotal: Number,
      },
    ],

    hasBNPCItems: {
      type: Boolean,
      default: false,
    },

    /* ======================
       TOTALS & DISCOUNTS
    ====================== */
    totals: {
      subtotal: {
        type: Number,
        required: true,
      },
      afterOtherDiscounts: Number, // Subtotal after BNPC and promo discounts
      bnpcEligibleSubtotal: {
        type: Number,
        default: 0,
      },
      bnpcDiscount: {
        type: Number,
        default: 0,
      },
      promoDiscount: {
        type: Number,
        default: 0,
      },
      loyaltyDiscount: {
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
       DISCOUNT BREAKDOWN
    ====================== */
    discountBreakdown: {
      bnpcDiscount: Number,
      promoDiscount: Number,
      loyaltyDiscount: Number,
      totalDiscount: Number,
    },

    /* ======================
       BNPC DISCOUNT SNAPSHOT
    ====================== */
    discountSnapshot: {
      eligible: Boolean,
      eligibleItemsCount: Number,
      bnpcEligibleSubtotal: Number,
      cappedBNPCAmount: Number,
      discountApplied: Number,
      remainingPurchaseCap: Number,
      remainingDiscountCap: Number,
      weeklyPurchaseUsed: Number,
      weeklyDiscountUsed: Number,
      weekStart: Date,
      weekEnd: Date,
      reason: String,
    },

    /* ======================
       WEEKLY USAGE SNAPSHOT
    ====================== */
    weeklyUsageSnapshot: {
      bnpcAmountUsed: Number,
      discountUsed: Number,
      weekStart: Date,
      weekEnd: Date,
      remainingPurchaseCap: Number,
      remainingDiscountCap: Number,
      purchaseCap: {
        type: Number,
        default: 2500,
      },
      discountCap: {
        type: Number,
        default: 125,
      },
    },

    /* ======================
       USER ELIGIBILITY DETAILS
    ====================== */
    userEligibility: {
      isPWD: Boolean,
      isSenior: Boolean,
      verified: Boolean,
      verificationIdType: String,
      discountScope: {
        type: String,
        enum: ["PWD", "SENIOR", null],
        default: null,
      },
      weeklyCaps: {
        purchaseCap: Number,
        discountCap: Number,
      },
      currentUsage: {
        purchasedUsed: Number,
        discountUsed: Number,
        weekStart: Date,
        weekEnd: Date,
      },
    },

    /* ======================
       PROMO DATA
    ====================== */
    promo: {
      promoId: mongoose.Schema.Types.ObjectId,
      code: String,
      name: String,
      type: {
        type: String,
        enum: ["percentage", "fixed"],
      },
      value: Number,
      scope: {
        type: String,
        enum: ["cart", "category", "product"],
      },
      targetIds: [mongoose.Schema.Types.ObjectId],
      minPurchase: Number,
      discountAmount: Number,
      serverValidated: Boolean,
      appliedPromoData: mongoose.Schema.Types.Mixed,
    },

    /* ======================
       LOYALTY POINTS DATA
    ====================== */
    loyaltyPoints: {
      pointsUsed: Number,
      pointsValue: Number, // ₱ per point
      discountAmount: Number,
      maxAllowedDiscount: Number,
      maxRedeemPercent: Number,
      percentageUsed: String,
      config: {
        pointsToCurrencyRate: Number,
        maxRedeemPercent: Number,
        earnRate: Number,
      },
    },

    pointsEarned: Number,

    /* ======================
       CART SNAPSHOT (REFERENCE)
    ====================== */
    cartSnapshot: {
      itemCount: Number,
      totalValue: Number,
      items: [
        {
          productId: mongoose.Schema.Types.ObjectId,
          name: String,
          quantity: Number,
        },
      ],
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
       PAYMENT DATA
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
  },
  { timestamps: true },
);

// Virtual for total items count
checkoutQueueSchema.virtual("totalItems").get(function() {
  return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
});

// Method to check if queue is expired
checkoutQueueSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to check if BNPC discount was applied
checkoutQueueSchema.methods.hasBNPCDiscount = function() {
  return this.totals?.bnpcDiscount > 0;
};

// Method to get discount summary
checkoutQueueSchema.methods.getDiscountSummary = function() {
  return {
    bnpc: this.totals?.bnpcDiscount || 0,
    promo: this.totals?.promoDiscount || 0,
    loyalty: this.totals?.loyaltyDiscount || 0,
    total: this.totals?.discountTotal || 0,
  };
};

module.exports = mongoose.model("CheckoutQueue", checkoutQueueSchema);