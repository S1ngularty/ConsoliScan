const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    // =========================
    // BASIC INFO
    // =========================
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      enum: [
        "SUPPLIES",
        "UTILITIES",
        "RENT",
        "SALARY",
        "MAINTENANCE",
        "MARKETING",
        "EQUIPMENT",
        "INVENTORY_PURCHASE",
        "OTHER",
      ],
    },

    // =========================
    // FINANCIAL
    // =========================
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "CREDIT_CARD", "CHECK", "OTHER"],
      default: "CASH",
    },
    receiptNumber: {
      type: String,
      default: "",
    },

    // =========================
    // SUPPLIER INFO
    // =========================
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    supplierName: {
      type: String,
      default: "",
    },

    // =========================
    // DATES
    // =========================
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    paidDate: {
      type: Date,
      default: null,
    },

    // =========================
    // STATUS
    // =========================
    status: {
      type: String,
      enum: ["PENDING", "PAID", "OVERDUE", "CANCELLED"],
      default: "PAID",
    },

    // =========================
    // AUDIT
    // =========================
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    attachments: [
      {
        url: String,
        name: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ recordedBy: 1 });

module.exports = mongoose.model("Expense", expenseSchema);
