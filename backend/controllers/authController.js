const authService = require("../services/authService")
const controllerWrapper = require("../utils/controllerWrapper")

exports.authenticate = controllerWrapper(authService.googleAuth)
exports.logoutUser = controllerWrapper(authService.logout)