const Product = require("../models/productModel");
const { uploadImage } = require("../utils/cloundinaryUtil");

const create = async (request) => {
  if (!request.body) throw new Error(`theres no payload`);
  if (request.files)
    request.body.images = [...(await uploadImage(request.files))];
  const product = await Product.create(request.body);
  if (!product) throw new Error("failed to create the product");
  console.log(product);
  return product;
};

module.exports = { create };
