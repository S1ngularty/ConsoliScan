const express = require("express");
const router = express.Router();
const stockMovementController = require("../controllers/stockMovementController");
const { verifyToken, roleAccess } = require("../middlewares/authMiddleware");

router.use(verifyToken);
router.use(roleAccess("admin"));

router.get("/", stockMovementController.getStockMovements);
router.get("/analytics", stockMovementController.getStockAnalytics);
router.get(
  "/product/:productId",
  stockMovementController.getProductStockHistory,
);
router.post("/adjust/:productId", stockMovementController.adjustStock);

module.exports = router;
