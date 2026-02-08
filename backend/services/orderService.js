const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const blockchainService = require("./blockchainService");
const CheckoutQueue = require("../models/checkoutQueueModel");
const { emitCheckout } = require("../helper/socketEmitter");

async function confirmOrder(request) {
  if (!request.body) throw new Error("empty content request");
  const { orderId } = request.params;
  const { userId } = request.user;
  const orderData = { ...request.body.transaction, cashier: userId };

  // 1 Save order (operational truth)
  const order = await Order.create(orderData);

  // 2️ Log to blockchain
  const blockchainResult = await blockchainService.logConfirmedOrder(order);

  // 3 Save blockchain reference
  order.blockchainTxId = blockchainResult.txId;
  order.blockchainHash = blockchainResult.hash;

  await order.save();

  CheckoutQueue.findByIdAndDelete(orderId);

  const bulkOps = order.items.map((item) => ({
    updateOne: {
      filter: {
        _id: item.product,
      },
      update: {
        $inc: { stockQuantity: -item.quantity },
      },
    },
  }));

  Product.bulkWrite(bulkOps);

  emitCheckout(order.checkoutCode, "checkout:complete", {
    orderId:order._id,
    status: "COMPLETE",
  });

  return order;
}

module.exports = {
  confirmOrder,
};
