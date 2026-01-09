const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const productController = require("../controllers/productController");

router
  .route("/product")
  .post(upload.array("images", 5), productController.createProduct);

module.exports = router;
