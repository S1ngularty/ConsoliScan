import * as CatalogService from "./catalog.service.js";
import type { Request, Response, NextFunction } from "express";
import { wrapResponse } from "../../core/utils/response.util.js";
import type { ICatalog } from "./catalog.types.js";

export const getVersion = async (
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await CatalogService.getVersion();

    wrapResponse<ICatalog>("OK", 200, res, { version: result });
  } catch (error) {
    next(Error);
  }
};
