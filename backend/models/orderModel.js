const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    /* ======================
       CORE RELATIONSHIPS
    ======================= */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default:null
    },

    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    /* ======================
       ORDER METADATA
    ======================= */
    checkoutCode: {
      type: String,
      required: true,
      index: true
    },

    customerType: {
      type: String,
      enum: ["senior", "pwd", "regular", "none"],
      default: "regular"
    },

    verificationSource: {
      type: String,
      enum: ["system", "manual", "none"],
      default: "none"
    },

    /* ======================
       ITEMS
    ======================= */
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        name: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0
        },
        categoryType: String,
        isGroceryDiscountEligible: {
          type: Boolean,
          default: false
        },
        promoApplied: {
          type: Boolean,
          default: false
        },
        sku: String
      }
    ],

    /* ======================
       AMOUNTS & DISCOUNTS
    ======================= */
    // Raw total before discounts
    baseAmount: {
      type: Number,
      required: true,
      min: 0
    },

    // Subtotal eligible for senior / PWD discount
    groceryEligibleSubtotal: {
      type: Number,
      default: 0,
      min: 0
    },

    // BNPC discount breakdown
    bnpcDiscount: {
      autoCalculated: {
        type: Number,
        default: 0,
        min: 0
      },
      additionalApplied: {
        type: Number,
        default: 0,
        min: 0
      },
      total: {
        type: Number,
        default: 0,
        min: 0
      }
    },

    // Senior/PWD discount (legacy field - use bnpcDiscount.total for new records)
    seniorPwdDiscountAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Voucher discount
    voucherDiscount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Loyalty points used
    pointsUsed: {
      type: Number,
      default: 0,
      min: 0
    },

    // Final amount after all discounts
    finalAmountPaid: {
      type: Number,
      required: true,
      min: 0
    },

    // Loyalty points earned
    pointsEarned: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    /* ======================
       CASH TRANSACTION
    ======================= */
    cashTransaction: {
      cashReceived: {
        type: Number,
        required: true,
        min: 0
      },
      changeDue: {
        type: Number,
        required: true,
        min: 0
      }
    },

    /* ======================
       BNPC CAPS & COMPLIANCE DATA
    ======================= */
    bnpcCaps: {
      // Weekly discount cap tracking
      discountCap: {
        weeklyCap: {
          type: Number,
          default: 125
        },
        usedBefore: {
          type: Number,
          default: 0,
          min: 0
        },
        remainingAtCheckout: {
          type: Number,
          default: 125,
          min: 0
        },
        usedAfter: {
          type: Number,
          default: 0,
          min: 0
        }
      },
      // Purchase cap tracking
      purchaseCap: {
        weeklyCap: {
          type: Number,
          default: 2500
        },
        usedBefore: {
          type: Number,
          default: 0,
          min: 0
        },
        remainingAtCheckout: {
          type: Number,
          default: 2500,
          min: 0
        },
        usedAfter: {
          type: Number,
          default: 0,
          min: 0
        }
      },
      // Remaining weekly cap (legacy field)
      weeklyCapRemainingAtCheckout: {
        type: Number,
        default: 125,
        min: 0
      }
    },

    /* ======================
       ITEM STATISTICS
    ======================= */
    itemStats: {
      totalItems: {
        type: Number,
        default: 0,
        min: 0
      },
      totalQuantity: {
        type: Number,
        default: 0,
        min: 0
      },
      bnpcEligibleItems: {
        type: Number,
        default: 0,
        min: 0
      },
      bnpcEligibleQuantity: {
        type: Number,
        default: 0,
        min: 0
      }
    },

    /* ======================
       ORDER STATE
    ======================= */
    status: {
      type: String,
      enum: ["CONFIRMED", "CANCELLED", "REFUNDED"],
      default: "CONFIRMED"
    },

    confirmedAt: {
      type: Date,
      default: Date.now
    },

    /* ======================
       BOOKLET COMPLIANCE
    ======================= */
    bookletUpdated: {
      type: Boolean,
      default: false
    },

    bookletUpdateReminder: {
      type: String,
      default: "Physical booklet must be updated with new total"
    },

    /* ======================
       BLOCKCHAIN LINK
    ======================= */
    blockchainTxId: {
      type: String
    },

    blockchainHash: {
      type: String
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for total discount (convenience)
orderSchema.virtual('totalDiscount').get(function() {
  return this.bnpcDiscount.total + this.voucherDiscount;
});

// Virtual for net amount (base - discounts)
orderSchema.virtual('netAmount').get(function() {
  return this.baseAmount - this.totalDiscount;
});

// Index for faster queries
orderSchema.index({ user: 1, confirmedAt: -1 });
orderSchema.index({ cashier: 1, confirmedAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ customerType: 1 });
orderSchema.index({ confirmedAt: -1 });

module.exports = mongoose.model("Order", orderSchema);