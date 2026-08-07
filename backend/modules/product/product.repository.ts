import type { ICategory } from "../category/category.types.js";
import { type ProductDocument, Product } from "./product.model.js";
import type {
  EditableProductFields,
  IProduct,
  SearchProductResult,
} from "./product.types.js";

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

export const searchProduct = async (
  searchTerm: string,
): Promise<SearchProductResult[]> => {
  const result = await Product.find({
    deletedAt: null,
    $or: [
      { barcode: { $regex: searchTerm, $options: "i" } },
      { name: { $regex: searchTerm, $options: "i" } },
      { sku: { $regex: searchTerm, $options: "i" } },
    ],
  })
    .populate<{ category: ICategory }>("category")
    .limit(20)
    .select("_id name barcode sku price stockQuantity images category")
    .lean();

  return result;
};

export const updateProduct = async (
  productId: string,
  payload: Omit<EditableProductFields, "images">,
  images: Pick<IProduct, "images">[],
): Promise<IProduct | null> => {
  const result = await Product.findByIdAndUpdate(
    productId,
    {
      ...payload,
      $push: { images: { $each: images } },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return result;
};

export const ProductSoftDelete = async (
  productId: string,
): Promise<ProductDocument | null> => {
  const result = await Product.findByIdAndUpdate(productId, {
    deletedAt: new Date(),
  });

  return result;
};

export const ProductRestore = async (
  productId: string,
): Promise<ProductDocument | null> => {
  const result = await Product.findByIdAndUpdate(productId, {
    deletedAt: null,
  });

  return result;
};

export const ProductHardDelete = async (
  productId: string,
): Promise<ProductDocument | null> => {
  const result = await Product.findByIdAndDelete(productId);

  return result;
};

export const ProductUpdateStock = async (
  productId: string,
  stock: number,
): Promise<ProductDocument | null> => {
  const result = await Product.findByIdAndUpdate(
    productId,
    { stockQuantity: stock },
    {
      new: true,
      runValidators: true,
    },
  );

  return result;
};
