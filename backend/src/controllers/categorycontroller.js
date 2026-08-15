const categoryService = require("../services/categoryService");
const controllerWrapper  = require("../utils/controllerWrapper");

exports.categoryList = controllerWrapper(categoryService.list);
exports.addCategory = controllerWrapper(categoryService.create);
exports.categoryUpdate = controllerWrapper(categoryService.update);
exports.categoryDelete = controllerWrapper(categoryService.delete);
