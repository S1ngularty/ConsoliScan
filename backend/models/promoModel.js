const mongoose = require("mongoose");

const promoSchema = new mongoose.Schema(
  {
    promoName: {
      promo: {
        type: String,
        required: true,
      },
    },
    code: String,
    promoType: {
      type: String,
      enum: ["percentage", "fixed"],
    },
    value: {
      type: Number,
      required: true,
    },
    scope: {
      type: String,
      enum: ["cart", "category", "product"],
    },

    targetIds: [mongoose.Schema.Types.ObjectId],

    minPurchase: Number,

    startDate: Date,
    endDate: Date,

    usageLimit: Number,
    usedCount: Number,

    active: Boolean,
  },
  { timestamps: true },
);

module.eports = mongoose.Model("Promo", promoSchema);
