const LoyaltyConfig = require("../models/loyaltyConfigModel");

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
