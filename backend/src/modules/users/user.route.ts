import { Router } from "express";
import * as UserController from "./user.controller.js";

const router = Router();

router.route("/profile/user/:userId").put(UserController.update);

router.route("/user").get(UserController.getAll).post(UserController.create);

router
  .route("/user/:userId")
  .get(UserController.getById)
  .delete(UserController.deleteUser);

router.route("/user/roles/:userId").put(UserController.rolesAndPermission);

export default router;
