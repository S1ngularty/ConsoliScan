const express = require("express")
const router = express.Router()
const authMiddlware = require("../middlewares/authMiddleware")
const queueController = require("../controllers/checkoutQueueController")

router.route("/checkout").post(authMiddlware.verifyToken,queueController.userCheckout)

module.exports = router