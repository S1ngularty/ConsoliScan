const productService = require("../services/productService");
const controllerWrapper = require("../utils/controllerWrapper");

exports.createProduct = controllerWrapper(productService.create);

