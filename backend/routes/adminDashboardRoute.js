const express = require("express");
const router = express.Router();
const adminDashboardController = require("../controllers/adminDashboardController");
const { verifyToken, roleAccess } = require("../middlewares/authMiddleware");

// Apply auth middleware to all dashboard routes
router.use(verifyToken);
// Apply role access middleware - only admins can access
router.use(roleAccess("admin"));

// ==================== DASHBOARD ENDPOINTS ====================

// Main dashboard summary
router.get("/dashboard/summary", adminDashboardController.getDashboardSummary);

// ==================== ANALYTICS ENDPOINTS ====================

// Sales Analytics
// Query params: startDate, endDate, groupBy (day|week|month)
router.get("/analytics/sales", adminDashboardController.getSalesAnalytics);

// Product Analytics
// Query params: limit (default 10), sortBy (sales|revenue|rating)
router.get("/analytics/products", adminDashboardController.getProductAnalytics);

// Category Analytics
router.get(
  "/analytics/categories",
  adminDashboardController.getCategoryAnalytics,
);

// User Analytics
// Query params: startDate, endDate
router.get("/analytics/users", adminDashboardController.getUserAnalytics);

// Order Analytics
// Query params: startDate, endDate
router.get("/analytics/orders", adminDashboardController.getOrderAnalytics);

// Inventory Analytics
router.get(
  "/analytics/inventory",
  adminDashboardController.getInventoryAnalytics,
);

// Promotion Analytics
router.get(
  "/analytics/promotions",
  adminDashboardController.getPromotionAnalytics,
);

// Checkout Queue Analytics
router.get(
  "/analytics/checkout-queue",
  adminDashboardController.getCheckoutQueueAnalytics,
);

// ==================== ACTIVITY & LOGS ====================

// Activity Logs
// Query params: limit (default 50), page (default 1), userId, action, status
router.get("/logs/activity", adminDashboardController.getActivityLogs);

// ==================== COMPREHENSIVE REPORTS ====================

// Full dashboard report with all analytics
// Query params: startDate, endDate
router.get(
  "/reports/comprehensive",
  adminDashboardController.getComprehensiveReport,
);

module.exports = router;
