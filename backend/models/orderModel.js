const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    /* ======================
       CORE RELATIONSHIPS
    ======================= */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required:true
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

        quantity: {
          type: Number,
          required: true
        },

        unitPrice: {
          type: Number,
          required: true
        },

        categoryType: String,

        isGroceryDiscountEligible: Boolean,

        promoApplied: {
          type: Boolean,
          default: false
        }
      }
    ],

    /* ======================
       AMOUNTS & DISCOUNTS
    ======================= */

    // Raw total before discounts
    baseAmount: {
      type: Number,
      required: true
    },

    // Subtotal eligible for senior / PWD discount
    groceryEligibleSubtotal: Number,

    // Remaining weekly cap at checkout time
    weeklyCapRemainingAtCheckout: Number,

    seniorPwdDiscountAmount: {
      type: Number,
      default: 0
    },

    // Loyalty points used
    pointsUsed: {
      type: Number,
      default: 0
    },

    // Final amount after all discounts
    finalAmountPaid: {
      type: Number,
      required: true
    },

    // Loyalty points earned (immutable record)
    pointsEarned: {
      type: Number,
      required: true,
      default:0
    },

    /* ======================
       ORDER STATE
    ======================= */

    status: {
      type: String,
      enum: ["CONFIRMED"],
      default: "CONFIRMED"
    },

    confirmedAt: {
      type: Date,
      default: Date.now
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
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
