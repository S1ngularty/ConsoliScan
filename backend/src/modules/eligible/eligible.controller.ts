import type { Request, Response, NextFunction } from "express";
import * as EligibleService from "./eligible.service.js";
import { wrapResponse } from "../../core/utils/response.util.js";
import type {
  EligibleFiles,
  IEligibleCreate,
  IEligibleLean,
  IEligibleUpdate,
} from "./eligible.types.js";
import type { ApiResponse } from "../../core/types/api.js";

export const createEligibleRequest = async (
  req: Request<
    { userId: string },
    {},
    Omit<IEligibleCreate, "idImage" | "userPhoto" | "user">
  >,
  res: Response<ApiResponse<IEligibleLean>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { body, files } = req;
    if (!userId) throw new Error("userId is required");

    if (!files) {
      throw new Error("ID images field are required");
    }
    const eligibleFiles = files as EligibleFiles;
    const result = await EligibleService.create(userId, body, eligibleFiles);

    wrapResponse<IEligibleLean>(
      "Eligibility Request was submitted successfully",
      200,
      res,
      result,
    );
  } catch (error) {
    next(error);
  }
};

export const getAllEligibles = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await EligibleService.getAll();

    wrapResponse("OK", 200, res, result);
  } catch (error) {
    next(error);
  }
};

export const updateEligibilty = async (
  req: Request<{ memberId: string }, {}, IEligibleUpdate>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { memberId } = req.params;
    const { body } = req;
    const result = await EligibleService.updateEligibility(memberId, body);

    wrapResponse("OK", 200, res, result);
  } catch (error) {
    next(error);
  }
};
