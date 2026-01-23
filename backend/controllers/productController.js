const productService = require("../services/productService");
const controllerWrapper = require("../utils/controllerWrapper");

exports.createProduct = controllerWrapper(productService.create);
exports.getAllProduct = controllerWrapper(productService.getAll);
exports.getProductById = controllerWrapper(productService.getById);
exports.updateProduct = controllerWrapper(productService.update);
exports.deleteImg = controllerWrapper(productService.removeImg);
exports.temporaryDelete = controllerWrapper(productService.softDelete)
exports.permanentDelete = controllerWrapper(productService.hardDelete)
exports.restoreProduct = controllerWrapper(productService.restore)
exports.updateProductStock = controllerWrapper(productService.updateStock)
exports.getScannedProduct = controllerWrapper(productService.getBarcode)