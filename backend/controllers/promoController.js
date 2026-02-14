const promoService = require("../services/promoService")
const controllerWrapper = require("../utils/controllerWrapper")

exports.getAllPromo = controllerWrapper(promoService.getAll)
exports.createPromo = controllerWrapper(promoService.create)
exports.getSelection = controllerWrapper(promoService.getSelection)
exports.updatePromo = controllerWrapper(promoService.updatePromo)
exports.applyPromo = controllerWrapper(promoService.apply)