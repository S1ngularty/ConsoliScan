const express = require("express")
const router = express.Router()

const cartController = require("../controllers/cartController")
const authMiddleware = require("../middlewares/authMiddleware")

router.route("/cart/syncCart").post(authMiddleware.verifyToken,cartController.syncCart)

module.exports = router