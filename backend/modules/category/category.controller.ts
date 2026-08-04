import type { Request, Response, NextFunction } from "express";
import * as CategoryService from "./category.service.js";
import type { ApiResponse } from "../../types/api.js";
import type {
  CategoryListReturn,
  EditableCategoryFields,
  ICategory,
} from "./category.types.js";

export const categoryList = async (
  req: Request,
  res: Response<ApiResponse<CategoryListReturn[]>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await CategoryService.list();

    res.status(200).json({
      message: "OK",
      success: true,
      result: result,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: Request<{}, {}, { categories: ICategory[] }>,
  res: Response<ApiResponse<ICategory[]>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { categories } = req.body;
    const result = await CategoryService.create(categories);

    res.status(200).json({
      message: "OK",
      success: true,
      result: result,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request<{ categoryId: string }, {}, EditableCategoryFields>,
  res: Response<ApiResponse<ICategory>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const categoryId = req.params.categoryId;
    const updateData = req.body;
    const result = await CategoryService.update(categoryId, updateData);

    res.status(200).json({
      message: "OK",
      success: true,
      result: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategories = async (
  req: Request<{}, {}, { categoryIds: string[] }>,
  res: Response<ApiResponse<{ acknowledged: boolean; deletedCount: number }>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { categoryIds } = req.body;
    const result = await CategoryService.deleteCategories(categoryIds);

    res.status(200).json({
      message: "OK",
      success: true,
      result: result,
    });
  } catch (error) {
    next(error);
  }
};
