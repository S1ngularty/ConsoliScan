const mongoose = require("mongoose");
const controllerWrapper = require("../utils/controllerWrapper");
const bulkOperationService = require("../services/bulkOperationService");

exports.bulkPriceUpdate = controllerWrapper(
  bulkOperationService.bulkPriceUpdate,
);
exports.bulkStockUpdate = controllerWrapper(
  bulkOperationService.bulkStockUpdate,
);
exports.bulkCategoryAssignment = controllerWrapper(
  bulkOperationService.bulkCategoryAssignment,
);
exports.bulkDelete = controllerWrapper(bulkOperationService.bulkDelete);
exports.exportProducts = controllerWrapper(bulkOperationService.exportProducts);
