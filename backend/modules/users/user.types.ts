import mongoose, { type Require_id } from "mongoose";

export type systemRoles =
  | "user"
  | "admin"
  | "super_admin"
  | "checker"
  | "merchandiser";

interface IAvatar<T> {
  public_id: T;
  url: T;
}

interface ILoyaltyHistory {
  event: "earn" | "redeem";
  points: number;
  date: Date;
}

interface IEligibilityDiscountUsage {
  discountUsed: number;
  purchasedUsed: number;
  weekStart: Date;
  weekEnd: Date;
}

export interface IUser {
  firebaseUid?: string;
  name: string;
  email: string;
  password?: string | null;

  sex?: "male" | "female" | null;
  age?: number;
  birthDate?: Date;

  address?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;

  contactNumber?: string;

  avatar?: IAvatar<string>;

  role: systemRoles;

  loyaltyPoints?: number;

  loyaltyHistory?: ILoyaltyHistory[];
  eligibilityDiscountUsage?: IEligibilityDiscountUsage;

  savedItems?: mongoose.Schema.Types.ObjectId[];

  status?: "active" | "inactive";

  lastLogin?: Date;

  resetPasswordToken?: string;
  resetPasswordExpire?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  getToken(): string | null;
  updateLastLogin(): Promise<void>;
  buildAuthReturnObject(): Required<
    Pick<IUser, "email" | "role" | "status" | "name"> & {
      userId: string;
    }
  >;
}

export interface CurrUser {
  userId: string;
  email: string;
  role: IUser["role"];
}

// export interface UpdateUserFields {
//   userId: string;
//   body: Record<string, unknown>;
//   actor: CurrUser;
//   file?: object;
// }

export interface EditableUserProperties {
  name: string;
  email: string;
  password?: string | null;

  sex?: "male" | "female" | null;
  age?: number;
  birthDate?: Date;

  address?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;

  contactNumber?: string;
}

export type UpdateUserFields = Omit<EditableUserProperties, "email">;

export type RolesAndInformationTypes = Omit<CurrUser, "email">;

export type ReturnPlainUserDocument = IUser & {
  _id: mongoose.Types.ObjectId;
};
