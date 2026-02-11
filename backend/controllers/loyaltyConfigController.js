const loyaltyConfigService = require("../services/loyaltyConfigService")
const controllerWrapper = require("../utils/controllerWrapper")

exports.updateLoyaltyConfig= controllerWrapper(loyaltyConfigService.update)