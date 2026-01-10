const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.route("/signIn").post(authController.authenticate);

module.exports = router;
