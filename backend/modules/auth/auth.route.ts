import { Router } from "express";
import * as AuthController from "./auth.controller.js";

const router = Router();

router.route("/register").post(AuthController.register);
router.route("/me").post(AuthController.verifyToken);
router.route("/login").post(AuthController.login);

router.route("/logout").post(AuthController.logout);

export default router