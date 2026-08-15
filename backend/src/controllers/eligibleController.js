const eligibleService = require("../services/eligibleService")
const controllerWrapper = require("../utils/controllerWrapper")

exports.requestForValidation = controllerWrapper(eligibleService.create)
exports.getRequestMembership = controllerWrapper(eligibleService.getAll)
exports.verificationUpdate = controllerWrapper(eligibleService.updateVerification)