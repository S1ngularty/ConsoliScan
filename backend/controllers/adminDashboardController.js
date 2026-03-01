const adminDashboardService = require("../services/adminDashboardService");
const controllerWrapper = require("../utils/controllerWrapper");
const {
  generateComprehensiveReportPDF,
} = require("../utils/comprehensiveReportGenerator");

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
  const { limit, sortBy, startDate, endDate } = request.query;
  return adminDashboardService.getProductAnalytics({
    limit: limit ? parseInt(limit, 10) : 10,
    sortBy: sortBy || "sales",
    startDate,
    endDate,
  });
});

// Category Analytics
exports.getCategoryAnalytics = controllerWrapper((request) => {
  const { startDate, endDate } = request.query;
  return adminDashboardService.getCategoryAnalytics({ startDate, endDate });
});

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
exports.getPromotionAnalytics = controllerWrapper((request) => {
  const { startDate, endDate } = request.query;
  return adminDashboardService.getPromotionAnalytics({ startDate, endDate });
});

// Returns Analytics
exports.getReturnAnalytics = controllerWrapper((request) => {
  const { startDate, endDate } = request.query;
  return adminDashboardService.getReturnAnalytics({ startDate, endDate });
});

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

// Generate Comprehensive Report PDF
exports.generateComprehensiveReportPDF = generateComprehensiveReportPDF;
