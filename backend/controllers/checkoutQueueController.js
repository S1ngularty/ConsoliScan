const checkoutQueue = require("../services/checkoutQueueService")
const controllerWrapper = require("../utils/controllerWrapper")

exports.userCheckout = controllerWrapper(checkoutQueue.checkout)
exports.getCustomerOrder = controllerWrapper(checkoutQueue.getOrder)
exports.lockCustomerOrder = controllerWrapper(checkoutQueue.lockedOrder)