import { User, type UserDocument } from "./user.model.js";
import type { UpdateUserFields } from "./user.types.js";
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
