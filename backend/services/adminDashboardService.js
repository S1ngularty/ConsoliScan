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
    const totalUsers = await User.countDocuments({
      role: "user",
      status: "active",
    });
    const totalProducts = await Product.countDocuments({ deletedAt: null });
    const totalOrders = await Order.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Revenue calculation - Use finalAmountPaid and include both CONFIRMED and COMPLETED orders
    const revenueData = await Order.aggregate([
      {
        $match: { status: { $in: ["CONFIRMED", "COMPLETED"] } },
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
    throw new Error(`Failed to get dashboard summary: ${error.message}`);
  }
};

// ==================== SALES ANALYTICS ====================
const getSalesAnalytics = async (params = {}) => {
  try {
    const { startDate, endDate, groupBy = "day" } = params;

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

    // Construct date range properly - endDate should include the entire day
    let startDateObj = startDate ? new Date(startDate) : null;
    let endDateObj = endDate ? new Date(endDate) : null;

    // If endDate is provided, set it to the end of the day (23:59:59.999Z)
    if (endDateObj) {
      endDateObj.setDate(endDateObj.getDate() + 1); // Move to next day
      endDateObj.setHours(0, 0, 0, 0); // Set to midnight of next day
    }

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

    const salesData = await Order.aggregate(pipeline);

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
    throw new Error(`Failed to get sales analytics: ${error.message}`);
  }
};

// ==================== PRODUCT ANALYTICS ====================
const getProductAnalytics = async (params = {}) => {
  try {
    const { limit = 10, sortBy = "sales", startDate, endDate } = params;

    let sortStage = { totalSold: -1 };
    if (sortBy === "revenue") sortStage = { totalRevenue: -1 };
    if (sortBy === "rating") sortStage = { rating: -1 };

    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;
    if (endDateObj) {
      endDateObj.setDate(endDateObj.getDate() + 1);
      endDateObj.setHours(0, 0, 0, 0);
    }

    const productAnalytics = await Order.aggregate([
      { $match: { status: { $in: ["CONFIRMED", "COMPLETED"] } } },
      {
        $addFields: {
          dateField: { $ifNull: ["$confirmedAt", "$createdAt"] },
        },
      },
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
      { $unwind: "$items" },
      { $match: { "items.product": { $ne: null } } },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: {
              $ifNull: [
                "$items.itemTotal",
                { $multiply: ["$items.unitPrice", "$items.quantity"] },
              ],
            },
          },
          orderCount: { $sum: 1 },
          averageUnitPrice: { $avg: "$items.unitPrice" },
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
        $match: {
          "product.deletedAt": null,
        },
      },
      {
        $project: {
          _id: 1,
          productName: "$product.name",
          sku: "$product.sku",
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1,
          averageUnitPrice: 1,
          currentStock: "$product.stockQuantity",
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
const getCategoryAnalytics = async (params = {}) => {
  try {
    const { startDate, endDate } = params;
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;
    if (endDateObj) {
      endDateObj.setDate(endDateObj.getDate() + 1);
      endDateObj.setHours(0, 0, 0, 0);
    }

    const categoryData = await Order.aggregate([
      { $match: { status: { $in: ["CONFIRMED", "COMPLETED"] } } },
      {
        $addFields: {
          dateField: { $ifNull: ["$confirmedAt", "$createdAt"] },
        },
      },
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
      { $unwind: "$items" },
      {
        $addFields: {
          productRef: { $ifNull: ["$items.product", "$items.productId"] },
          categoryNameFallback: {
            $ifNull: ["$items.category.name", "$items.categoryType"],
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productRef",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          categoryRef: { $ifNull: ["$product.category", "$items.category.id"] },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryRef",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          categoryName: {
            $ifNull: ["$category.categoryName", "$categoryNameFallback"],
          },
        },
      },
      {
        $group: {
          _id: { id: "$categoryRef", name: "$categoryName" },
          totalSales: {
            $sum: {
              $ifNull: [
                "$items.itemTotal",
                { $multiply: ["$items.unitPrice", "$items.quantity"] },
              ],
            },
          },
          orderCount: { $sum: 1 },
          totalQuantity: { $sum: "$items.quantity" },
          averageOrderValue: { $avg: "$items.unitPrice" },
        },
      },
      {
        $project: {
          _id: "$_id.id",
          categoryName: { $ifNull: ["$_id.name", "Unknown"] },
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

    const totalUsers = await User.countDocuments({
      role: "user",
      status: "active",
    });
    const newUsers = await User.countDocuments({ ...dateFilter, role: "user" });
    const activeUsers = await ActivityLog.distinct("user");

    const usersByRole = await User.aggregate([
      {
        $match: { status: "active" },
      },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const topSpenders = await Order.aggregate([
      {
        $match: {
          status: { $in: ["CONFIRMED", "COMPLETED"] },
          user: { $ne: null },
        },
      },
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

    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;
    if (endDateObj) {
      endDateObj.setDate(endDateObj.getDate() + 1);
      endDateObj.setHours(0, 0, 0, 0);
    }

    const dateFilter =
      startDateObj || endDateObj
        ? {
            dateField: {
              ...(startDateObj && { $gte: startDateObj }),
              ...(endDateObj && { $lt: endDateObj }),
            },
          }
        : {};

    const orderStatusBreakdown = await Order.aggregate([
      {
        $addFields: {
          dateField: { $ifNull: ["$confirmedAt", "$createdAt"] },
        },
      },
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

    // Get payment method breakdown - dynamically determine payment method
    const orderPaymentMethods = await Order.aggregate([
      {
        $addFields: {
          dateField: { $ifNull: ["$confirmedAt", "$createdAt"] },
          paymentMethod: {
            $cond: {
              if: { $gt: ["$cashTransaction.cashReceived", 0] },
              then: "cash",
              else: "other",
            },
          },
        },
      },
      { $match: dateFilter },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$finalAmountPaid" },
        },
      },
    ]);

    const orderTimingAnalysis = await Order.aggregate([
      {
        $addFields: {
          dateField: { $ifNull: ["$confirmedAt", "$createdAt"] },
        },
      },
      { $match: dateFilter },
      {
        $group: {
          _id: {
            hour: { $hour: "$dateField" },
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
        $match: { deletedAt: null },
      },
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

    const lowStockProducts = await Product.find({
      stockQuantity: { $lt: 10 },
      deletedAt: null,
    })
      .select("name sku stockQuantity price")
      .sort({ stockQuantity: 1 })
      .limit(10);

    const outOfStockProducts = await Product.find({
      stockQuantity: 0,
      deletedAt: null,
    })
      .select("name sku price")
      .limit(10);

    const stockByCategory = await Product.aggregate([
      {
        $match: { deletedAt: null },
      },
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
const getPromotionAnalytics = async (params = {}) => {
  try {
    const { startDate, endDate } = params;
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;
    if (endDateObj) {
      endDateObj.setDate(endDateObj.getDate() + 1);
      endDateObj.setHours(0, 0, 0, 0);
    }

    const totalPromos = await Promo.countDocuments();
    const activePromos = await Promo.countDocuments({
      $and: [
        { startDate: { $lte: new Date() } },
        { endDate: { $gte: new Date() } },
      ],
    });

    const promoPerformance = await Promo.find()
      .select(
        "promoName code usedCount promoType value startDate endDate active",
      )
      .lean();

    const promoTotals = await Order.aggregate([
      { $match: { status: { $in: ["CONFIRMED", "COMPLETED"] } } },
      {
        $addFields: {
          dateField: { $ifNull: ["$confirmedAt", "$createdAt"] },
        },
      },
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
        $match: {
          $or: [
            { "promoDiscount.code": { $exists: true, $ne: null, $ne: "" } },
            { "promoDiscount.amount": { $gt: 0 } },
          ],
        },
      },
      {
        $group: {
          _id: "$promoDiscount.code",
          usageCount: { $sum: 1 },
          totalDiscountGiven: { $sum: "$promoDiscount.amount" },
          totalOrderValue: { $sum: "$baseAmount" },
          totalNetRevenue: { $sum: "$finalAmountPaid" },
        },
      },
    ]);

    const totalsByCode = new Map(
      promoTotals.map((item) => [item._id || "Unknown", item]),
    );
    const promoCodes = new Set(promoPerformance.map((promo) => promo.code));

    const performanceData = promoPerformance.map((promo) => {
      const code = promo.code || "Unknown";
      const totals = totalsByCode.get(code);
      const usageCount = totals?.usageCount || 0;
      const totalDiscountGiven = totals?.totalDiscountGiven || 0;

      return {
        _id: promo._id,
        promoCode: code,
        promoName: promo.promoName?.promo || "Unknown",
        usageCount,
        promoType: promo.promoType || null,
        value: promo.value || 0,
        totalDiscountGiven,
        totalOrderValue: totals?.totalOrderValue || 0,
        totalNetRevenue: totals?.totalNetRevenue || 0,
        averageDiscount: usageCount > 0 ? totalDiscountGiven / usageCount : 0,
        startDate: promo.startDate || null,
        endDate: promo.endDate || null,
        active: Boolean(promo.active),
      };
    });

    for (const [code, totals] of totalsByCode.entries()) {
      if (promoCodes.has(code) || code === "Unknown") {
        continue;
      }
      performanceData.push({
        _id: code,
        promoCode: code,
        promoName: "Unknown",
        usageCount: totals.usageCount || 0,
        promoType: null,
        value: 0,
        totalDiscountGiven: totals.totalDiscountGiven || 0,
        totalOrderValue: totals.totalOrderValue || 0,
        totalNetRevenue: totals.totalNetRevenue || 0,
        averageDiscount:
          totals.usageCount > 0
            ? totals.totalDiscountGiven / totals.usageCount
            : 0,
        startDate: null,
        endDate: null,
        active: false,
      });
    }

    performanceData.sort((a, b) => b.usageCount - a.usageCount);

    return {
      totalPromos,
      activePromos,
      inactivePromos: totalPromos - activePromos,
      performanceData,
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
