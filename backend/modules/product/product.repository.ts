import { type ProductDocument, Product } from "./product.model.js";
import type { EditableProductFields } from "./product.types.js";

export const createProduct = async (
  payload: EditableProductFields,
): Promise<ProductDocument> => {
  const result = await Product.create(payload);

  return result;
};

export const productList = async (): Promise<ProductDocument[]> => {
  const result = await Product.find({ deletedAt: null });
  return result;
};

export const getProductById = async (
  productId: string,
): Promise<ProductDocument | null> => {
  const result = await Product.findById(productId);
  return result;
};
