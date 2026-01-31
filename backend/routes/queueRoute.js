const express = require("express")
const router = express.Router()
const authMiddlware = require("../middlewares/authMiddleware")
const queueController = require("../controllers/checkoutQueueController")

router.route("/checkout",authMiddlware.verifyToken,queueController.userCheckout)

module.exports = router