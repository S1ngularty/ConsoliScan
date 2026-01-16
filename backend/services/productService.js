const Product = require("../models/productModel");
const { uploadImage } = require("../utils/cloundinaryUtil");

const create = async (request) => {
  if (!request.body) throw new Error(`theres no payload`);
  if (request?.files)
    request.body.images = [...(await uploadImage(request.files,'products'))];
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

module.exports = { create, getAll, getById };
