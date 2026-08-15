import { Router } from "express";
import * as ProductController from "./product.controller.js";

const router = Router();

router
  .route("/product")
  .post(ProductController.create)
  .get(ProductController.getAll);

router.route("/product/search").get(ProductController.search);

router
  .route("/product/:productId")
  .get(ProductController.getById)
  .put(ProductController.update)
  .post(ProductController.softDelete)
  .delete(ProductController.hardDelete);

router.route("/product/restore/:productId").post(ProductController.restore);

//TODO: the util is still not migrated so this endpoint will not be able for the mean time
// router
//   .route("/product/removeImg/:productId")
//   .post(authMiddleware.verifyToken, productController.deleteImg);

router.route("/product/stocks/:productId").put(ProductController.updateStock);

//TODO: catalog module is still not migrated so ths route/s will not be available for the mean time
// router.route("/catalog").get(productController.getCatalog);
// router.route("/catalog/version").get(productController.getCatalogVersion);

router.route("/scan/product").get(ProductController.getBarcode);

export default router;
