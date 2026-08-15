const promoService = require("../services/promoService");
const controllerWrapper = require("../utils/controllerWrapper");

exports.getAllPromo = controllerWrapper(promoService.getAll);
exports.createPromo = controllerWrapper(promoService.create);
exports.getSelection = controllerWrapper(promoService.getSelection);
exports.getSuggestedPromos = controllerWrapper(promoService.getSuggestedPromos);
exports.updatePromo = controllerWrapper(promoService.updatePromo);
exports.applyPromo = controllerWrapper(promoService.apply);
exports.applyGuestPromo = controllerWrapper(promoService.applyGuestPromo);
