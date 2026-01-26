const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          required: true,
          ref: "Product",
        },
        qty: {
          type: Number,
          required: true,
          default: 1,
        },
        dateAdded: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    itemCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

cartSchema.methods.recalcTotal = function () {
  this.totalPrice = this.items.reduce(
    (acc, item) => acc + item.product.price * item.qty,
    0,
  );

  this.itemCount = this.items.reduce((acc, curr) => acc + curr.qty, 0);
  return;
};

module.exports = mongoose.model("Cart", cartSchema);
