import type { Request, NextFunction, Response } from "express";
import { wrapResponse } from "../../utils/response.util.js";
import * as ProductService from "./product.service.js";
import type { EditableProductFields, IProduct } from "./product.types.js";
import type { ApiResponse } from "../../types/api.js";

export const create = async (
  req: Request<{}, {}, Omit<EditableProductFields, "images">>,
  res: Response<ApiResponse<IProduct>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { body, files } = req;
    if (!body) throw new Error("empty product body");
    const imageFiles = Array.isArray(files) ? files : undefined;

    const result = await ProductService.create(body, imageFiles);

    wrapResponse<IProduct>("ok", 200, res, result);
  } catch (error) {
    next(error);
  }
};

export const getAll = async (
  req: Request,
  res: Response<ApiResponse<IProduct[]>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await ProductService.getAll();

    wrapResponse("OK", 200, res, result);
  } catch (error) {
    next(error);
  }
};

export const getById = async (
  req: Request<{ productId: string }>,
  res: Response<ApiResponse<IProduct>>,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;
    if (!productId) throw new Error("productID is required");

    const result = await ProductService.getById(productId);

    wrapResponse("OK", 200, res, result);
  } catch (error) {
    next(error);
  }
};
