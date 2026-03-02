const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
  {
    // =========================
    // ORDER INFO
    // =========================
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    // =========================
    // ITEMS
    // =========================
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitCost: {
          type: Number,
          required: true,
          min: 0,
        },
        totalCost: {
          type: Number,
          required: true,
        },
        receivedQuantity: {
          type: Number,
          default: 0,
        },
      },
    ],

    // =========================
    // FINANCIAL
    // =========================
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },

    // =========================
    // DATES
    // =========================
    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedDeliveryDate: {
      type: Date,
      default: null,
    },
    actualDeliveryDate: {
      type: Date,
      default: null,
    },

    // =========================
    // STATUS
    // =========================
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING",
        "CONFIRMED",
        "PARTIAL",
        "RECEIVED",
        "CANCELLED",
      ],
      default: "DRAFT",
    },

    // =========================
    // AUDIT
    // =========================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
purchaseOrderSchema.index({ supplier: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ orderDate: -1 });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
