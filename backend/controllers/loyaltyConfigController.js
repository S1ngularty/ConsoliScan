const loyaltyConfigService = require("../services/loyaltyConfigService")
const controllerWrapper = require("../utils/controllerWrapper")

exports.updateLoyaltyConfig= controllerWrapper(loyaltyConfigService.update)
exports.resetLoyaltyPoints = controllerWrapper(loyaltyConfigService.reset)
exports.getLoyaltyConfig = controllerWrapper(loyaltyConfigService.getConfig)
exports.updateProgramStatus = controllerWrapper(loyaltyConfigService.updateStatus)