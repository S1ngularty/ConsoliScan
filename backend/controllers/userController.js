const userService = require("../services/userService");
const controllerWrapper = require("../utils/controllerWrapper");

exports.updateProfile = controllerWrapper(userService.update);
