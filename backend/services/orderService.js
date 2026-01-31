const Order = require("../models/orderModel");
const blockchainService = require("./blockchainService");
const CheckoutQueue = require("../models/checkoutQueueModel");

async function confirmOrder(request) {
  if (!request.body) throw new Error("empty content request");
  const { orderId } = request.params;
  const { userId } = request.user;
  const orderData = { ...request.body, cashier: userId };

  // 1 Save order (operational truth)
  const order = await Order.create(orderData);

  // 2️ Log to blockchain
  const blockchainResult = await blockchainService.logConfirmedOrder(order);

  // 3 Save blockchain reference
  order.blockchainTxId = blockchainResult.txId;
  order.blockchainHash = blockchainResult.hash;

  await order.save();

  CheckoutQueue.findByIdAndDelete(orderId);

  return order;
}

module.exports = {
  confirmOrder,
};
