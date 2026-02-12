const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const loyaltyConfigController = require("../controllers/loyaltyConfigController");

router
  .route("/loyalty/config")
  .put(authMiddleware.verifyToken, loyaltyConfigController.updateLoyaltyConfig)
  .get(authMiddleware.verifyToken, loyaltyConfigController.getLoyaltyConfig);

router
  .route("/loyalty/reset-points")
  .post(authMiddleware.verifyToken, loyaltyConfigController.resetLoyaltyPoints);

router
  .route("/loyalty/config/status")
  .put(authMiddleware.verifyToken, loyaltyConfigController.updateProgramStatus);

module.exports = router;
