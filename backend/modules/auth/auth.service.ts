import type {
  JWTtokenProperties,
  LoginPayload,
  RegisterPayload,
  ReturnAuthPayload,
  UserAuthProperties,
} from "./auth.types.js";
import * as AuthRepository from "./auth.repository.js";
import * as bcrypt from "bcrypt";
import * as UserService from "../users/user.service.js";
export const register = async (
  payload: RegisterPayload,
): Promise<ReturnAuthPayload> => {
  if (!payload) throw new Error("undefined payload");
  const { name, email, age, sex, password } = payload;

  const hashPassword = await bcrypt.hash(password, 10);
  const { registeredUser, token } = await UserService.RegisterUser({
    name,
    email,
    age,
    sex,
    password: hashPassword,
  });
  const user = {
    userId: String(registeredUser._id),
    name: registeredUser.name,
    email: registeredUser.email,
    role: registeredUser.role,
    status: registeredUser.status,
  };

  if (!token) throw new Error("failed to create  a token");

  return { user, token };
};

export const login = async (
  payload: LoginPayload,
): Promise<ReturnAuthPayload> => {
  const { email, password } = payload;

  let userData = await UserService.findByEmail(email);
  if (!userData) throw new Error("account not found");
  if (userData.status === "inactive") throw new Error("account is inactive");

  // if (userData.role === "user") {
  //   eligibilityStatus = await Eligible.findOne({ user: userData._id });
  // }

  const isMatched = await bcrypt.compare(password, userData.password!);
  if (!isMatched) throw new Error("password does not match");

  const token = userData.getToken();
  if (!token) throw new Error("failed to generate user token");

  const user = userData.buildAuthReturnObject();

  return { user, token };
};

export const verifyToken = async (
  creds: JWTtokenProperties,
): Promise<ReturnAuthPayload> => {
  const { userId } = creds;

  const userData = await AuthRepository.findAuthUserById(userId);
  if (!userData) throw new Error("token expired");
  // if (user.role === "user") {
  //   eligibilityStatus = await Eligible.findOne({ user: user.userId });
  // }
  const token = userData?.getToken();
  const user = userData?.buildAuthReturnObject();

  if (!token) throw new Error("Failed to refresh token");

  return { user, token };
};

export const logout = async (payload: UserAuthProperties): Promise<void> => {
  // response.clearCookie("token", {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "none",
  //   path: "/",
  // });
  // createLog(
  //   request.user.userId,
  //   "LOGOUT",
  //   "SUCCESS",
  //   `${request.user.name} logged out to the system as ${request.user.role}`,
  // );
};
