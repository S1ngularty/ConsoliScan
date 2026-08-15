const mongoose = require("mongoose");

const LoyaltyConfigSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: "loyalty_config",
  },
  pointsToCurrencyRate: {
    type: Number,
    required: true,
    min: 0,
  },

  maxRedeemPercent: {
    type: Number,
    min: 0,
    max: 100,
  },

  earnRate: {
    type: Number,
    default: 10,
    min: 0,
  },

  enabled: Boolean,
});

module.exports = mongoose.model("LoyaltyConfig", LoyaltyConfigSchema);
