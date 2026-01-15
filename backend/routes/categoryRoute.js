const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const categoryController = require("../controllers/categorycontroller")

router
  .route("/category")
  .get(categoryController.categoryList)
  .post(authMiddleware.verifyToken, categoryController.addCategory);

router
  .route("/category/:categoryId")
  .put(authMiddleware.verifyToken, categoryController.categoryUpdate)
  .delete(authMiddleware.verifyToken, categoryController.categoryDelete);

module.exports = router;