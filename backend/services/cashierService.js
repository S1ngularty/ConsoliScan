/**
 * cashierService.js
 *
 * Service for cashier-specific operations:
 *  - Dashboard statistics
 *  - Recent transactions
 *  - Performance metrics
 */

const Order = require("../models/orderModel");
const CheckoutQueue = require("../models/checkoutQueueModel");
const Exchange = require("../models/ExchangeModel");

/**
 * Get cashier dashboard statistics
 * GET /api/v1/cashier/dashboard
 */
async function getDashboardStats(request) {
  const { userId } = request.user;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's orders
  const todayOrders = await Order.find({
    cashier: userId,
    status: "CONFIRMED",
    confirmedAt: { $gte: today, $lt: tomorrow },
  }).lean();

  // Calculate statistics
  const salesToday = todayOrders.length;
  const revenue = todayOrders.reduce(
    (sum, order) => sum + (order.finalAmountPaid || 0),
    0,
  );
  const transactions = todayOrders.length;

  // Count special customers (PWD/Senior)
  const specialCustomers = todayOrders.filter(
    (order) => order.userEligibility?.isSenior || order.userEligibility?.isPWD,
  ).length;

  // Get hourly breakdown for today
  const hourlyStats = Array(24).fill(0);
  todayOrders.forEach((order) => {
    const hour = new Date(order.confirmedAt).getHours();
    hourlyStats[hour]++;
  });

  // Get payment method breakdown
  const paymentMethods = todayOrders.reduce((acc, order) => {
    const method = order.paymentMethod || "cash";
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  // Get this week's statistics
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekOrders = await Order.find({
    cashier: userId,
    status: "CONFIRMED",
    confirmedAt: { $gte: weekStart },
  }).lean();

  const weekRevenue = weekOrders.reduce(
    (sum, order) => sum + (order.finalAmountPaid || 0),
    0,
  );

  return {
    today: {
      salesToday,
      revenue: parseFloat(Number().toFixed(2)),
      transactions,
      specialCustomers,
      hourlyStats,
      paymentMethods,
    },
    week: {
      transactions: weekOrders.length,
      revenue: parseFloat(Number(weekRevenue).toFixed(2)),
    },
    cashierId: userId,
    timestamp: new Date(),
  };
}

/**
 * Get recent transactions for cashier
 * GET /api/v1/cashier/recent-transactions
 */
async function getRecentTransactions(request) {
  const { userId } = request.user;
  const query = request.query || {};
  const { limit = 10 } = query;

  const recentOrders = await Order.find({
    cashier: userId,
    status: "CONFIRMED",
  })
    .select(
      "checkoutCode finalAmountPaid paymentMethod confirmedAt items userEligibility",
    )
    .sort({ confirmedAt: -1 })
    .limit(parseInt(limit))
    .lean();

  const transactions = recentOrders.map((order) => ({
    _id: order._id,
    transactionId: order.checkoutCode,
    amount: Number(order.finalAmountPaid).toFixed(2),
    paymentMethod: (order.paymentMethod || "cash").toUpperCase(),
    timestamp: order.confirmedAt,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    isSpecialCustomer:
      order.userEligibility?.isSenior || order.userEligibility?.isPWD,
  }));

  return {
    transactions,
    total: transactions.length,
  };
}

/**
 * Get pending checkout queues (for monitoring)
 * GET /api/v1/cashier/pending-queues
 */
async function getPendingQueues(request) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queues = await CheckoutQueue.find({
    status: { $in: ["PROCESSING", "SCANNED", "LOCKED"] },
    createdAt: { $gte: today },
  })
    .select(
      "checkoutCode status totalAmount itemsCount userEligibility createdAt",
    )
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return {
    queues: queues.map((q) => ({
      checkoutCode: q.checkoutCode,
      status: q.status,
      amount: q.totalAmount,
      itemCount: q.itemsCount,
      isSpecialCustomer:
        q.userEligibility?.isSenior || q.userEligibility?.isPWD,
      createdAt: q.createdAt,
    })),
    total: queues.length,
  };
}

/**
 * Get recent exchanges handled by cashier
 * GET /api/v1/cashier/recent-exchanges
 */
async function getRecentExchanges(request) {
  const { userId } = request.user;
  const query = request.query || {};
  const { limit = 5 } = query;

  const exchanges = await Exchange.find({
    cashierId: userId,
    status: { $in: ["VALIDATED", "COMPLETED"] },
  })
    .select(
      "status originalItemName replacementItemName price timestamps customerId",
    )
    .sort({ "timestamps.validatedAt": -1 })
    .limit(parseInt(limit))
    .populate("customerId", "firstName lastName")
    .lean();

  return {
    exchanges: exchanges.map((ex) => ({
      _id: ex._id,
      status: ex.status,
      originalItem: ex.originalItemName,
      replacementItem: ex.replacementItemName,
      price: ex.price,
      customerName: ex.customerId
        ? `${ex.customerId.firstName} ${ex.customerId.lastName}`
        : "N/A",
      validatedAt: ex.timestamps.validatedAt,
      completedAt: ex.timestamps.completedAt,
    })),
    total: exchanges.length,
  };
}

/**
 * Get inventory list with search and filters
 * GET /api/v1/cashier/inventory
 */
async function getInventory(request) {
  const query = request.query || {};
  const { search, category, lowStock, page = 1, limit = 20 } = query;

  const Product = require("../models/productModel");

  const filter = { deletedAt: null };

  // Search by name, SKU, or barcode
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
    ];
  }

  // Filter by category
  if (category) {
    filter.category = category;
  }

  // Filter low stock items (less than 10)
  if (lowStock === "true") {
    filter.stockQuantity = { $lt: 10 };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name")
      .select(
        "name sku barcode price stockQuantity category images saleActive salePrice",
      )
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Product.countDocuments(filter),
  ]);

  // Get low stock count
  const lowStockCount = await Product.countDocuments({
    deletedAt: null,
    stockQuantity: { $lt: 10 },
  });

  return {
    products: products.map((p) => ({
      ...p,
      categoryName: p.category?.name || "Uncategorized",
      currentPrice: p.saleActive && p.salePrice ? p.salePrice : p.price,
      isLowStock: p.stockQuantity < 10,
    })),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
    lowStockCount,
  };
}

/**
 * Update product stock quantity
 * PATCH /api/v1/cashier/inventory/:productId/stock
 */
async function updateStock(request) {
  const { productId } = request.params;
  const { quantity, action } = request.body; // action: 'add' or 'subtract'
  const { userId } = request.user;
  const Product = require("../models/productModel");

  if (!quantity || quantity <= 0) {
    throw new Error("Quantity must be a positive number");
  }

  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const oldStock = product.stockQuantity;
  let newStock = oldStock;

  if (action === "add") {
    newStock = oldStock + parseInt(quantity);
  } else if (action === "subtract") {
    newStock = Math.max(0, oldStock - parseInt(quantity));
  } else if (action === "set") {
    newStock = parseInt(quantity);
  } else {
    throw new Error("Invalid action. Use 'add', 'subtract', or 'set'");
  }

  product.stockQuantity = newStock;
  await product.save();

  // Log the activity
  const { createLog } = require("./activityLogsService");
  createLog(
    userId,
    "UPDATE_STOCK",
    "SUCCESS",
    `Updated stock for ${product.name}: ${oldStock} → ${newStock} (${action})`,
  );

  return {
    product: {
      _id: product._id,
      name: product.name,
      sku: product.sku,
      oldStock,
      newStock,
      stockQuantity: newStock,
    },
    message: `Stock updated successfully: ${oldStock} → ${newStock}`,
  };
}

/**
 * Get sales reports with date range
 * GET /api/v1/cashier/reports
 */
async function getSalesReports(request) {
  const { userId } = request.user;
  const query = request.query || {};
  const { period = "today", startDate, endDate } = query;

  let dateQuery = {};
  const now = new Date();

  // Determine date range based on period
  if (period === "today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateQuery = { confirmedAt: { $gte: today, $lt: tomorrow } };
  } else if (period === "week") {
    const weekStart = new Date();
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    dateQuery = { confirmedAt: { $gte: weekStart } };
  } else if (period === "month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    dateQuery = { confirmedAt: { $gte: monthStart } };
  } else if (startDate && endDate) {
    dateQuery = {
      confirmedAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
  }

  // Get orders for the period
  const orders = await Order.find({
    cashier: userId,
    status: "CONFIRMED",
    ...dateQuery,
  }).lean();

  // Calculate statistics
  const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmountPaid, 0);
  const totalTransactions = orders.length;
  const totalItems = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );

  // Payment method breakdown
  const paymentMethods = orders.reduce((acc, order) => {
    const method = (order.paymentMethod || "cash").toUpperCase();
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  // Special customers count
  const specialCustomers = orders.filter(
    (o) => o.userEligibility?.isSenior || o.userEligibility?.isPWD,
  ).length;

  // Hourly breakdown (for today only)
  const hourlyBreakdown = Array(24).fill(0);
  if (period === "today") {
    orders.forEach((order) => {
      const hour = new Date(order.confirmedAt).getHours();
      hourlyBreakdown[hour]++;
    });
  }

  // Top selling items
  const itemsMap = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.name;
      if (!itemsMap[key]) {
        itemsMap[key] = {
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
      }
      itemsMap[key].quantity += item.quantity;
      itemsMap[key].revenue += item.itemTotal;
    });
  });

  const topItems = Object.values(itemsMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    period,
    dateRange: {
      start: dateQuery.confirmedAt?.$gte || null,
      end: dateQuery.confirmedAt?.$lte || dateQuery.confirmedAt?.$lt || null,
    },
    summary: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalTransactions,
      totalItems,
      averageTransactionValue: parseFloat(
        (totalRevenue / Math.max(totalTransactions, 1)).toFixed(2),
      ),
      specialCustomers,
    },
    paymentMethods,
    hourlyBreakdown: period === "today" ? hourlyBreakdown : null,
    topItems,
  };
}

/**
 * Get transaction history with filters
 * GET /api/v1/cashier/transactions
 */
async function getTransactionHistory(request) {
  const { userId } = request.user;
  const queryParams = request.query || {};
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    paymentMethod,
  } = queryParams;

  const query = {
    cashier: userId,
    status: "CONFIRMED",
  };

  if (startDate && endDate) {
    query.confirmedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (paymentMethod) {
    query.paymentMethod = paymentMethod.toLowerCase();
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .select(
        "checkoutCode finalAmountPaid paymentMethod confirmedAt items userEligibility",
      )
      .sort({ confirmedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Order.countDocuments(query),
  ]);

  return {
    transactions: orders.map((order) => ({
      _id: order._id,
      transactionId: order.checkoutCode,
      amount: parseFloat(order.finalAmountPaid.toFixed(2)),
      paymentMethod: (order.paymentMethod || "cash").toUpperCase(),
      timestamp: order.confirmedAt,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      isSpecialCustomer:
        order.userEligibility?.isSenior || order.userEligibility?.isPWD,
    })),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

/**
 * Get low stock alerts
 * GET /api/v1/cashier/low-stock-alerts
 */
async function getLowStockAlerts(request) {
  const Product = require("../models/productModel");
  const query = request.query || {};
  const { threshold = 10 } = query;

  const lowStockProducts = await Product.find({
    deletedAt: null,
    stockQuantity: { $lt: parseInt(threshold) },
  })
    .populate("category", "name")
    .select("name sku barcode stockQuantity category")
    .sort({ stockQuantity: 1 })
    .lean();

  return {
    alerts: lowStockProducts.map((p) => ({
      ...p,
      categoryName: p.category?.name || "Uncategorized",
      severity: p.stockQuantity === 0 ? "critical" : "warning",
    })),
    total: lowStockProducts.length,
  };
}

/**
 * Get cashier profile information
 * GET /api/v1/cashier/profile
 */
async function getProfile(request) {
  const { userId } = request.user;
  const User = require("../models/userModel");
  const mongoose = require("mongoose");

  const user = await User.findById(userId).select(
    "name email contactNumber avatar role address street city state country zipCode createdAt",
  );

  if (!user) {
    throw new Error("User not found");
  }

  // Get cashier statistics
  const Order = require("../models/orderModel");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Convert userId to ObjectId for aggregation
  const cashierObjectId = new mongoose.Types.ObjectId(userId);

  const [totalTransactions, totalSales, todayTransactions] = await Promise.all([
    Order.countDocuments({ cashier: cashierObjectId, status: "CONFIRMED" }),
    Order.aggregate([
      {
        $match: {
          cashier: cashierObjectId,
          status: "CONFIRMED",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$finalAmountPaid" },
        },
      },
    ]),
    Order.countDocuments({
      cashier: cashierObjectId,
      status: "CONFIRMED",
      confirmedAt: { $gte: today },
    }),
  ]);

  console.log("totalTransactions:", totalTransactions);
  console.log("totalSales aggregation result:", totalSales);
  console.log("todayTransactions:", todayTransactions);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      avatar: user.avatar,
      role: user.role,
      address: user.address,
      street: user.street,
      city: user.city,
      state: user.state,
      country: user.country,
      zipCode: user.zipCode,
      joinedDate: user.createdAt,
    },
    stats: {
      totalTransactions,
      totalSales: totalSales.length > 0 ? totalSales[0].total : 0,
      todayTransactions,
    },
  };
}

/**
 * Update cashier profile
 * PUT /api/v1/cashier/profile
 */
async function updateProfile(request) {
  const { userId } = request.user;
  const User = require("../models/userModel");
  const { uploadImage, deleteAssets } = require("../utils/cloundinaryUtil");
  const { createLog } = require("./activityLogsService");

  if (!request.body) {
    throw new Error("No update data provided");
  }

  // Handle avatar upload
  if (request.file) {
    const uploadResult = await uploadImage([request.file], "cashier-avatars");
    request.body.avatar = uploadResult;
  }

  const currentUser = await User.findById(userId);
  if (!currentUser) {
    throw new Error("User not found");
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(userId, request.body, {
    new: true,
    runValidators: true,
  }).select(
    "name email contactNumber avatar role address street city state country zipCode",
  );

  // Delete old avatar if new one was uploaded
  if (request.file && currentUser.avatar?.public_id) {
    deleteAssets([currentUser.avatar.public_id]);
  }

  createLog(
    userId,
    "UPDATE_PROFILE",
    "SUCCESS",
    `Cashier ${updatedUser.name} updated their profile`,
  );

  return {
    user: updatedUser,
    message: "Profile updated successfully",
  };
}

module.exports = {
  getDashboardStats,
  getRecentTransactions,
  getPendingQueues,
  getRecentExchanges,
  getInventory,
  updateStock,
  getSalesReports,
  getTransactionHistory,
  getLowStockAlerts,
  getProfile,
  updateProfile,
};
