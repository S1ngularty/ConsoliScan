const adminDashboardService = require("../services/adminDashboardService");
const controllerWrapper = require("../utils/controllerWrapper");

// Dashboard Summary
exports.getDashboardSummary = controllerWrapper(
  adminDashboardService.getDashboardSummary,
);

// Sales Analytics
exports.getSalesAnalytics = controllerWrapper((request) => {
  const { startDate, endDate, groupBy } = request.query;
  return adminDashboardService.getSalesAnalytics({
    startDate,
    endDate,
    groupBy: groupBy || "day",
  });
});

// Product Analytics
exports.getProductAnalytics = controllerWrapper((request) => {
  const { limit, sortBy } = request.query;
  return adminDashboardService.getProductAnalytics({
    limit: limit || 10,
    sortBy: sortBy || "sales",
  });
});

// Category Analytics
exports.getCategoryAnalytics = controllerWrapper(
  adminDashboardService.getCategoryAnalytics,
);

// User Analytics
exports.getUserAnalytics = controllerWrapper((request) => {
  const { startDate, endDate } = request.query;
  return adminDashboardService.getUserAnalytics({ startDate, endDate });
});

// Order Analytics
exports.getOrderAnalytics = controllerWrapper((request) => {
  const { startDate, endDate } = request.query;
  return adminDashboardService.getOrderAnalytics({ startDate, endDate });
});

// Inventory Analytics
exports.getInventoryAnalytics = controllerWrapper(
  adminDashboardService.getInventoryAnalytics,
);

// Promotion Analytics
exports.getPromotionAnalytics = controllerWrapper(
  adminDashboardService.getPromotionAnalytics,
);

// Activity Logs
exports.getActivityLogs = controllerWrapper((request) => {
  const { limit, page, userId, action, status } = request.query;
  return adminDashboardService.getActivityLogs({
    limit: limit ? parseInt(limit) : 50,
    page: page ? parseInt(page) : 1,
    userId,
    action,
    status,
  });
});

// Checkout Queue Analytics
exports.getCheckoutQueueAnalytics = controllerWrapper(
  adminDashboardService.getCheckoutQueueAnalytics,
);

// Comprehensive Report
exports.getComprehensiveReport = controllerWrapper((request) => {
  const { startDate, endDate } = request.query;
  return adminDashboardService.getComprehensiveReport({
    startDate,
    endDate,
  });
});
