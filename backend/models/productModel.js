const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // =========================
    // BASIC PRODUCT INFO
    // =========================
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },

    // =========================
    // BARCODE
    // =========================
    barcode: {
      type: String,
      required: true,
      unique: true,
    },
    barcodeType: {
      type: String,
      enum: ["UPC", "EAN_13", "EAN_8", "ISBN_10", "ISBN_13", "CODE_128", "QR"],
      default: "UPC",
    },

    // =========================
    // CATEGORY & PRICING
    // =========================
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    srp: {
      type: Number,
      min: 0,
      default: null, // For DTI / price-controlled goods
    },
    priceControlled: {
      type: Boolean,
      default: false,
    },

    // =========================
    // INVENTORY
    // =========================
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ["kg", "g", "pc", "liter", "ml", "pack"],
      required: true,
    },

    // =========================
    // BNPC / DISCOUNT LOGIC
    // =========================
    isBNPC: {
      type: Boolean,
      default: false,
    },
    bnpcCategory: {
      type: String,
      enum: [
        "RICE",
        "CORN",
        "FRESH_MEAT",
        "FRESH_POULTRY",
        "FRESH_FISH",
        "VEGETABLES",
        "FRUITS",
        "EGGS",
        "COOKING_OIL",
        "SUGAR",
        "MILK",
        "COFFEE",
        "NOODLES",
        "SOAP",
        "DETERGENT",
        "CANNED_GOODS",
        "OTHERS",
      ],
      default: null,
    },
    excludedFromDiscount: {
      type: Boolean,
      default: false,
    },
    discountScopes: {
      type: [String],
      enum: ["PWD", "SENIOR", "PROMO"],
      default: [],
    },

    // =========================
    // MEDIA
    // =========================
    images: [
      {
        public_id: String,
        url: String,
      },
    ],

    // =========================
    // SOFT DELETE
    // =========================
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// =========================
// INDEXES
// =========================
productSchema.index({ barcode: 1, barcodeType: 1 });
productSchema.index({ isBNPC: 1 });
productSchema.index({ bnpcCategory: 1 });

module.exports = mongoose.model("Product", productSchema);
