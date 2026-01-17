const Product = require("../models/productModel");
const { uploadImage, deleteAssets } = require("../utils/cloundinaryUtil");
const slugify = require("slugify");

const create = async (request) => {
  if (!request.body) throw new Error(`theres no payload`);
  if (request?.files)
    request.body.images = [...[await uploadImage(request.files, "products")]];
  let slug = slugify(request.body.name);
  request.body.slug = slug;
  const product = await Product.create(request.body);
  if (!product) throw new Error("failed to create the product");
  return product;
};

const getAll = async (request) => {
  const products = await Product.find({ deletedAt: null });
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

  if (!product) throw new Error("failed to update the product");
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
  return isUpdated;
};

const hardDelete = async (request) => {
  const { productId } = request.params;
  const deletedProduct = await Product.findByIdAndDelete(productId);
  if(!deletedProduct) throw new Error("failed to delete the product")
  if(deletedProduct.images){
    const publicIds = deletedProduct.map((image)=>image.public_id)
    const imageDeleted = deleteAssets(publicIds)
  }
  };

module.exports = { create, getAll, getById, update, removeImg, softDelete,hardDelete };
