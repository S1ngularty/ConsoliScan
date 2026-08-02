import { User, type UserDocument } from "../users/user.model.js";
import type { RegisterPayload } from "./auth.types.js";

export const registerUser = async (
  userData: RegisterPayload,
): Promise<UserDocument> => {
  const result = await User.create(userData);

  return result;
};
