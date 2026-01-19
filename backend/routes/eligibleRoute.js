const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 5 * 1024 * 1024,
  },
});

const eligibleController = require("../controllers/eligibleController");
const authMiddleware = require("../middlewares/authMiddleware");

router.route("/eligible").get(eligibleController.getRequestMembership);

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
  eligibleController.requestForValidation,
);

router
  .route("/eligible/:memberId")
  .put(authMiddleware.verifyToken, eligibleController.verificationUpdate);

module.exports = router;
