const beneficiaryService = require("../services/beneficiaryService")
const controllerWrapper = require("../utils/controllerWrapper")

exports.requestForValidation = controllerWrapper(beneficiaryService.create)
exports.getRequestMembership = controllerWrapper(beneficiaryService.getAll)