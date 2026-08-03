import type { Request, Response, NextFunction } from "express";
import * as AuthService from "./auth.service.js";
import type {
  LoginPayload,
  RegisterPayload,
  ReturnAuthPayload,
} from "./auth.types.js";
import type { ApiResponse } from "../../types/api.js";

export const register = async (
  req: Request<{}, {}, RegisterPayload>,
  res: Response<ApiResponse<ReturnAuthPayload>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await AuthService.register(req.body);

    res.status(200).json({
      message: "OK",
      success: true,
      result: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, LoginPayload>,
  res: Response<ApiResponse<ReturnAuthPayload>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await AuthService.login(req.body);
    res.status(200).json({
      message: "OK",
      success: true,
      result: result,
    });
  } catch (error) {
    next(error);
  }
};
