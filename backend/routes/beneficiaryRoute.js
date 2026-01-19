const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 5 * 1024 * 1024,
  },
});

const beneficiaryController = require("../controllers/beneficiaryController");
const authMiddleware = require("../middlewares/authMiddleware");

router.route("/beneficiary/:userId").post(
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
  beneficiaryController.requestForValidation,
);

module.exports = router;
