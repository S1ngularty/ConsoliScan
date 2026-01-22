const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");

router
  .route("/product")
  .post(
    authMiddleware.verifyToken,
    upload.array("images", 5),
    productController.createProduct,
  )
  .get(productController.getAllProduct);

router
  .route("/product/:productId")
  .get(productController.getProductById)
  .put(
    authMiddleware.verifyToken,
    upload.array("images", 5),
    productController.updateProduct,
  )
  .post(authMiddleware.verifyToken, productController.temporaryDelete)
  .delete(authMiddleware.verifyToken, productController.permanentDelete);

router
  .route("/product/restore/:productId")
  .put(authMiddleware.verifyToken, productController.restoreProduct);

router
  .route("/product/removeImg/:productId")
  .post(authMiddleware.verifyToken, productController.deleteImg);

router
  .route("/product/stocks/:productId")
  .put(authMiddleware.verifyToken, productController.updateProductStock);

router.route("/scan/product").get((req,res)=>{
  console.log(req.query)
  return res.send(req.query)
});

module.exports = router;
