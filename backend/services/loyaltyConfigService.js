const LoyaltyConfig = require("../models/loyaltyConfigModel");
const User = require("../models/userModel");

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
  const isReset = User.updateMany({}, { loyaltyPoints: 0 });
  if (!isReset) throw new Error("failed to reset users points");

  return true;
};
