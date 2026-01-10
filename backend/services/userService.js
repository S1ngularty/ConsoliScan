const User = require("../models/userModel");
const { uploadImage } = require("../utils/cloundinaryUtil");

exports.update = async (request) => {
  const  userId  = "6961e1e6cc915cb55f6c8b5c";
  if (request.file) request.body.avatar = await uploadImage([request.file],'users');
  const user = await User.findByIdAndUpdate(userId, request.body, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new Error("failed to update the user");
  return user;
};
