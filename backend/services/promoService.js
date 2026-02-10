const Promo = require("../models/promoModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");

exports.getAll = async (request) => {
  const promos = await Promo.find();
  return promos;
};

exports.create = async (request) => {
  if (!request.body) throw new Error("empty body");
  const newPromo = await Promo.create(request.body);
  if (!newPromo) throw new Error("failed to create the promo");
  return newPromo;
};

exports.getSelection = async (request) => {
  const [products, categories] = await Promise.all([
    Product.find({}).select("_id name"),
    Category.find({}).select("_id categoryName"),
  ]);

  return { products, categories };
};

exports.updatePromo = async (request) => {
  if (!request.body) throw new Error("empty body request");
  const { promoId } = request.params;
  const updatedPromo = await Promo.findByIdAndUpdate(promoId, request.body, {
    new: true,
    upsert: true,
    runValidators: true,
  });

  if (!updatedPromo) throw new Error("failed to update the promo");

  return updatedPromo;
};


