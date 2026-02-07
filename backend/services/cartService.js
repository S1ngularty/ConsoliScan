const Cart = require("../models/cartModel");
const mongoose = require("mongoose");

exports.updateCart = async (request) => {
  if (!request.body) throw new Error("request content is empty");
  const updatedCart = request.body;
  const { userId } = request.user;
  // console.log(updatedCart, userId);
  const cart = await Cart.findOneAndUpdate({ user: userId }, updatedCart, {
    new: true,
    upsert: true,
    runValidators: true,
  });

  if (!cart) throw new Error("failed to update the user cart");
  return cart;
};

exports.getById = async (request) => {
  const { userId } = request.user;

  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    populate: {
      path: "category"
    }
  });

  if (!cart) return [];

  const formattedItems = cart.items.map((item) => {
    const product = item.product.toObject();

    return {
      ...product,
      qty: item.qty,
      selectedQuantity: item.qty,
      addedAt: item.addedAt,
    };
  });

  return formattedItems;
};

exports.clearCart = async (request) => {
  const { userId } = request.user;
  const result = await Cart.findOneAndDelete({ user: userId }, { new: true });
  return result;
};
