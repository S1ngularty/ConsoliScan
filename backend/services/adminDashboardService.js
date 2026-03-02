const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const ActivityLog = require("../models/activityLogsModel");
const Category = require("../models/categoryModel");
const Promo = require("../models/promoModel");
const Return = require("../models/ReturnModel");
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

// ==================== RETURNS ANALYTICS ====================
const getReturnAnalytics = async (params = {}) => {
  try {
    const { startDate, endDate } = params;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.initiatedAt = {};
      if (startDate) dateFilter.initiatedAt.$gte = new Date(startDate);
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        endDateObj.setHours(0, 0, 0, 0);
        dateFilter.initiatedAt.$lt = endDateObj;
      }
    }

    const [returns, statusBreakdown, fulfillmentBreakdown, summaryAgg] =
      await Promise.all([
        Return.find(dateFilter)
          .populate("customerId", "name email")
          .populate("orderId", "checkoutCode confirmedAt")
          .sort({ initiatedAt: -1 })
          .lean(),
        Return.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalValue: { $sum: "$originalPrice" },
            },
          },
          { $sort: { count: -1 } },
        ]),
        Return.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: "$fulfillmentType",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]),
        Return.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: null,
              totalReturns: { $sum: 1 },
              totalReturnedValue: { $sum: "$originalPrice" },
              avgReturnValue: { $avg: "$originalPrice" },
            },
          },
        ]),
      ]);

    const summary = summaryAgg[0] || {
      totalReturns: 0,
      totalReturnedValue: 0,
      avgReturnValue: 0,
    };

    const statusMap = statusBreakdown.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const completedReturns = statusMap.COMPLETED || 0;
    const rejectedReturns = statusMap.REJECTED || 0;
    const cancelledReturns = statusMap.CANCELLED || 0;
    const pendingReturns =
      (statusMap.PENDING || 0) +
      (statusMap.VALIDATED || 0) +
      (statusMap.INSPECTED || 0);

    return {
      summary: {
        ...summary,
        completedReturns,
        rejectedReturns,
        cancelledReturns,
        pendingReturns,
        completionRate:
          summary.totalReturns > 0
            ? (completedReturns / summary.totalReturns) * 100
            : 0,
      },
      statusBreakdown,
      fulfillmentBreakdown,
      data: returns,
    };
  } catch (error) {
    throw new Error(`Failed to get return analytics: ${error.message}`);
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
      returns,
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
      getReturnAnalytics(params),
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
      returnAnalytics: returns,
      checkoutQueueStatus: queue,
    };
  } catch (error) {
    throw new Error(
      `Failed to generate comprehensive report: ${error.message}`,
    );
  }
};

// ==================== STAFF PERFORMANCE ANALYTICS ====================
const getStaffPerformanceAnalytics = async (params = {}) => {
  try {
    const { startDate, endDate, limit = 10 } = params;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Cashier performance by orders processed
    const cashierPerformance = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["CONFIRMED", "COMPLETED"] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "cashier",
          foreignField: "_id",
          as: "cashier",
        },
      },
      { $unwind: { path: "$cashier", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$cashier._id",
          cashierName: { $first: "$cashier.name" },
          cashierEmail: { $first: "$cashier.email" },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmountPaid" },
          avgOrderValue: { $avg: "$finalAmountPaid" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Activity logs by user
    const userActivityCount = await ActivityLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$user",
          activityCount: { $sum: 1 },
        },
      },
      { $sort: { activityCount: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          userId: "$_id",
          userName: "$userInfo.name",
          role: "$userInfo.role",
          activityCount: 1,
        },
      },
    ]);

    return {
      cashierPerformance,
      userActivityCount,
    };
  } catch (error) {
    throw new Error(
      `Failed to get staff performance analytics: ${error.message}`,
    );
  }
};

// ==================== CUSTOMER INSIGHTS ====================
const getCustomerInsights = async (params = {}) => {
  try {
    const { limit = 10 } = params;

    // Customer Lifetime Value (CLV)
    const customerCLV = await Order.aggregate([
      {
        $match: { status: { $in: ["CONFIRMED", "COMPLETED"] } },
      },
      {
        $group: {
          _id: "$user",
          totalSpent: { $sum: "$finalAmountPaid" },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: "$finalAmountPaid" },
          firstPurchase: { $min: "$createdAt" },
          lastPurchase: { $max: "$createdAt" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          customerId: "$_id",
          customerName: "$customer.name",
          customerEmail: "$customer.email",
          customerType: "$customer.customerType",
          totalSpent: 1,
          orderCount: 1,
          avgOrderValue: 1,
          firstPurchase: 1,
          lastPurchase: 1,
        },
      },
    ]);

    // Customer segmentation
    const customerSegmentation = await User.aggregate([
      {
        $match: { role: "user", status: "active" },
      },
      {
        $group: {
          _id: "$customerType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Purchase frequency
    const purchaseFrequency = await Order.aggregate([
      {
        $match: { status: { $in: ["CONFIRMED", "COMPLETED"] } },
      },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$orderCount",
          customerCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // New vs returning customers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCustomers = await User.countDocuments({
      role: "user",
      createdAt: { $gte: thirtyDaysAgo },
    });

    const returningCustomers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ["CONFIRMED", "COMPLETED"] },
        },
      },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
        },
      },
      {
        $match: { orderCount: { $gt: 1 } },
      },
      {
        $count: "total",
      },
    ]);

    return {
      topCustomers: customerCLV,
      segmentation: customerSegmentation,
      purchaseFrequency,
      newCustomersLast30Days: newCustomers,
      returningCustomersLast30Days: returningCustomers[0]?.total || 0,
    };
  } catch (error) {
    throw new Error(`Failed to get customer insights: ${error.message}`);
  }
};

// ==================== PRODUCT PERFORMANCE ANALYTICS ====================
const getProductPerformanceAnalytics = async (params = {}) => {
  try {
    const { startDate, endDate, limit = 20 } = params;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Slow-moving inventory (low sales, high stock)
    const slowMoving = await Product.aggregate([
      {
        $match: {
          deletedAt: null,
          stock: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "orders",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                ...dateFilter,
                status: { $in: ["CONFIRMED", "COMPLETED"] },
              },
            },
            { $unwind: "$items" },
            {
              $match: {
                $expr: { $eq: ["$items.product", "$$productId"] },
              },
            },
            {
              $group: {
                _id: null,
                totalSold: { $sum: "$items.quantity" },
              },
            },
          ],
          as: "salesData",
        },
      },
      {
        $addFields: {
          totalSold: {
            $ifNull: [{ $arrayElemAt: ["$salesData.totalSold", 0] }, 0],
          },
        },
      },
      {
        $match: {
          totalSold: { $lt: 5 }, // Less than 5 units sold
        },
      },
      {
        $project: {
          name: 1,
          sku: 1,
          stock: 1,
          price: 1,
          totalSold: 1,
          stockValue: { $multiply: ["$stock", "$price"] },
        },
      },
      { $sort: { stockValue: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Fast-moving products
    const fastMoving = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["CONFIRMED", "COMPLETED"] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
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
          productId: "$_id",
          productName: "$product.name",
          sku: "$product.sku",
          currentStock: "$product.stock",
          totalSold: 1,
          totalRevenue: 1,
        },
      },
    ]);

    // Product profitability (if cost is available)
    const profitability = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["CONFIRMED", "COMPLETED"] },
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $addFields: {
          cost: { $ifNull: ["$productInfo.cost", 0] },
          profit: {
            $subtract: [
              "$items.subtotal",
              {
                $multiply: [
                  "$items.quantity",
                  { $ifNull: ["$productInfo.cost", 0] },
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$productInfo.name" },
          sku: { $first: "$productInfo.sku" },
          totalRevenue: { $sum: "$items.subtotal" },
          totalProfit: { $sum: "$profit" },
          unitsSold: { $sum: "$items.quantity" },
        },
      },
      {
        $addFields: {
          profitMargin: {
            $cond: [
              { $gt: ["$totalRevenue", 0] },
              {
                $multiply: [
                  { $divide: ["$totalProfit", "$totalRevenue"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { totalProfit: -1 } },
      { $limit: parseInt(limit) },
    ]);

    return {
      slowMoving,
      fastMoving,
      profitability,
    };
  } catch (error) {
    throw new Error(
      `Failed to get product performance analytics: ${error.message}`,
    );
  }
};

// ==================== FINANCIAL REPORTS ====================
const getFinancialReports = async (params = {}) => {
  try {
    const { startDate, endDate } = params;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Payment method breakdown
    const paymentBreakdown = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["CONFIRMED", "COMPLETED"] },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          totalAmount: { $sum: "$finalAmountPaid" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // Profit margin analysis
    const profitMargin = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["CONFIRMED", "COMPLETED"] },
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          itemCost: {
            $multiply: [
              "$items.quantity",
              { $ifNull: ["$productInfo.cost", 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$items.subtotal" },
          totalCost: { $sum: "$itemCost" },
          totalDiscount: {
            $sum: { $ifNull: ["$discountBreakdown.total", 0] },
          },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalCost: 1,
          totalDiscount: 1,
          grossProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
          profitMargin: {
            $cond: [
              { $gt: ["$totalRevenue", 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ["$totalRevenue", "$totalCost"] },
                      "$totalRevenue",
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    // Daily cash flow
    const dailyCashFlow = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["CONFIRMED", "COMPLETED"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalRevenue: { $sum: "$finalAmountPaid" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    return {
      paymentBreakdown,
      profitMargin: profitMargin[0] || {
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
        profitMargin: 0,
      },
      dailyCashFlow,
    };
  } catch (error) {
    throw new Error(`Failed to get financial reports: ${error.message}`);
  }
};

// ==================== PREDICTIVE ANALYTICS ====================
const getPredictiveAnalytics = async (params = {}) => {
  try {
    const { forecastDays = 30 } = params;

    // Get historical sales data (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const historicalSales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: ninetyDaysAgo },
          status: { $in: ["CONFIRMED", "COMPLETED"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          dailyRevenue: { $sum: "$finalAmountPaid" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Simple moving average for forecast
    const recentData = historicalSales.slice(-30);
    const avgDailyRevenue =
      recentData.reduce((sum, day) => sum + day.dailyRevenue, 0) /
      recentData.length;
    const avgDailyOrders =
      recentData.reduce((sum, day) => sum + day.orderCount, 0) /
      recentData.length;

    const forecast = {
      avgDailyRevenue: avgDailyRevenue || 0,
      avgDailyOrders: avgDailyOrders || 0,
      projectedMonthlyRevenue: (avgDailyRevenue || 0) * forecastDays,
      projectedMonthlyOrders: Math.round((avgDailyOrders || 0) * forecastDays),
    };

    // Inventory reorder recommendations
    const reorderRecommendations = await Product.aggregate([
      {
        $match: {
          deletedAt: null,
          stock: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "orders",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                createdAt: { $gte: ninetyDaysAgo },
                status: { $in: ["CONFIRMED", "COMPLETED"] },
              },
            },
            { $unwind: "$items" },
            {
              $match: {
                $expr: { $eq: ["$items.product", "$$productId"] },
              },
            },
            {
              $group: {
                _id: null,
                totalSold: { $sum: "$items.quantity" },
              },
            },
          ],
          as: "salesData",
        },
      },
      {
        $addFields: {
          totalSold: {
            $ifNull: [{ $arrayElemAt: ["$salesData.totalSold", 0] }, 0],
          },
          avgDailySales: {
            $divide: [
              { $ifNull: [{ $arrayElemAt: ["$salesData.totalSold", 0] }, 0] },
              90,
            ],
          },
          daysOfStockRemaining: {
            $cond: [
              {
                $gt: [
                  {
                    $ifNull: [{ $arrayElemAt: ["$salesData.totalSold", 0] }, 0],
                  },
                  0,
                ],
              },
              {
                $divide: [
                  "$stock",
                  {
                    $divide: [
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$salesData.totalSold", 0] },
                          0,
                        ],
                      },
                      90,
                    ],
                  },
                ],
              },
              9999,
            ],
          },
        },
      },
      {
        $match: {
          daysOfStockRemaining: { $lt: forecastDays },
        },
      },
      {
        $project: {
          name: 1,
          sku: 1,
          stock: 1,
          avgDailySales: 1,
          daysOfStockRemaining: 1,
          recommendedOrderQty: {
            $ceil: {
              $multiply: ["$avgDailySales", forecastDays],
            },
          },
        },
      },
      { $sort: { daysOfStockRemaining: 1 } },
      { $limit: 20 },
    ]);

    // Peak hours analysis
    const peakHours = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: ninetyDaysAgo },
          status: { $in: ["CONFIRMED", "COMPLETED"] },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          orderCount: { $sum: 1 },
          avgRevenue: { $avg: "$finalAmountPaid" },
        },
      },
      { $sort: { orderCount: -1 } },
    ]);

    return {
      forecast,
      reorderRecommendations,
      peakHours,
      historicalTrend: historicalSales,
    };
  } catch (error) {
    throw new Error(`Failed to get predictive analytics: ${error.message}`);
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
  getReturnAnalytics,
  getActivityLogs,
  getCheckoutQueueAnalytics,
  getComprehensiveReport,
  getStaffPerformanceAnalytics,
  getCustomerInsights,
  getProductPerformanceAnalytics,
  getFinancialReports,
  getPredictiveAnalytics,
};
