const promoService = require("../services/promoService")
const controllerWrapper = require("../utils/controllerWrapper")

exports.createPromo = controllerWrapper(promoService.create)
exports.getSelection = controllerWrapper(promoService.getSelection)