const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const userController = require("../controllers/userController");

router
  .route("/profile/user")
  .post(upload.single("avatar"), userController.updateProfile);


module.exports =router