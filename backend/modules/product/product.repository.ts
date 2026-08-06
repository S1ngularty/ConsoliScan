import { type ProductDocument, Product } from "./product.model.js";
import type { EditableProductFields } from "./product.types.js";

export const createProduct = async (
  payload: EditableProductFields,
): Promise<ProductDocument> => {
  const result = await Product.create(payload);

  return result;
};