import type { Request, NextFunction, Response } from "express";
import { wrapResponse } from "../../utils/response.util.js";
import * as ProductService from "./product.service.js";
import {
  BARCODE_TYPES,
  type Barcodes,
  type BarcodeSearchResult,
  type EditableProductFields,
  type IProduct,
  type SearchProductResult,
} from "./product.types.js";
import type { ApiResponse, ResponseDefault } from "../../types/api.js";

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
): Promise<void> => {
  try {
    const { productId } = req.params;
    if (!productId) throw new Error("productID is required");

    const result = await ProductService.getById(productId);

    wrapResponse("OK", 200, res, result);
  } catch (error) {
    next(error);
  }
};

export const search = async (
  req: Request<{}, {}, {}, { word: string }>,
  res: Response<ApiResponse<SearchProductResult[]>>,
  next: NextFunction,
): Promise<void> => {
  try {
    /* from the legacy code the query key is set to q
      but after migrating i switch it up to word */
    const { word } = req.query;
    const result = await ProductService.search(word);

    wrapResponse("OK", 200, res, result);
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request<
    { productId: string },
    {},
    Omit<EditableProductFields, "images">
  >,
  res: Response<ApiResponse<IProduct>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId } = req.params;
    const { files, body } = req;

    const images = Array.isArray(files) ? files : undefined;
    if (!productId) throw new Error("productID is required");

    const result = await ProductService.update(productId, body, images);

    wrapResponse("OK", 200, res, result);
  } catch (error) {
    next(error);
  }
};

export const softDelete = async (
  req: Request<{ productId: string }>,
  res: ResponseDefault<IProduct>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId } = req.params;

    const result = await ProductService.softDelete(productId);

    wrapResponse("OK", 200, res, result);
  } catch (error) {
    next(error);
  }
};

export const restore = async (
  req: Request<{ productId: string }>,
  res: ResponseDefault<IProduct>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId } = req.params;

    const result = await ProductService.restore(productId);

    wrapResponse("OK", 200, res, result);
  } catch (error) {
    next(error);
  }
};

export const hardDelete = async (
  req: Request<{ productId: string }>,
  res: ResponseDefault<IProduct>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId } = req.params;

    const result = await ProductService.hardDelete(productId);

    wrapResponse("OK", 200, res, result);
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (
  req: Request<{ productId: string }, {}, Pick<IProduct, "stockQuantity">>,
  res: ResponseDefault<IProduct>,
  next: NextFunction,
): Promise<void> => {
  try {
    /* the property name stockQuantity is still initial becuase
    its still not sure what field the client putting the actual data */
    const { productId } = req.params;
    const { stockQuantity } = req.body;

    const result = await ProductService.updateStock(productId, stockQuantity);
    wrapResponse("OK", 200, res, result);
  } catch (error) {
    next(error);
  }
};

export const getBarcode = async (
  req: Request<{}, {}, {}, { type: Barcodes; data: string }>,
  res: ResponseDefault<BarcodeSearchResult | null>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { type, data } = req.query;
    //TODO: query fields must be validated
    const result = await ProductService.getBarcode(type, data);
    wrapResponse("OK", 200, res, result);
  } catch (error) {
    next(error);
  }
};
