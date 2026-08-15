const User = require("../models/userModel");
const Product = require("../models/productModel");
const { createLog } = require("./activityLogsService");

exports.getSavedItems = async (request) => {
  const { userId } = request.user;

  const user = await User.findById(userId).populate({
    path: "savedItems",
    select:
      "_id sku name barcode price srp stockQuantity unit category isBNPC bnpcCategory images",
      populate:{
        path:"category"
      }
  })

  if (!user) throw new Error("User not found");

  return {
    totalItems: user.savedItems.length,
    items: user.savedItems,
  };
};

exports.addToSaved = async (request) => {
  const { userId } = request.user;
  const { productId } = request.body;

  if (!productId) throw new Error("Product ID is required");

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  // Check if already saved
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.savedItems.includes(productId)) {
    throw new Error("Product is already in saved items");
  }

  // Add to saved items
  user.savedItems.push(productId);
  await user.save();

  // Get updated saved items
  const updatedUser = await User.findById(userId).populate({
    path: "savedItems",
    select:
      "_id sku name barcode price srp stockQuantity unit category isBNPC bnpcCategory images",
  });

//   createLog(
//     userId,
//     "ADD_SAVED_ITEM",
//     "SUCCESS",
//     `Added product ${product.name} to saved items`,
//   );

  return {
    success: true,
    message: "Item added to saved",
    items: updatedUser.savedItems,
  };
};

exports.removeFromSaved = async (request) => {
  const { userId } = request.user;
  const { productId } = request.body;

  if (!productId) throw new Error("Product ID is required");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Check if product is in saved items
  if (!user.savedItems.includes(productId)) {
    throw new Error("Product is not in saved items");
  }

  // Remove from saved items
  user.savedItems = user.savedItems.filter((id) => id.toString() !== productId);
  await user.save();

  // Get updated saved items
  const updatedUser = await User.findById(userId).populate({
    path: "savedItems",
    select:
      "_id sku name barcode price srp stockQuantity unit category isBNPC bnpcCategory images",
  });

//   createLog(
//     userId,
//     "REMOVE_SAVED_ITEM",
//     "SUCCESS",
//     `Removed product from saved items`,
//   );

  return {
    success: true,
    message: "Item removed from saved",
    items: updatedUser.savedItems,
  };
};

exports.checkIsSaved = async (request) => {
  const { userId } = request.user;
  const { productId } = request.params;

  if (!productId) throw new Error("Product ID is required");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const isSaved = user.savedItems.includes(productId);

  return {
    productId,
    isSaved,
  };
};
