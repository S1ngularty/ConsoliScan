const Product = require("../models/productModel");
const { uploadImage, deleteAssets } = require("../utils/cloundinaryUtil");
const { createLog } = require("./activityLogsService");
const slugify = require("slugify");

const create = async (request) => {
  if (!request.body) throw new Error(`theres no payload`);
  console.log(request.user);
  let newImages = [];
  if (request.files && request.files.length > 0) {
    let temp = await uploadImage(request.files, "products");
    newImages = Array.isArray(temp) ? temp : [temp];
  }
  request.body.images = newImages;
  let slug = slugify(request.body.name);
  request.body.slug = slug;
  const product = await Product.create(request.body);
  if (!product) {
    createLog(
      request.user.userId,
      "CREATE_PRODUCT",
      "FAILED",
      `Failed to create new product named '${request.body.name}'`,
    );
    throw new Error("failed to create the product");
  }
  createLog(
    request.user.userId,
    "CREATE_PRODUCT",
    "SUCCESS",
    `create a new product named '${product.name}'`,
  );
  return product;
};

const getAll = async (request) => {
  const products = await Product.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category1",
      },
    },
    {
      $unwind: "$category1",
    },
    {
      $project: {
        "category1.__v": 0,
        "category1.createdAt": 0,
        "category1.updatedAt": 0,
        "category1.categoryName": 0,
      },
    },
    {
      $addFields: {
        category: "$category1._id",
      },
    },
    {
      $unset: "category1",
    },

    {
      $sort: { name: 1 },
    },
  ]);
  return products;
};

const getById = async (request = {}) => {
  const { productId } = request.params;
  const product = await Product.findById(productId);
  if (!product) throw new Error("product is not found");
  return product;
};

const update = async (request = {}) => {
  const { productId } = request.params;

  if (!request.body) throw new Error("unefined request body");
  let newImages = [];
  if (request.files && request.files.length > 0) {
    let temp = await uploadImage(request.files, "products");
    newImages = Array.isArray(temp) ? temp : [temp];
  }
  const updateQuery = {
    ...request.body,
    deletedAt: null,
  };
  if (newImages.length > 0) {
    updateQuery.$push = {
      images: { $each: newImages },
    };
  }
  const product = await Product.findByIdAndUpdate(productId, updateQuery, {
    new: true,
    upsert: true,
    runValidators: true,
  });

  if (!product) {
    createLog(
      request.user.userId,
      "CREATE_PRODUCT",
      "FAILED",
      `Failed to update the product named '${request?.body?.name || productId}'`,
    );
    throw new Error("failed to update the product");
  }
  createLog(
    request.user.userId,
    "UPDATE_PRODUCT",
    "SUCCESS",
    `updated the product named '${product.name}'`,
  );
  return product;
};

const removeImg = async (request) => {
  const { publicId } = request.query;
  const { productId } = request.params;
  const result = await deleteAssets([publicId]);
  const deletionStatus = result?.deleted?.[publicId];
  if (deletionStatus !== "deleted" && deletionStatus !== "not_found") {
    throw new Error("failed to delete image from Cloudinary");
  }
  if (!result) throw new Error("failed to delete the image");
  const updateProductImage = await Product.findById(productId);
  updateProductImage.images = updateProductImage.images.filter(
    (image) => image.public_id !== publicId,
  );
  console.log(updateProductImage.images);
  await updateProductImage.save();
  return deletionStatus;
};

const softDelete = async (request) => {
  const { productId } = request.params;
  const now = new Date();
  const isUpdated = await Product.findByIdAndUpdate(
    productId,
    {
      deletedAt: now,
    },
    { new: true },
  );

  if (!isUpdated) {
    createLog(
      request.user.userId,
      "TEMPORARY_DELETE",
      "FAILED",
      `Failed to temporarily delete the product with ID:'${productId}'`,
    );
    throw new Error("failed to temporarily delete the product");
  }

  createLog(
    request.user.userId,
    "TEMPORARY_DELETE",
    "SUCCESS",
    `Failed to temporarily delete the product named '${isUpdated.name}'`,
  );

  return isUpdated;
};

const restore = async (request) => {
  const { productId } = request.params;
  const restoredProduct = await Product.findByIdAndUpdate(
    productId,
    {
      deletedAt: null,
    },
    { new: true, runValidators: true },
  );

  if (!restoredProduct) {
    createLog(
      request.user.userId,
      "RESTORE_PRODUCT",
      "FAILED",
      `Failed to restore the product the with the ID: '${productId}'`,
    );
    throw new Error("failed to restore the product");
  }
  createLog(
    request.user.userId,
    "RESTORE_PRODUCT",
    "SUCCESS",
    `Successfully restored the deleted product named '${restoredProduct.name}'`,
  );
  return true;
};

const hardDelete = async (request) => {
  const { productId } = request.params;
  const deletedProduct = await Product.findByIdAndDelete(productId);
  if (!deletedProduct) {
    createLog(
      request.user.userId,
      "PERMANENT_DELETE",
      "FAILED",
      `Failed to permanently delete the product with ID:'${productId}'`,
    );
    throw new Error("failed to delete the product");
  }
  if (deletedProduct.images) {
    const publicIds = deletedProduct.map((image) => image.public_id);
    const imageDeleted = deleteAssets(publicIds);
  }
  createLog(
    request.user.userId,
    "PERMANENT_DELETE",
    "SUCCESS",
    `Permanently deleted the product named '${deletedProduct.name}'`,
  );
  return deletedProduct;
};

const updateStock = async (request) => {
  if (!request.body) throw new Error("undefined request body");
  const { productId } = request.params;
  const isUpdated = await Product.findByIdAndUpdate(productId, request.body, {
    new: true,
  });
  return isUpdated;
};

const getBarcode = async (request) => {
  console.log(request.query)
  return
  const { type, data } = request.query;
  const scannedProduct = await Product.findOne({
    barcode: data,
    barcodeType: type,
  });
  if (!scannedProduct) throw new Error("scanned Product not found");
  return scannedProduct;
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  removeImg,
  softDelete,
  hardDelete,
  restore,
  updateStock,
  getBarcode
};
