const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
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
    description: String,
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
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      // required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
