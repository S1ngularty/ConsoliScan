export type systemRoles =
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

interface UserAuthProperties {
  userId: string;
  email: string;
  password?: string;
  name: string;
  role: systemRoles;
  status: "active" | "inactive" | undefined;
}

export interface ReturnAuthPayload {
  user: UserAuthProperties;
  token: string;
  eligibilityStatus?: unknown;
}
