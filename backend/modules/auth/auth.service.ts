import * as authRepository from "./auth.repository.js";
import type {
  LoginPayload,
  RegisterPayload,
  ReturnAuthPayload,
} from "./auth.types.js";
import * as AuthRepository from "./auth.repository.js";
import * as bcrypt from "bcrypt";

export const register = async (
  payload: RegisterPayload,
): Promise<ReturnAuthPayload> => {
  if (!payload) throw new Error("undefined payload");
  const { name, email, age, sex, password } = payload;

  const hashPassword = await bcrypt.hash(password, 10);
  const registeredUser = await AuthRepository.registerUser({
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

  const token = registeredUser.getToken();
  if (!token) throw new Error("failed to create  a token");

  return { user, token };
};

export const login = async (
  payload: LoginPayload,
): Promise<ReturnAuthPayload> => {
  const { email, password } = payload;

  let userData = await AuthRepository.findUserByEmail(email);
  if (!userData) throw new Error("account not found");
  if (userData.status === "inactive") throw new Error("account is inactive");

  // if (userData.role === "user") {
  //   eligibilityStatus = await Eligible.findOne({ user: userData._id });
  // }

  const isMatched = await bcrypt.compare(password, userData.password!);
  if (!isMatched) throw new Error("password does not match");
  const token = userData.getToken();

  if (!token) throw new Error("failed to generate user token");

  const user = {
    userId: String(userData._id),
    name: userData.name,
    email: userData.email,
    role: userData.role,
    status: userData.status,
  };

  return { user, token };
};
