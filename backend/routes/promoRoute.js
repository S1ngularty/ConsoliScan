const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const promoController = require("../controllers/promoController");

router
  .route("/promo")
  .post(authMiddleware.verifyToken, promoController.createPromo);

router
  .route("/promo/selections")
  .get(authMiddleware.verifyToken, promoController.getSelection);

module.exports = router;
