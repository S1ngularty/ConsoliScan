const Order = require("../models/Order");
const blockchainService = require("./blockchain.service");

async function confirmOrder(orderData) {
  // 1 Save order (operational truth)
  const order = await Order.create(orderData);

  // 2️ Log to blockchain
  const blockchainResult =
    await blockchainService.logConfirmedOrder(order);

  // 3 Save blockchain reference
  order.blockchainTxId = blockchainResult.txId;
  order.blockchainHash = blockchainResult.hash;

  await order.save();

  return order;
}

module.exports = {
  confirmOrder
};
