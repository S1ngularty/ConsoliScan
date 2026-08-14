import { Router } from "express";
import * as CatalogController from "./catalog.controller.js";

const router = Router();

router.route("/catalog/version").get(CatalogController.getVersion);

export default router;
