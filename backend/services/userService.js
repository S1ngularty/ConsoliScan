const User = require("../models/userModel");
const { uploadImage } = require("../utils/cloundinaryUtil");

exports.update = async (request) => {
  const { userId } = request.params;
  if (!request.body) throw new Error("undefined request content");
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

exports.create = async (request) => {
  if (!request.body) throw new Error("empty body object");
  const data = { ...request.body };
  const user = await User.create(data);
  if (!user) throw new Error("failed to create the user");
  return user;
};

exports.delete = async(request)=>{
  const {userId} = request.params
  const isDeleted = await User.findByIdAndDelete(userId)
  if(!isDeleted) throw new Error("failed to delete the user")
  return 
}
