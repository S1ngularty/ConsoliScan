import mongoose, { type HydratedDocument, Model, Schema } from "mongoose";
import type { IProduct } from "./product.types.js";

type ProductModel = Model<IProduct>;

const productSchema = new Schema<IProduct, ProductModel>(
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

    salePrice: {
      type: Number,
      default: null,
    },
    saleActive: {
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
    excludedFromDiscount: {
      type: Boolean,
      default: false,
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
  { timestamps: true },
);

productSchema.index({ barcode: 1, barcodeType: 1 });

export type ProductDocument = HydratedDocument<IProduct>;

export const Product = mongoose.model<IProduct, ProductModel>(
  "Product",
  productSchema,
);
