import type { Request, Response, NextFunction } from "express";
import * as EligibleService from "./eligible.service.js";
import { wrapResponse } from "../../core/utils/response.util.js";
import type {
  EligibleFiles,
  IEligibleCreate,
  IEligibleLean,
} from "./eligible.types.js";
import type { ApiResponse } from "../../core/types/api.js";

export const createEligibleRequest = async (
  req: Request<
    { userId: string },
    {},
    Omit<IEligibleCreate, "idImage" | "userPhoto" | "user">
  > & { files: EligibleFiles },
  res: Response<ApiResponse<IEligibleLean>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { body, files } = req;
    if (!userId) throw new Error("userId is required");
    const result = EligibleService.create(userId, body, files);

    // wrapResponse<IEligibleLean>(
    //   "Eligibility Request was submitted successfully",
    //   200,
    //   res,
    //   result,
    // );
  } catch (error) {
    next(error);
  }
};
