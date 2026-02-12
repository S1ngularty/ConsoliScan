const LoyaltyConfig = require("../models/loyaltyConfigModel");
const User = require("../models/userModel");

exports.getConfig = async (request) => {
  const config = LoyaltyConfig.findById("loyalty_config");
  if (!config) throw new Error("failed to retrieve the loyalty configuration");

  return config;
};

exports.update = async (request) => {
  if (!request.body) throw new Error("empty request content");

  const config = await LoyaltyConfig.updateOne(
    {
      _id: "loyalty_config",
    },
    request.body,
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  );
};

exports.reset = async (request) => {
  const isReset = await User.updateMany({}, { loyaltyPoints: 0 });
  if (!isReset) throw new Error("failed to reset users points");

  return true;
};

exports.updateStatus = async (request) => {
  if (!request.body) throw new Error("empty request content");
  const isStatusUpdated = await LoyaltyConfig.findByIdAndUpdate(
    "loyalty_config",
    request.body,
    { new: true, runValidators: true },
  );

  return isStatusUpdated;
};
