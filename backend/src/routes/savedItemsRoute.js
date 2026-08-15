const express = require("express");
const router = express.Router();

const savedItemsController = require("../controllers/savedItemsController");
const authMiddleware = require("../middlewares/authMiddleware");

// Get all saved items
router
  .route("/")
  .get(authMiddleware.verifyToken, savedItemsController.getSavedItems);

// Add item to saved
router
  .route("/add")
  .post(authMiddleware.verifyToken, savedItemsController.addToSaved);

// Remove item from saved
router
  .route("/remove")
  .post(authMiddleware.verifyToken, savedItemsController.removeFromSaved);

// Check if product is saved
router
  .route("/check/:productId")
  .get(authMiddleware.verifyToken, savedItemsController.checkIsSaved);

module.exports = router;
