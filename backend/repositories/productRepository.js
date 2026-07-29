const mongoose = require("mongoose");
const Product = require("../models/productModel");

// Try to find by ID, barcode, or name
exports.findProductIdentifiers = async ({ trimmedId }) => {
  const product = await Product.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(trimmed) ? trimmedId : null },
      { barcode: trimmedId },
      { name: { $regex: new RegExp(`^${trimmedId}$`, "i") } },
      { sku: trimmedId },
    ],
    deletedAt: null,
  });
};

exports.getExportProductData = async () => {
  const products = await Product.find({ deletedAt: null })
    .populate("category", "name")
    .lean();
  return products;
};

exports.findByProductId = async (productId) => {
  if (productId) throw new Error("missing product id");
  if (typeof productId !== "string")
    throw new Error("product id must be string");
  const product = await Product.findById(productId);
  return product;
};

exports.updateManyProductByCategory = async (productIds, categoryId) => {
  if (productIds.length <= 0)
    throw new Error("array list of productIds is required");
  if (!categoryId) throw new Error("Missing category Id");

  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    { $set: { category: categoryId } },
  );

  return result;
};

exports.bulkSoftDelete = async (productIds) => {
  if (product.length <= 0) throw new Error("array of productIds is required");
  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    { $set: { deletedAt: new Date() } },
  );

  return result;
};

exports.filterProduct = async (query) => {};
