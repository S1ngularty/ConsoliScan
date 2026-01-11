const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

router.route("/signIn").post(authController.authenticate);

router.route("/me").post(authMiddleware.verifyToken, (req, res) => {
  res.status(200).json({ status: true, role: req.user.role });
});

module.exports = router;
