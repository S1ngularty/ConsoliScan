const User = require("../models/userModel");
const { uploadImage } = require("../utils/cloundinaryUtil");

exports.update = async (request) => {
  const userId = req.user.userId;
  if (request.file)
    request.body.avatar = await uploadImage([request.file], "users");
  const user = await User.findByIdAndUpdate(userId, request.body, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new Error("failed to update the user");
  return user;
};

exports.getAll = async (request) => {
  const { userId } = request.user;
  const users = await User.find({ userId: { $ne: userId } });
  return users;
};

exports.getById = async (request) => {
  const { userId } = request.params;
  const user = await User.findById(userId);
  if (!user) throw new Error("user is not found in the collection");
  return user;
};
