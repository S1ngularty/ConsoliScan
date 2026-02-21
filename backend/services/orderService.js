const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const blockchainService = require("./blockchainService");
const CheckoutQueue = require("../models/checkoutQueueModel");
const { emitCheckout } = require("../helper/socketEmitter");
const {
  logBNPC_discountUsage,
  managePoints,
  promoUpdateUsage,
} = require("../helper/discountValidator");

async function confirmOrder(request) {
  if (!request.body) throw new Error("empty content request");
  const { orderId } = request.params;
  const { userId } = request.user;

  // Validate required fields
  if (!request.body.transaction) {
    throw new Error("Transaction data required");
  }

  let orderData = { ...request.body.transaction, cashier: userId };

  // Validate booklet update for eligible customers
  if (
    ["senior", "pwd"].includes(orderData.customerType) &&
    !orderData.bookletUpdated
  ) {
    throw new Error("Booklet must be updated for BNPC discounts");
  }

  // Process BNPC discount
  orderData = await logBNPC_discountUsage(orderData);

  // Manage points
  orderData.pointsEarned = await managePoints(orderData);

  await promoUpdateUsage(orderData);

  // Create order
  const order = await Order.create(orderData);

  // Blockchain logging
  const blockchainResult = await blockchainService.logConfirmedOrder(order);
  order.blockchainTxId = blockchainResult.txId;
  order.blockchainHash = blockchainResult.hash;
  await order.save();

  // Cleanup
  await CheckoutQueue.findByIdAndDelete(orderId);

  // Update stock
  if (order.items.length > 0) {
    const bulkOps = order.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stockQuantity: -item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps);
  }

  // Emit socket event
  emitCheckout(order.checkoutCode, "checkout:complete", {
    orderId: order._id,
    orderData: order,
    status: "COMPLETE",
  });

  return order;
}

async function getOrders(request) {
  const { userId } = request.user;
  const orders = await Order.find({ user: userId, status: "CONFIRMED" })
    .select(
      "loyaltyDiscount.pointsEarned finalAmountPaid baseAmount checkoutCode items status confirmedAt discountBreakdown",
    )
    .sort({ createdAt: -1 })
    .lean();

  const orderList = orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      product:item.product,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      itemTotal: item.itemTotal,
      status: item.status,
    })),
    pointsEarned: order.loyaltyDiscount.pointsEarned.toFixed(2),
    baseAmount: order.baseAmount,
  }));

  return orderList;
}

module.exports = {
  confirmOrder,
  getOrders,
};
