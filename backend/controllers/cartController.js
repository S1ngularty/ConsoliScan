// ⚠️ DEPRECATED: Cart controller no longer used (session-based architecture)
// Cart is now stored client-side in AsyncStorage and passed to backend for validation
// These endpoints are kept for legacy reference only

const cartService = require("../services/cartService");
const controllerWrapper = require("../utils/controllerWrapper");

exports.syncCart = controllerWrapper(cartService.updateCart);
exports.getUserCart = controllerWrapper(cartService.getById);
exports.clearUserCart = controllerWrapper(cartService.clearCart);
