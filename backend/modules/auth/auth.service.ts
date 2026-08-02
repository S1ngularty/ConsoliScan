import * as authRepository from "./auth.repository.js";
import type { RegisterPayload, ReturnAuthPayload } from "./auth.types.js";
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
