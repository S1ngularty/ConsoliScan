const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const authMiddleware = require("../middlewares/authMiddleware");

router
  .route("/cart/syncCart")
  .post(authMiddleware.verifyToken, cartController.syncCart);

router
  .route("/cart")
  .get(authMiddleware.verifyToken, cartController.getUserCart)
  .delete(authMiddleware.verifyToken,cartController.clearUserCart)

module.exports = router;
