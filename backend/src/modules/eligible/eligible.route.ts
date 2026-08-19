import { Router } from "express";
import * as EligibleController from "./eligible.controller.js";
import upload from "../../middlewares/multer.middleware.js";

const router = Router();

router.route("/eligible").get(EligibleController.getAllEligibles);

router.route("/eligible/:userId").post(
  upload.fields([
    {
      name: "idFront",
      maxCount: 1,
    },
    {
      name: "idBack",
      maxCount: 1,
    },
    {
      name: "userPhoto",
      maxCount: 1,
    },
  ]),
  EligibleController.createEligibleRequest,
);

router.route("/eligible/:memberId").put(EligibleController.updateEligibilty);

export default router;
