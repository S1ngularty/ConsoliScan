const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const promoController = require("../controllers/promoController");

router
  .route("/promo")
  .post(authMiddleware.verifyToken, promoController.createPromo)
  .get(authMiddleware.verifyToken, promoController.getAllPromo);

router
  .route("/promo/:promoId")
  .put(authMiddleware.verifyToken, promoController.updatePromo);

router
  .route("/promo/selections")
  .get(authMiddleware.verifyToken, promoController.getSelection);

router
  .route("/promo/apply/:promoCode")
  .get(authMiddleware.verifyToken, promoController.applyPromo);

router
  .route("/promo/guest/apply/:promoCode")
  .post(promoController.applyGuestPromo);

module.exports = router;
