const express = require("express");
const router = express.Router();
const authMiddlware = require("../middlewares/authMiddleware");
const orderController = require("../controllers/orderController");
const {generateReceipt} =require("../utils/recieptGenerator")

router
  .route("/orders")
  .get(authMiddlware.verifyToken, orderController.getUser_OrderList);

router
  .route("/confirmOrder")
  .post(authMiddlware.verifyToken, orderController.confirmOrder);

  router.get('/receipts/generate/:orderId',authMiddlware.verifyToken, generateReceipt);


module.exports = router;
