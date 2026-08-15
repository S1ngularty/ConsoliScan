const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplierController");
const { verifyToken, roleAccess } = require("../middlewares/authMiddleware");

// All supplier routes require admin access
router.use(verifyToken);
router.use(roleAccess("admin"));

router.post("/", supplierController.createSupplier);
router.get("/", supplierController.getAllSuppliers);
router.get("/analytics", supplierController.getSupplierAnalytics);
router.get("/:id", supplierController.getSupplierById);
router.put("/:id", supplierController.updateSupplier);
router.delete("/:id", supplierController.deleteSupplier);

module.exports = router;
