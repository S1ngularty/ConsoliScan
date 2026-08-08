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
import slugify from "slugify";
// const CatalogVersion = require("../models/catalogVersionModel"); TODO

// const { uploadImage, deleteAssets } = require("../utils/cloundinaryUtil");

// TODO: Catalog Versioning
// const bumpCatalogVersion = async () => {
//   const updated = await CatalogVersion.findOneAndUpdate(
//     {},
//     { $inc: { version: 1 } },
//     { new: true, upsert: true },
//   );
//   return updated?.version || 1;
// };

// const getCatalogVersion = async () => {
//   const current = await CatalogVersion.findOne();
//   if (current) return current.version;
//   const created = await CatalogVersion.create({ version: 1 });
//   return created.version;
// };

// const getCatalog = async () => {
//   const products = await Product.find({ deletedAt: null }).populate("category");
//   return products;
// };

export const create = async (
  payload: Omit<EditableProductFields, "images">,
  files: Express.Multer.File[],
): Promise<IProduct> => {
  let newImages: IProductImage[] = [];

  if (files && files.length > 0) {
    //    let temp = await uploadImage(request.files, "products");
    //       newImages = Array.isArray(temp) ? temp : [temp];
  }

  payload.slug = slugify(payload.name);
  const completePayload: EditableProductFields = {
    ...payload,
    images: newImages,
  };

  const product = await createProduct(completePayload);

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
  files: Express.Multer.File[],
): Promise<IProduct> => {
  let newImages: Pick<IProduct, "images">[] = [];

  // if(files && files.length >0){ TODO: image stream
  //   let temp = await uploadImage(request.files, "products");
  //      newImages = Array.isArray(temp) ? temp : [temp];
  // }

  const product = await updateProduct(productId, payload, newImages);

  if (!product) throw new Error("failed to update the product");

  return product;
};

// export const removeImg =  async(publicId:string, productId:string):Promise<boolean>=>{
//    const { publicId } = request.query;
//     const { productId } = request.params;
//     const result = await deleteAssets([publicId]);
//     const deletionStatus = result?.deleted?.[publicId];
//     if (deletionStatus !== "deleted" && deletionStatus !== "not_found") {
//       throw new Error("failed to delete image from Cloudinary");
//     }
//     if (!result) throw new Error("failed to delete the image");
//     const updateProductImage = await Product.findById(productId);
//     updateProductImage.images = updateProductImage.images.filter(
//       (image) => image.public_id !== publicId,
//     );
//     console.log(updateProductImage.images);
//     await updateProductImage.save();
//     await bumpCatalogVersion();
//     return deletionStatus;
// }

export const softDelete = async (publicId: string): Promise<IProduct> => {
  const product = await ProductSoftDelete(publicId);

  if (!product) throw new Error("Failed to delete the product");
  // await bumpCatalogVersion();

  return product.toObject();
};

export const restore = async (productId: string): Promise<IProduct> => {
  const product = await ProductRestore(productId);

  if (!product) throw new Error("Failed to restore the product");
  // await bumpCatalogVersion();

  return product.toObject();
};

export const hardDelete = async (productId: string): Promise<IProduct> => {
  const product = await ProductHardDelete(productId);

  if (!product) throw new Error("Failed to permanently delete the product");
  // await bumpCatalogVersion();

  return product.toObject();
};

export const updateStock = async (
  productId: string,
  newStock: number,
): Promise<IProduct> => {
  const product = await ProductUpdateStock(productId, newStock);
  if (!product) throw new Error("Failed to update stock the product");
  // await bumpCatalogVersion();

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
