const express = require("express");
const router = express.Router();
const authMiddlware = require("../middlewares/authMiddleware");
const orderController = require("../controllers/orderController");

router.route("/confirmOrder").post(authMiddlware.verifyToken, orderController.confirmOrder);

module.exports = router;
