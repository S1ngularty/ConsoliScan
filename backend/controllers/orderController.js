const orderService = require("../services/orderService")

async function confirmOrder(req, res) {
  try {
    const order = await orderService.confirmOrder(req.body);

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

module.exports = {
  confirmOrder
};
