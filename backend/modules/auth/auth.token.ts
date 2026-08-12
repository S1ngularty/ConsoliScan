import jwt from "jsonwebtoken";
import type { AuthUser, JWTtokenProperties } from "./auth.types.js";

export const generateToken = (user: AuthUser): string | null => {
  const secret: string | undefined = process.env.JWT_SECRET;
  const exp: string | undefined = process.env.JWT_EXP;
  const payload = {
    userId: user._id,
    name: user.name,
    role: user.role,
    status: user.status,
    email: user.email,
    createdAt: user.createdAt,
  };

  const options: jwt.SignOptions = {
    expiresIn: "7d",
  };

  if (!secret) {
    console.log("Missing JWT Secret");
    return null;
  }

  const token = jwt.sign(payload, secret, options);

  return token;
};
