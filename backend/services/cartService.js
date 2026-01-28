const Cart = require("../models/cartModel");

exports.updateCart = async (request) => {
  if (!request.body) throw new Error("request content is empty");
  const updatedCart = request.body;
  const { userId } = request.user;
  console.log(updatedCart, userId);
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    {
      items:updatedCart,
    },
    { new: true, upsert: true, runValidators: true },
  );

  if (!cart) throw new Error("failed to update the user cart");
  return cart;
};
