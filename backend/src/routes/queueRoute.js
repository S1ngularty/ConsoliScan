const express = require("express")
const router = express.Router()
const authMiddlware = require("../middlewares/authMiddleware")
const queueController = require("../controllers/checkoutQueueController")

router.route("/checkout").post(queueController.userCheckout)
router.route("/checkout/:checkoutCode")
.get(authMiddlware.verifyToken, queueController.getCustomerOrder)
.put(authMiddlware.verifyToken,queueController.lockCustomerOrder)

router.route("/checkout/paid/:checkoutCode").put(authMiddlware.verifyToken,queueController.payCustomerOrder)


module.exports = router