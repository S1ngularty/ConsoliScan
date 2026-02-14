const orderService = require("../services/orderService")
const controllerWrapper = require("../utils/controllerWrapper")

async function confirmOrder(req, res) {
  try {
    const order = await orderService.confirmOrder(req);

    res.status(201).json({
      success: true,
      orderId: order._id,
      blockchainTxId: order.blockchainTxId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

const getUser_OrderList = controllerWrapper(orderService.getOrders)

module.exports = {
  confirmOrder,
  getUser_OrderList
};
