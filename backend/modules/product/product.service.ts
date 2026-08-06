import { createProduct } from "./product.repository.js";
import type {
  EditableProductFields,
  IProduct,
  IProductImage,
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
