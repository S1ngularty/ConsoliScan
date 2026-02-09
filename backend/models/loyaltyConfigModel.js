const mongoose = require("mongoose");

const LoyaltyConfigSchema = new mongoose.Schema({
  pointsToCurrencyRate: {
    type: Number,
    required: true,
  },
  maxRedeemPercent: {
    type: Number,
  },
  earnRate: Number,
  enabled: Boolean,
});

module.exports = mongoose.model("LoyaltyConfig", LoyaltyConfigSchema);
