const express = require("express")
const router = express.Router()
const authMiddlware = require("../middlewares/authMiddleware")
const orderController = require("../controllers/orderController")

router.route("/confirmOrder",authMiddlware.verifyToken,orderController)

module.exports = router