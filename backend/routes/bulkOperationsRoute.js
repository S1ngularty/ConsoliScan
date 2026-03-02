const express = require("express");
const router = express.Router();
const bulkOperationsController = require("../controllers/bulkOperationsController");
const { verifyToken, roleAccess } = require("../middlewares/authMiddleware");

router.use(verifyToken);
router.use(roleAccess("admin"));

router.post("/price-update", bulkOperationsController.bulkPriceUpdate);
router.post("/stock-update", bulkOperationsController.bulkStockUpdate);
router.post(
  "/category-assignment",
  bulkOperationsController.bulkCategoryAssignment,
);
router.post("/delete", bulkOperationsController.bulkDelete);
router.get("/export", bulkOperationsController.exportProducts);
router.post("/import", bulkOperationsController.importProducts);

module.exports = router;
