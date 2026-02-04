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

  const result = Cart.findOne({ user: userId }).populate("items.product");

  return result;
};

exports.clearCart = async (request) => {
  const { userId } = request.user;
  const result = await Cart.findOneAndDelete({ user: userId },{new:true});
  console.log(result)
  return result;
};
