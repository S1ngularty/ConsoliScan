const userService = require("../services/userService");
const controllerWrapper = require("../utils/controllerWrapper");

exports.updateProfile = controllerWrapper(userService.update);
exports.getAllUser = controllerWrapper(userService.getAll);
exports.getUserById = controllerWrapper(userService.getById);
exports.createUser = controllerWrapper(userService.create)
exports.deleteUser = controllerWrapper(userService.delete)
