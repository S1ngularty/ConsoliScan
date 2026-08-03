import type { Request, Response, NextFunction } from "express";
import * as AuthService from "./auth.service.js";
import type { RegisterPayload, ReturnAuthPayload } from "./auth.types.js";
import type { ApiResponse } from "../../types/api.js";

export const register = async (
  req: Request<{}, {}, RegisterPayload>,
  res: Response<ApiResponse<ReturnAuthPayload>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await AuthService.register(req.body);

    res.status(201).json({
      message: "OK",
      success: true,
      result: result,
    });
  } catch (error) {
    next(error);
  }
};
