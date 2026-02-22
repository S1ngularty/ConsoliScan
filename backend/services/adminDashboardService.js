const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const ActivityLog = require("../models/activityLogsModel");
const Category = require("../models/categoryModel");
const Promo = require("../models/promoModel");
const Cart = require("../models/cartModel");
const CheckoutQueue = require("../models/checkoutQueueModel");

// ==================== DASHBOARD SUMMARY ====================
const getDashboardSummary = async () => {
  try {
    console.log("\n========== getDashboardSummary DEBUG START ==========");
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCategories = await Category.countDocuments();

    console.log("📊 Counts:", { totalUsers, totalProducts, totalOrders, totalCategories });

    // Revenue calculation - Use finalAmountPaid and CONFIRMED status
    const revenueData = await Order.aggregate([
      {
        $match: { status: "CONFIRMED" },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$finalAmountPaid" },
          averageOrderValue: { $avg: "$finalAmountPaid" },
          totalOrderCount: { $sum: 1 },
        },
      },
    ]);

    console.log("💰 Revenue data from CONFIRMED orders:", revenueData);

    const revenue = revenueData[0] || {
      totalRevenue: 0,
      averageOrderValue: 0,
      totalOrderCount: 0,
    };

    // Recent activity
    const recentActivity = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email");

    console.log("📝 Recent activity items:", recentActivity.length);
    console.log("========== getDashboardSummary DEBUG END ==========\n");

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalCategories,
      totalRevenue: revenue.totalRevenue || 0,
      averageOrderValue: revenue.averageOrderValue || 0,
      recentActivity,
    };
  } catch (error) {
    console.error("❌ ERROR in getDashboardSummary:", error.message);
    throw new Error(`Failed to get dashboard summary: ${error.message}`);
  }
};

// ==================== SALES ANALYTICS ====================
const getSalesAnalytics = async (params = {}) => {
  try {
    const { startDate, endDate, groupBy = "day" } = params;
    
    console.log("\n========== getSalesAnalytics DEBUG START ==========");
    console.log("📊 Input Parameters:", { startDate, endDate, groupBy });

    // Check total orders in collection
    const totalOrders = await Order.countDocuments();
    console.log("📦 Total orders in collection:", totalOrders);

    // Check orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    console.log("📊 Orders by status:", ordersByStatus);

    // Check all orders (first 3)
    const sampleOrders = await Order.find().limit(3).lean();
    console.log(
      "Sample orders (first 3):",
      sampleOrders.map((o) => ({
        _id: o._id,
        status: o.status,
        createdAt: o.createdAt,
        confirmedAt: o.confirmedAt,
        finalAmountPaid: o.finalAmountPaid,
      }))
    );

    let dateFilter = { status: { $in: ["CONFIRMED", "COMPLETED"] } };

    if (startDate || endDate) {
      dateFilter.$or = [{ confirmedAt: {} }, { createdAt: {} }];

      if (startDate) {
        dateFilter.$or[0].confirmedAt.$gte = new Date(startDate);
        dateFilter.$or[1].createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.$or[0].confirmedAt.$lte = new Date(endDate);
        dateFilter.$or[1].createdAt.$lte = new Date(endDate);
      }
    }

    console.log("🔍 Date filter:", JSON.stringify(dateFilter, null, 2));

    // Count matching orders before aggregation
    const matchingCount = await Order.countDocuments({
      status: { $in: ["CONFIRMED", "COMPLETED"] },
    });
    console.log("✅ Orders matching status filter (CONFIRMED/COMPLETED):", matchingCount);

    let groupStage;
    let dateField = "$createdAt"; // Use createdAt as default, falls back in aggregation

    switch (groupBy) {
      case "month":
        groupStage = {
          year: { $year: dateField },
          month: { $month: dateField },
        };
        break;
      case "week":
        groupStage = {
          year: { $isoWeekYear: dateField },
          week: { $isoWeek: dateField },
        };
        break;
      default: // day
        groupStage = {
          date: { $dateToString: { format: "%Y-%m-%d", date: dateField } },
        };
    }

    console.log("🏗️ Aggregation pipeline:");
    
    // Construct date range properly - endDate should include the entire day
    let startDateObj = startDate ? new Date(startDate) : null;
    let endDateObj = endDate ? new Date(endDate) : null;
    
    // If endDate is provided, set it to the end of the day (23:59:59.999Z)
    if (endDateObj) {
      endDateObj.setDate(endDateObj.getDate() + 1); // Move to next day
      endDateObj.setHours(0, 0, 0, 0); // Set to midnight of next day
    }
    
    console.log("🔄 Date range after adjustment:", { startDateObj, endDateObj });

    const pipeline = [
      { $match: { status: { $in: ["CONFIRMED", "COMPLETED"] } } },
      {
        $addFields: {
          dateField: { $ifNull: ["$confirmedAt", "$createdAt"] },
        },
      },
      // Apply date filter if provided
      ...(startDateObj || endDateObj
        ? [
            {
              $match: {
                dateField: {
                  ...(startDateObj && { $gte: startDateObj }),
                  ...(endDateObj && { $lt: endDateObj }),
                },
              },
            },
          ]
        : []),
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$dateField" } },
          },
          totalSales: { $sum: "$finalAmountPaid" },
          grossSales: { $sum: "$baseAmount" },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: "$finalAmountPaid" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ];
    console.log(JSON.stringify(pipeline, null, 2));

    const salesData = await Order.aggregate(pipeline);

    console.log("📈 Final aggregated data:", salesData);
    console.log("📊 Data points returned:", salesData.length);
    console.log("========== getSalesAnalytics DEBUG END ==========\n");

    return {
      groupBy,
      data: salesData,
      summary: {
        totalSales: salesData.reduce((sum, item) => sum + item.totalSales, 0),
        totalOrders: salesData.reduce((sum, item) => sum + item.orderCount, 0),
        averageOrderValue:
          salesData.reduce((sum, item) => sum + item.averageOrderValue, 0) /
          (salesData.length || 1),
      },
    };
  } catch (error) {
    console.error("❌ ERROR in getSalesAnalytics:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.log("========== getSalesAnalytics DEBUG END (ERROR) ==========\n");
    throw new Error(`Failed to get sales analytics: ${error.message}`);
  }
};

// ==================== PRODUCT ANALYTICS ====================
const getProductAnalytics = async (params = {}) => {
  try {
    const { limit = 10, sortBy = "sales" } = params;

    let sortStage = { totalSold: -1 };
    if (sortBy === "revenue") sortStage = { totalRevenue: -1 };
    if (sortBy === "rating") sortStage = { rating: -1 };

    const productAnalytics = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.price" },
          orderCount: { $sum: 1 },
          averageUnitPrice: { $avg: "$items.price" },
        },
      },
      { $sort: sortStage },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 1,
          productName: "$product.name",
          sku: "$product.sku",
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1,
          averageUnitPrice: 1,
          currentStock: "$product.stock",
          category: "$product.category",
        },
      },
    ]);

    return {
      limit,
      sortBy,
      data: productAnalytics,
    };
  } catch (error) {
    throw new Error(`Failed to get product analytics: ${error.message}`);
  }
};

// ==================== CATEGORY ANALYTICS ====================
const getCategoryAnalytics = async () => {
  try {
    const categoryData = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          totalSales: { $sum: "$items.price" },
          orderCount: { $sum: 1 },
          totalQuantity: { $sum: "$items.quantity" },
          averageOrderValue: { $avg: "$items.price" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          categoryName: { $ifNull: ["$category.name", "Unknown"] },
          totalSales: 1,
          orderCount: 1,
          totalQuantity: 1,
          averageOrderValue: 1,
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    return categoryData;
  } catch (error) {
    throw new Error(`Failed to get category analytics: ${error.message}`);
  }
};

// ==================== USER ANALYTICS ====================
const getUserAnalytics = async (params = {}) => {
  try {
    const { startDate, endDate } = params;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const totalUsers = await User.countDocuments({ role: "user" });
    const newUsers = await User.countDocuments(dateFilter);
    const activeUsers = await ActivityLog.distinct("user");

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const topSpenders = await Order.aggregate([
      { $match: { status: "CONFIRMED", user: { $ne: null } } },
      {
        $group: {
          _id: "$user",
          totalSpent: { $sum: "$finalAmountPaid" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          userName: "$user.name",
          userEmail: "$user.email",
          totalSpent: 1,
          orderCount: 1,
        },
      },
    ]);

    return {
      totalUsers,
      newUsers,
      activeUsersCount: activeUsers.length,
      usersByRole,
      topSpenders,
    };
  } catch (error) {
    throw new Error(`Failed to get user analytics: ${error.message}`);
  }
};

// ==================== ORDER ANALYTICS ====================
const getOrderAnalytics = async (params = {}) => {
  try {
    const { startDate, endDate } = params;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.confirmedAt = {};
      if (startDate) dateFilter.confirmedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.confirmedAt.$lte = new Date(endDate);
    }

    const orderStatusBreakdown = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmountPaid" },
          averageValue: { $avg: "$finalAmountPaid" },
        },
      },
    ]);

    // Get payment method breakdown from cashTransaction
    const orderPaymentMethods = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "cash", // Cash is the primary method in your system
          count: { $sum: 1 },
          totalAmount: { $sum: "$finalAmountPaid" },
        },
      },
    ]);

    const orderTimingAnalysis = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            hour: { $hour: "$confirmedAt" },
          },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmountPaid" },
        },
      },
      { $sort: { "_id.hour": 1 } },
    ]);

    return {
      statusBreakdown: orderStatusBreakdown,
      paymentMethods: orderPaymentMethods,
      timingAnalysis: orderTimingAnalysis,
    };
  } catch (error) {
    throw new Error(`Failed to get order analytics: ${error.message}`);
  }
};

// ==================== INVENTORY ANALYTICS ====================
const getInventoryAnalytics = async () => {
  try {
    const totalStock = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalUnits: { $sum: "$stockQuantity" },
          totalValue: {
            $sum: { $multiply: ["$stockQuantity", "$price"] },
          },
        },
      },
    ]);

    const lowStockProducts = await Product.find({ stockQuantity: { $lt: 10 } })
      .select("name sku stockQuantity price")
      .sort({ stockQuantity: 1 })
      .limit(10);

    const outOfStockProducts = await Product.find({ stockQuantity: 0 })
      .select("name sku price")
      .limit(10);

    const stockByCategory = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          totalStock: { $sum: "$stockQuantity" },
          totalValue: { $sum: { $multiply: ["$stockQuantity", "$price"] } },
          productCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          categoryName: { $ifNull: ["$category.categoryName", "Unknown"] },
          totalStock: 1,
          totalValue: 1,
          productCount: 1,
        },
      },
    ]);

    return {
      summary: totalStock[0] || { totalUnits: 0, totalValue: 0 },
      lowStockProducts,
      outOfStockProducts,
      stockByCategory,
    };
  } catch (error) {
    throw new Error(`Failed to get inventory analytics: ${error.message}`);
  }
};

// ==================== PROMOTION ANALYTICS ====================
const getPromotionAnalytics = async () => {
  try {
    const totalPromos = await Promo.countDocuments();
    const activePromos = await Promo.countDocuments({
      $and: [
        { startDate: { $lte: new Date() } },
        { endDate: { $gte: new Date() } },
      ],
    });

    const promoPerformance = await Order.aggregate([
      { $match: { appliedPromo: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$appliedPromo",
          usageCount: { $sum: 1 },
          totalDiscountGiven: { $sum: "$discountAmount" },
          totalOrderValue: { $sum: "$totalAmount" },
        },
      },
      {
        $lookup: {
          from: "promos",
          localField: "_id",
          foreignField: "_id",
          as: "promo",
        },
      },
      { $unwind: "$promo" },
      {
        $project: {
          _id: 1,
          promoCode: "$promo.code",
          promoName: "$promo.name",
          usageCount: 1,
          totalDiscountGiven: 1,
          totalOrderValue: 1,
          averageDiscount: { $divide: ["$totalDiscountGiven", "$usageCount"] },
        },
      },
      { $sort: { usageCount: -1 } },
    ]);

    return {
      totalPromos,
      activePromos,
      inactivePromos: totalPromos - activePromos,
      performanceData: promoPerformance,
    };
  } catch (error) {
    throw new Error(`Failed to get promotion analytics: ${error.message}`);
  }
};

// ==================== ACTIVITY LOGS ====================
const getActivityLogs = async (params = {}) => {
  try {
    const { limit = 50, page = 1, userId, action, status } = params;
    const skip = (page - 1) * limit;

    let filter = {};
    if (userId) filter.user = userId;
    if (action) filter.action = action;
    if (status) filter.status = status;

    const logs = await ActivityLog.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments(filter);

    return {
      data: logs,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        totalRecords: total,
        perPage: limit,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get activity logs: ${error.message}`);
  }
};

// ==================== CHECKOUT QUEUE ANALYTICS ====================
const getCheckoutQueueAnalytics = async () => {
  try {
    const queueStats = await CheckoutQueue.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          averageWaitTime: { $avg: "$waitTime" },
          totalWaitTime: { $sum: "$waitTime" },
        },
      },
    ]);

    const activeQueues = await CheckoutQueue.find({
      status: { $ne: "completed" },
    })
      .populate("user", "name")
      .sort({ createdAt: 1 });

    return {
      statistics: queueStats,
      activeQueues,
      totalInQueue: activeQueues.length,
    };
  } catch (error) {
    throw new Error(`Failed to get checkout queue analytics: ${error.message}`);
  }
};

// ==================== COMPREHENSIVE REPORT ====================
const getComprehensiveReport = async (params = {}) => {
  try {
    const [
      summary,
      sales,
      products,
      categories,
      users,
      orders,
      inventory,
      promotions,
      queue,
    ] = await Promise.all([
      getDashboardSummary(),
      getSalesAnalytics(params),
      getProductAnalytics({ limit: 5 }),
      getCategoryAnalytics(),
      getUserAnalytics(params),
      getOrderAnalytics(params),
      getInventoryAnalytics(),
      getPromotionAnalytics(),
      getCheckoutQueueAnalytics(),
    ]);

    return {
      generatedAt: new Date(),
      summary,
      salesAnalytics: sales,
      productAnalytics: products,
      categoryAnalytics: categories,
      userAnalytics: users,
      orderAnalytics: orders,
      inventoryAnalytics: inventory,
      promotionAnalytics: promotions,
      checkoutQueueStatus: queue,
    };
  } catch (error) {
    throw new Error(
      `Failed to generate comprehensive report: ${error.message}`,
    );
  }
};

module.exports = {
  getDashboardSummary,
  getSalesAnalytics,
  getProductAnalytics,
  getCategoryAnalytics,
  getUserAnalytics,
  getOrderAnalytics,
  getInventoryAnalytics,
  getPromotionAnalytics,
  getActivityLogs,
  getCheckoutQueueAnalytics,
  getComprehensiveReport,
};
