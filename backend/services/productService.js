const Product = require("../models/productModel");

const create = async (request) => {
  if (!req.body) throw new Error(`theres no payload`);
  if(req.files) return
  const product = await Product.create(request.body);
  if (!product) throw new Error("failed to create the product");
  return product;
};
