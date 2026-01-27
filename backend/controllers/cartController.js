const cartService = require("../services/cartService")
const controllerWrapper = require("../utils/controllerWrapper")

exports.syncCart = controllerWrapper(cartService.updateCart)
