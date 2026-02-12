const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const loyaltyConfigController = require("../controllers/loyaltyConfigController");

router
  .route("/loyalty/config")
  .put(authMiddleware.verifyToken, loyaltyConfigController.updateLoyaltyConfig);

router.route("/loyalty/reset-points").post(authMiddleware.verifyToken, loyaltyConfigController.resetLoyaltyPoints)

module.exports = router;
