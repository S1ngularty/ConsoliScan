import { Router } from "express";
import * as EligibleController from "./eligible.controller.js";

const router = Router();

router.route("/eligible").get(EligibleController.getAllEligibles);

//TODO: this route is not avaiable since the custom multer utility and object storage are still not being migrated
// router.route("/eligible/:userId").post(
//   upload.fields([
//     {
//       name: "idFront",
//       maxCount: 1,
//     },
//     {
//       name: "idBack",
//       maxCount: 1,
//     },
//     {
//       name: "userPhoto",
//       maxCount: 1,
//     },
//   ]),
//   eligibleController.requestForValidation,
// );

router.route("/eligible/:memberId").put(EligibleController.updateEligibilty);

export default router