const Product = require("../models/productModel");
const { uploadImage } = require("../utils/cloundinaryUtil");
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
  const products = await Product.find();
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

module.exports = { create, getAll, getById, update };
