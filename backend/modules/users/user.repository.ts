import { User, type UserDocument } from "./user.model.js";
import type {
  EditableUserProperties,
  IUser,
  ReturnPlainUserDocument,
  RolesAndInformationTypes,
  systemRoles,
  UpdateUserFields,
} from "./user.types.js";

export const UpdateUser = async (
  userId: string,
  body: UpdateUserFields,
): Promise<UserDocument | null> => {
  const result = await User.findByIdAndUpdate(userId, body, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const getAllUsers = async (excludeUser?: string): Promise<ReturnPlainUserDocument[]> => {
  const result = await User.find({ _id: { $ne: excludeUser } }).lean();
  return result;
};

export const getUserById = async (
  userId: string,
): Promise<UserDocument | null> => {
  const result = await User.findById(userId);
  return result;
};

export const createUser = async (
  body: EditableUserProperties,
): Promise<UserDocument> => {
  const result = await User.create(body);
  return result;
};

export const userDelete = async (
  userId: string,
): Promise<UserDocument | null> => {
  const result = await User.findByIdAndDelete(userId);
  return result;
};

export const EditRolesAndPermission = async (
  userId: string,
  role: systemRoles,
): Promise<UserDocument | null> => {
  const result = await User.findByIdAndUpdate(
    userId,
    { role: role },
    { new: true, runValidators: true },
  );
  return result;
};

export const findByEmail = async (
  email: string,
): Promise<UserDocument | null> => {
  const result = await User.findOne({ email: email });

  return result;
};
