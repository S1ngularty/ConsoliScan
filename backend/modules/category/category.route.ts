import { Router } from "express";
import * as CategoryController from "./category.controller.js";

const router = Router();

router
  .route("/category")
  .get(CategoryController.categoryList)
  .post(CategoryController.create)
  .delete(CategoryController.deleteCategories);

router.route("/category/:categoryId").put(CategoryController.update);

export default router