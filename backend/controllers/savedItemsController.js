const savedItemsService = require("../services/savedItemsService");
const controllerWrapper = require("../utils/controllerWrapper");

/**
 * GET /api/v1/saved-items
 * Get all saved items for the authenticated user
 */
exports.getSavedItems = controllerWrapper(savedItemsService.getSavedItems);

/**
 * POST /api/v1/saved-items/add
 * Add a product to saved items
 * Body: { productId }
 */
exports.addToSaved = controllerWrapper(savedItemsService.addToSaved);

/**
 * POST /api/v1/saved-items/remove
 * Remove a product from saved items
 * Body: { productId }
 */
exports.removeFromSaved = controllerWrapper(savedItemsService.removeFromSaved);

/**
 * GET /api/v1/saved-items/check/:productId
 * Check if a product is in user's saved items
 */
exports.checkIsSaved = controllerWrapper(savedItemsService.checkIsSaved);
