import type { IUser, ReturnPlainUserDocument } from "../users/user.types.js";

type systemRoles =
  | "user"
  | "admin"
  | "super_admin"
  | "checker"
  | "merchandiser";

export interface RegisterPayload {
  name: string;
  email: string;
  age: number;
  sex: "male" | "female";
  password: string;
}

export type LoginPayload = Pick<RegisterPayload, "email" | "password">;

export interface UserAuthProperties {
  userId: string;
  email: string;
  name: string;
  role: systemRoles;
  status: "active" | "inactive" | undefined;
}

export interface ReturnAuthPayload {
  user: UserAuthProperties;
  token: string;
  eligibilityStatus?: unknown;
}

export type JWTtokenProperties = UserAuthProperties;
export type AuthUser = ReturnPlainUserDocument;
