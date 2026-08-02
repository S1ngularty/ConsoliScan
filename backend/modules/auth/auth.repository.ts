import { User, type UserDocument } from "../users/user.model.js";
import type { RegisterPayload } from "./auth.types.js";

export const registerUser = async (
  userData: RegisterPayload,
): Promise<UserDocument> => {
  const result = await User.create(userData);

  return result;
};

export const findUserByEmail = async (
  email: string,
): Promise<UserDocument | null> => {
  const result = await User.findOne({ email }).select(
    "+password role email name status createdAt",
  );

  return result;
};

export const findAuthUserById = async (
  userId: string,
): Promise<UserDocument | null> => {
  const result = await User.findById(userId);
  return result;
};
