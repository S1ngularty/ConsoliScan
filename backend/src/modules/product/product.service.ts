import {
  createProduct,
  findProductByBarcode,
  getProductById,
  ProductHardDelete,
  productList,
  ProductRestore,
  ProductSoftDelete,
  ProductUpdateStock,
  searchProduct,
  updateProduct,
} from "./product.repository.js";
import type {
  Barcodes,
  BarcodeSearchResult,
  EditableProductFields,
  IProduct,
  IProductImage,
  SearchProductResult,
} from "./product.types.js";
import * as CatalogService from "../catalog/catalog.service.js";
import slugify from "slugify";
import { uploadImage, deleteAssets } from "../../core/utils/image.util.js";

export const create = async (
  payload: Omit<EditableProductFields, "images">,
  files?: Express.Multer.File[],
): Promise<IProduct> => {
  let newImages: IProductImage[] = [];

  if (files && files.length > 0) {
    //    let temp = await uploadImage(request.files, "products");
    //       newImages = Array.isArray(temp) ? temp : [temp];

    newImages = await uploadImage(files, "products");
  }

  payload.slug = slugify(payload.name);
  const completePayload: EditableProductFields = {
    ...payload,
    images: newImages,
  };

  const product = await createProduct(completePayload);

  CatalogService.bumpVersion(); // Side Effect

  return product.toObject();
};

export const getAll = async (): Promise<IProduct[]> => {
  const products = (await productList()).map((product) => product.toObject());
  return products;
};

export const getById = async (productId: string): Promise<IProduct> => {
  const product = await getProductById(productId);
  if (!product) throw new Error("product is not found");

  return product?.toObject();
};

export const search = async (word: string): Promise<SearchProductResult[]> => {
  if (!word || word.trim().length < 2) return [];

  const searchTerm = word.trim();

  const products = await searchProduct(searchTerm);

  return products;
};

export const update = async (
  productId: string,
  payload: Omit<EditableProductFields, "images">,
  files?: Express.Multer.File[],
): Promise<IProduct> => {
  let newImages: IProductImage[] = [];

  // if(files && files.length >0){ TODO: image stream
  //   let temp = await uploadImage(request.files, "products");
  //      newImages = Array.isArray(temp) ? temp : [temp];
  // }

  if (files && files.length > 0) {
    newImages = await uploadImage(files, "products");
  }

  const product = await updateProduct(productId, payload, newImages);

  if (!product) throw new Error("failed to update the product");

  CatalogService.bumpVersion(); // Side Effect

  return product;
};

export const removeImg = async (
  publicId: string,
  productId: string,
): Promise<boolean> => {
  
  const result = await deleteAssets([publicId]);
  const deletionStatus = result?.deleted?.[publicId];

  if (deletionStatus !== "deleted" && deletionStatus !== "not_found") {
    throw new Error("failed to delete image from Cloudinary");
  }
  if (!result) throw new Error("failed to delete the image");
  const updateProductImage = await getProductById(productId);

  if (!updateProductImage) throw new Error("product is not found");

  updateProductImage.images = updateProductImage.images.filter(
    (image) => image.public_id !== publicId,
  );

  await updateProductImage.save();

  CatalogService.bumpVersion();

  return deletionStatus === "deleted";
};

export const softDelete = async (publicId: string): Promise<IProduct> => {
  const product = await ProductSoftDelete(publicId);

  if (!product) throw new Error("Failed to delete the product");
  CatalogService.bumpVersion();

  return product.toObject();
};

export const restore = async (productId: string): Promise<IProduct> => {
  const product = await ProductRestore(productId);

  if (!product) throw new Error("Failed to restore the product");
  CatalogService.bumpVersion();

  return product.toObject();
};

export const hardDelete = async (productId: string): Promise<IProduct> => {
  const product = await ProductHardDelete(productId);

  if (!product) throw new Error("Failed to permanently delete the product");
  CatalogService.bumpVersion();

  return product.toObject();
};

export const updateStock = async (
  productId: string,
  newStock: number,
): Promise<IProduct> => {
  const product = await ProductUpdateStock(productId, newStock);
  if (!product) throw new Error("Failed to update stock the product");
  CatalogService.bumpVersion();

  return product.toObject();
};

// get barcode now is use by two user (customer & merchandiser)
//  instead of creating new service, routes, and controllers with minimal changes
export const getBarcode = async (
  // TODO: validate the barcode type first before invoking repository functions
  type: Barcodes,
  data: string,
): Promise<BarcodeSearchResult> => {
  const product = await findProductByBarcode(type, data);

  if (!product)
    return {
      found: false,
      barcode: data,
    };

  return { product: product, found: true, barcode: data };
};
