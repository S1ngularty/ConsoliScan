const express = require("express");
const router = express.Router();
const upload = require("multer")({ dest: "temp_uploads/products/" });

const productController = require("../controllers/productController");

router
  .route("/product")
  .post(upload.none(), productController.createProduct);

  module.exports = router