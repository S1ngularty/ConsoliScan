const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const blockchainService = require("./blockchainService");
const CheckoutQueue = require("../models/checkoutQueueModel");
const { emitCheckout } = require("../helper/socketEmitter");
const { logBNPC_discountUsage } = require("../helper/discountUsageLogger");

async function confirmOrder(request) {
  if (!request.body) throw new Error("empty content request");
  const { orderId } = request.params;
  const { userId } = request.user;
  // console.log(request.body);
  let orderData = { ...request.body.transaction, cashier: userId };

  // console.log(
  //   orderData?.user,
  //   orderData?.appUser,
  //   orderData?.groceryEligibleSubtotal > 0,
  //   orderData?.bnpcDiscount?.autoCalculated > 0,
  //   orderData?.seniorPwdDiscountAmount > 0,
  //   orderData?.bookletUpdated,
  // );

  orderData = await logBNPC_discountUsage(orderData);
  // console.log(orderData);

  const order = await Order.create(orderData);

  const blockchainResult = await blockchainService.logConfirmedOrder(order);

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
    orderId: order._id,
    orderData: order,
    status: "COMPLETE",
  });

  return order;
}

module.exports = {
  confirmOrder,
};
