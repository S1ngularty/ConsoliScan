const User = require("../models/userModel");
const { uploadImage } = require("../utils/cloundinaryUtil");

exports.update = async (request) => {
  const { userId } = request.user;
  if (request.file) request.body.avatar = await uploadImage([request.file])[0];
  const user = await User.findByIdAndUpdate(userId, request.body, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new Error("failed to update the user");
  return user;
};
