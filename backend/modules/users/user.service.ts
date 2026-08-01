import { User, type UserDocument } from "./user.model.js";
import type {
  UpdateUserFields,
  CurrUser,
  CreateUserFields,
  IUser,
  RolesAndInformationTypes,
} from "./user.types.js";
// import { uploadImage, deleteAssets } from "../../utils/cloundinaryUtil.js";
// const Eligibility = require("../models/eligibleModel");
// const Cart = require("../models/cartModel");
// const Order = require("../models/orderModel");
// const { createLog } = require("../services/activityLogsService");

export const update = async (
  payload: UpdateUserFields,
): Promise<UserDocument | null> => {
  const { userId, body } = payload;

  //   if (request.file)
  //     request.body.avatar = await uploadImage([request.file], "users");

  const user = await User.findByIdAndUpdate(userId, body, {
    runValidators: true,
  });

  // if (user?.avatar?.public_id) deleteAssets([user.avatar.public_id]);

  return user;
};

export const getAll = async (user: CurrUser): Promise<IUser[]> => {
  const { userId } = user;

  const users = await User.find({ _id: { $ne: userId } }).lean();

  return users;
};

export const getById = async (userId: string): Promise<IUser> => {
  const fetchedUser = await User.findById(userId);

  if (!fetchedUser) throw new Error("User not found!");

  return fetchedUser.toObject();
};

export const create = async (payload: CreateUserFields): Promise<IUser> => {
  if (!payload) throw new Error("Missing payload");

  const user: UserDocument | null = await User.create(payload);
  if (!user) throw new Error("Failed to create the user");
  return user.toObject();
};

export const deleteUser = async (userId: string): Promise<IUser> => {
  if (!userId) throw new Error("Missing userId");

  const deletedUser = await User.findByIdAndDelete(userId);
  if (!deletedUser) throw new Error("Failed to delete the user");
  // if (deletedUser.avatar?.public_id)
  //   deleteAssets([deletedUser.avatar.public_id]);

  return deletedUser.toObject();
};

export const rolesAndPermission = async (
  data: RolesAndInformationTypes,
): Promise<IUser> => {
  const { role, userId } = data;
  const user = await User.findByIdAndUpdate(
    userId,
    { role: role },
    { new: true, runValidators: true },
  );

  if (!user) throw new Error("Failed to update user role and permission");
  return user.toObject();
};

// exports.getHomeScreenData = async (request) => {
//   const { userId } = request.user;
//   const [userInfo, eligibilityInfo, cartInfo, orderCount] = await Promise.all([
//     User.findById(userId).lean(),
//     Eligibility.findOne({ user: userId }).lean(),
//     Cart.findOne({ user: userId }).lean(),
//     Order.find({ user: userId }).countDocuments(),
//   ]);

//   const user = {
//     firstName: userInfo.firstName,
//     lastName: userInfo.lastName,
//     eligibilityDiscountUsage: userInfo.eligibiltyDiscountUsage || {},
//     loyaltyPoints: userInfo.loyaltyPoints || 0,
//     is_eligibility_verified: eligibilityInfo?.isVerified || false,
//     cartItemCount: cartInfo?.items.length || 0,
//     orderCount,
//   };
//   // console.log(user);
//   return user;
// };
