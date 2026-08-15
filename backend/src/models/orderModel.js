const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    /* ======================
       CORE RELATIONSHIPS
    ======================= */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    appUser: {
      type: Boolean,
      default: true,
    },

    /* ======================
       ORDER METADATA
    ======================= */
    checkoutCode: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },

    customerType: {
      type: String,
      enum: ["senior", "pwd", "regular", "none"],
      default: "regular",
    },

    customerScope: {
      type: String,
      enum: ["SENIOR", "PWD", null],
      default: null,
    },

    verificationSource: {
      type: String,
      enum: ["system", "manual", "none"],
      default: "none",
    },

    systemVerified: {
      type: Boolean,
      default: false,
    },

    systemVerificationType: {
      type: String,
      enum: ["senior", "pwd", "regular", null],
      default: null,
    },

    manualOverride: {
      type: Boolean,
      default: false,
    },

    /* ======================
       ITEMS (ENHANCED)
    ======================= */
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: {
          type: String,
          required: true,
        },
        sku: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        salePrice: Number,
        saleActive: {
          type: Boolean,
          default: false,
        },
        categoryType: String,
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
        unit: {
          type: String,
          default: "pc",
        },
        itemTotal: {
          type: Number,
          min: 0,
        },
        promoApplied: {
          type: Boolean,
          default: false,
        },
        status: {
          type: String,
          enum: ["EXCHANGED", "SOLD", "RETURNED"],
          default: "SOLD",
        },
        exchangeInfo: {
          replacementItemId: String,
          replacementName: String,
          validatedAt: Date,
          completedAt: Date,
        },
        returnInfo: {
          returnId: mongoose.Schema.Types.ObjectId,
          reason: String,
          inspectionStatus: String,
          fulfillmentType: String,
          completedAt: Date,
        },
      },
    ],

    /* ======================
       BNPC PRODUCTS TRACKING
    ======================= */
    bnpcProducts: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        quantity: Number,
        price: Number,
        salePrice: Number,
        saleActive: Boolean,
        unit: String,
        category: mongoose.Schema.Types.ObjectId,
        categoryName: String,
        isBNPCEligible: Boolean,
        requiresVerification: Boolean,
        itemTotal: Number,
      },
    ],

    hasBNPCItems: {
      type: Boolean,
      default: false,
    },

    /* ======================
       AMOUNTS & DISCOUNTS
    ======================= */
    // Raw total before discounts
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Subtotal eligible for BNPC discount
    bnpcEligibleSubtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    // BNPC discount breakdown
    bnpcDiscount: {
      autoCalculated: {
        type: Number,
        default: 0,
        min: 0,
      },
      serverCalculated: {
        type: Number,
        default: 0,
        min: 0,
      },
      additionalApplied: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Promo discount
    promoDiscount: {
      code: String,
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      serverValidated: {
        type: Boolean,
        default: false,
      },
    },

    // Loyalty points discount
    loyaltyDiscount: {
      pointsUsed: {
        type: Number,
        default: 0,
        min: 0,
      },
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      pointsEarned: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Senior/PWD discount (legacy field - use bnpcDiscount.total for new records)
    seniorPwdDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Voucher discount
    voucherDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Complete discount breakdown
    discountBreakdown: {
      bnpc: { type: Number, default: 0 },
      promo: { type: Number, default: 0 },
      loyalty: { type: Number, default: 0 },
      voucher: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },

    // Final amount after all discounts
    finalAmountPaid: {
      type: Number,
      required: true,
      min: 0,
    },

    // Loyalty points earned (legacy)
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ======================
       SERVER CALCULATIONS SNAPSHOT
    ======================= */
    serverCalculations: {
      discountSnapshot: mongoose.Schema.Types.Mixed,
      weeklyUsageSnapshot: mongoose.Schema.Types.Mixed,
      totals: mongoose.Schema.Types.Mixed,
    },

    /* ======================
       BNPC CAPS & COMPLIANCE DATA
    ======================= */
    bnpcCaps: {
      // Weekly discount cap tracking
      discountCap: {
        weeklyCap: {
          type: Number,
          default: 125,
        },
        usedBefore: {
          type: Number,
          default: 0,
          min: 0,
        },
        remainingAtCheckout: {
          type: Number,
          default: 125,
          min: 0,
        },
        usedAfter: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      // Purchase cap tracking
      purchaseCap: {
        weeklyCap: {
          type: Number,
          default: 2500,
        },
        usedBefore: {
          type: Number,
          default: 0,
          min: 0,
        },
        remainingAtCheckout: {
          type: Number,
          default: 2500,
          min: 0,
        },
        usedAfter: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      // Week range
      weekStart: Date,
      weekEnd: Date,
      // Remaining weekly cap (legacy field)
      weeklyCapRemainingAtCheckout: {
        type: Number,
        default: 125,
        min: 0,
      },
    },

    /* ======================
       ITEM STATISTICS
    ======================= */
    itemStats: {
      totalItems: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalQuantity: {
        type: Number,
        default: 0,
        min: 0,
      },
      bnpcEligibleItems: {
        type: Number,
        default: 0,
        min: 0,
      },
      bnpcEligibleQuantity: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    /* ======================
       ORDER STATE
    ======================= */
    status: {
      type: String,
      enum: ["CONFIRMED", "CANCELLED", "REFUNDED"],
      default: "CONFIRMED",
    },

    confirmedAt: {
      type: Date,
      default: Date.now,
    },

    /* ======================
       BOOKLET COMPLIANCE
    ======================= */
    bookletUpdated: {
      type: Boolean,
      default: false,
    },

    bookletUpdateReminder: {
      type: String,
      default: "Physical booklet must be updated with new total",
    },

    /* ======================
       BLOCKCHAIN LINK
    ======================= */
    blockchainTxId: {
      type: String,
    },

    blockchainHash: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for total discount (convenience)
orderSchema.virtual("totalDiscount").get(function () {
  return (
    (this.bnpcDiscount?.total || 0) +
    (this.promoDiscount?.amount || 0) +
    (this.loyaltyDiscount?.amount || 0) +
    (this.voucherDiscount || 0)
  );
});

// Virtual for net amount (base - discounts)
orderSchema.virtual("netAmount").get(function () {
  return this.baseAmount - this.totalDiscount;
});

// Virtual for discount breakdown summary
orderSchema.virtual("discountSummary").get(function () {
  return {
    bnpc: this.bnpcDiscount?.total || 0,
    promo: this.promoDiscount?.amount || 0,
    loyalty: this.loyaltyDiscount?.amount || 0,
    voucher: this.voucherDiscount || 0,
    total: this.totalDiscount,
  };
});

// Virtual for verification status
orderSchema.virtual("verificationStatus").get(function () {
  if (this.systemVerified) return "system";
  if (this.manualOverride) return "manual";
  return "none";
});

module.exports = mongoose.model("Order", orderSchema);
