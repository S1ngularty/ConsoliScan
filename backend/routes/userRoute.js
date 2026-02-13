const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router
  .route("/profile/user/:userId")
  .put(
    authMiddleware.verifyToken,
    upload.single("avatar"),
    userController.updateProfile,
  );

router
  .route("/user")
  .get(authMiddleware.verifyToken, userController.getAllUser)
  .post(
    upload.single("avatar"),
    authMiddleware.verifyToken,
    userController.createUser,
  );

router
  .route("/user/:userId")
  .get(authMiddleware.verifyToken, userController.getUserById)
  .delete(authMiddleware.verifyToken, userController.deleteUser);

router
  .route("/user/roles/:userId")
  .put(authMiddleware.verifyToken, userController.updatePermission);

router
  .route("/customer/home")
  .get(authMiddleware.verifyToken, userController.userHomeData);

module.exports = router;
