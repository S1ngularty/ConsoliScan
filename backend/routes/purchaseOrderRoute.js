const express = require("express");
const router = express.Router();
const purchaseOrderController = require("../controllers/purchaseOrderController");
const { verifyToken, roleAccess } = require("../middlewares/authMiddleware");

router.use(verifyToken);
router.use(roleAccess("admin"));

router.post("/", purchaseOrderController.createPurchaseOrder);
router.get("/", purchaseOrderController.getAllPurchaseOrders);
router.get("/analytics", purchaseOrderController.getPurchaseOrderAnalytics);
router.get("/:id", purchaseOrderController.getPurchaseOrderById);
router.put("/:id", purchaseOrderController.updatePurchaseOrder);
router.post("/:id/receive", purchaseOrderController.receivePurchaseOrder);
router.delete("/:id", purchaseOrderController.deletePurchaseOrder);

module.exports = router;
