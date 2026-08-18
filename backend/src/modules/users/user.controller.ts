import { type Request, type Response, type NextFunction } from "express";
import * as UserService from "./user.service.js";
import type { ApiResponse } from "../../core/types/api.js";
import type {
  CreateUserProperties,
  IUser,
  systemRoles,
  UpdateUserFields,
} from "./user.types.js";

export const update = async (
  req: Request<{ userId: string }, {}, UpdateUserFields> & {
    file?: Express.Multer.File;
  },
  res: Response<ApiResponse<IUser | null>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await UserService.update(req.params.userId, req.body);

    res.status(201).json({
      success: true,
      message: "User update is successful!",
      result: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (
  req: Request<{ userId: string }>,
  res: Response<ApiResponse<IUser[] | null>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const users = await UserService.getAll(req.user!);
    res.json({
      success: true,
      message: "OK",
      result: users,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (
  req: Request<{ userId: string }>,
  res: Response<ApiResponse<IUser | null>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await UserService.getById(req.params.userId);

    res.status(200).json({
      message: "OK",
      success: true,
      result: user,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: Request<{}, {}, CreateUserProperties> & {
    file?: Express.Multer.File;
  },
  res: Response<ApiResponse<IUser | null>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { body, file } = req;
    const user = await UserService.create(req.body);
    res.status(200).json({
      message: "OK",
      success: true,
      result: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request<{ userId: string }>,
  res: Response<ApiResponse<IUser | null>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const deleteUser = await UserService.deleteUser(req.params.userId);
    res.status(200).json({
      message: "OK",
      success: true,
      result: deleteUser,
    });
  } catch (error) {
    next(error);
  }
};

export const rolesAndPermission = async (
  req: Request<{ userId: string }, {}, { role: systemRoles }>,
  res: Response<ApiResponse<IUser | null>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const role = req.body.role;
    const userId = req.params.userId;

    const user = await UserService.rolesAndPermission({ role, userId });

    res.status(200).json({
      message: "OK",
      success: true,
      result: user,
    });
  } catch (error) {
    next(error);
  }
};
