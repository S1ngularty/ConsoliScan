const StockMovement = require("../models/stockMovementModel");
const Product = require("../models/productModel");

// ═══════════════════════════════════════════════
//  CREATE STOCK MOVEMENT
// ═══════════════════════════════════════════════
exports.recordStockMovement = async (movementData) => {
  const movement = await StockMovement.create(movementData);
  return await StockMovement.findById(movement._id)
    .populate("product", "name sku barcode")
    .populate("performedBy", "name email");
};

// ═══════════════════════════════════════════════
//  GET STOCK MOVEMENTS
// ═══════════════════════════════════════════════
exports.getStockMovements = async (filters = {}) => {
  const { productId, type, startDate, endDate, page = 1, limit = 50 } = filters;

  const query = {};

  if (productId) query.product = productId;
  if (type) query.type = type;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [movements, total] = await Promise.all([
    StockMovement.find(query)
      .populate("product", "name sku barcode")
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    StockMovement.countDocuments(query),
  ]);

  return {
    movements,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit),
    },
  };
};

// ═══════════════════════════════════════════════
//  GET PRODUCT STOCK HISTORY
// ═══════════════════════════════════════════════
exports.getProductStockHistory = async (productId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await StockMovement.find({
    product: productId,
    createdAt: { $gte: startDate },
  })
    .populate("performedBy", "name")
    .sort({ createdAt: -1 });
};

// ═══════════════════════════════════════════════
//  GET STOCK MOVEMENT ANALYTICS
// ═══════════════════════════════════════════════
exports.getStockAnalytics = async (timeRange = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);

  // Movements by type
  const byType = await StockMovement.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        totalQuantity: { $sum: { $abs: "$quantityChange" } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Most active products
  const mostActive = await StockMovement.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: "$product",
        movementCount: { $sum: 1 },
      },
    },
    { $sort: { movementCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $project: {
        productId: "$_id",
        productName: "$productInfo.name",
        sku: "$productInfo.sku",
        movementCount: 1,
      },
    },
  ]);

  // Daily movement trends
  const dailyTrends = await StockMovement.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  return {
    byType,
    mostActive,
    dailyTrends,
    timeRange,
  };
};

// ═══════════════════════════════════════════════
//  ADJUST STOCK WITH MOVEMENT RECORD
// ═══════════════════════════════════════════════
exports.adjustStock = async (productId, quantity, reason, userId) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const quantityBefore = product.stock;
  const quantityAfter = quantityBefore + quantity;

  // Update product stock
  product.stock = quantityAfter;
  await product.save();

  // Record movement
  const movement = await this.recordStockMovement({
    product: productId,
    type: "ADJUSTMENT",
    quantityBefore,
    quantityChange: quantity,
    quantityAfter,
    reason,
    performedBy: userId,
    referenceType: "ADJUSTMENT",
  });

  return { product, movement };
};
