import type {
  UpdateUserFields,
  CurrUser,
  CreateUserProperties,
  IUser,
  RolesAndInformationTypes,
  ReturnPlainUserDocument,
  IAvatar,
} from "./user.types.js";
import * as UserRepository from "./user.repository.js";
import type { UserDocument } from "./user.model.js";
import { uploadImage, deleteAssets } from "../../core/utils/image.util.js";
// const Eligibility = require("../models/eligibleModel");
// const Cart = require("../models/cartModel");
// const Order = require("../models/orderModel");
// const { createLog } = require("../services/activityLogsService");

export const update = async (
  userId: string,
  payload: UpdateUserFields,
  file?: Express.Multer.File,
): Promise<IUser> => {
  let avatar: IAvatar<string>[] = [];

  if (file) avatar = await uploadImage([file], "users");

  if (avatar && avatar.length > 0 && typeof avatar[0] !== "undefined")
    payload.avatar = avatar[0];

  const user = await UserRepository.UpdateUser(userId, payload);
  if (!user) throw new Error("User not found");

  if (user?.avatar?.public_id) deleteAssets([user.avatar.public_id]);

  return user?.toObject();
};

export const getAll = async (
  user: CurrUser,
): Promise<ReturnPlainUserDocument[]> => {
  const { userId } = user;

  const users = await UserRepository.getAllUsers(userId);

  return users;
};

export const getById = async (
  userId: string,
): Promise<ReturnPlainUserDocument> => {
  const fetchedUser = await UserRepository.getUserById(userId);

  if (!fetchedUser) throw new Error("User not found!");

  return fetchedUser.toObject();
};

export const create = async (
  payload: CreateUserProperties,
  file?: Express.Multer.File,
): Promise<ReturnPlainUserDocument> => {
  if (!payload) throw new Error("Missing payload");

  let avatar: IAvatar<string>[] = [];

  if (file) avatar = await uploadImage([file], "users");

  if (avatar && avatar.length > 0 && typeof avatar[0] !== "undefined")
    payload.avatar = avatar[0];

  const user = await UserRepository.createUser(payload);
  if (!user) throw new Error("Failed to create the user");
  return user.toObject();
};

export const RegisterUser = async (
  payload: CreateUserProperties,
): Promise<{
  registeredUser: ReturnPlainUserDocument;
  token: string | null;
}> => {
  if (!payload) throw new Error("Missing payload");

  const user = await UserRepository.createUser(payload);
  const token = user.getToken();

  if (!user) throw new Error("Failed to create the user");
  return { registeredUser: user.toObject(), token: token };
};

export const deleteUser = async (
  userId: string,
): Promise<ReturnPlainUserDocument> => {
  if (!userId) throw new Error("Missing userId");

  const deletedUser = await UserRepository.userDelete(userId);
  if (!deletedUser) throw new Error("Failed to delete the user");
  // if (deletedUser.avatar?.public_id)
  //   deleteAssets([deletedUser.avatar.public_id]);

  return deletedUser.toObject();
};

export const rolesAndPermission = async (
  data: RolesAndInformationTypes,
): Promise<ReturnPlainUserDocument> => {
  const { role, userId } = data;
  const user = await UserRepository.EditRolesAndPermission(userId, role);

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

export const findByEmail = async (
  email: string,
): Promise<UserDocument | null> => {
  const user = await UserRepository.findByEmailAndFetchPassword(email);

  return user;
};
