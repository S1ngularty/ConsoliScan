const express = require("express");
const router = express.Router();
const storeSettingsController = require("../controllers/storeSettingsController");
const { verifyToken, roleAccess } = require("../middlewares/authMiddleware");

router.use(verifyToken);
router.use(roleAccess("admin"));

router.get("/", storeSettingsController.getSettings);
router.put("/", storeSettingsController.updateSettings);
router.put("/business-hours", storeSettingsController.updateBusinessHours);
router.put("/receipt", storeSettingsController.updateReceiptSettings);
router.put("/tax", storeSettingsController.updateTaxSettings);

module.exports = router;
