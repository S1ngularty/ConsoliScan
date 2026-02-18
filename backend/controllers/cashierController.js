/**
 * cashierController.js
 *
 * Controllers for cashier-specific operations
 */

const cashierService = require("../services/cashierService");
const controllerWrapper = require("../utils/controllerWrapper");

/**
 * GET /api/v1/cashier/dashboard
 * Get dashboard statistics for the logged-in cashier
 */
const getDashboardStats = controllerWrapper(cashierService.getDashboardStats);

/**
 * GET /api/v1/cashier/recent-transactions
 * Get recent transactions for the logged-in cashier
 */
const getRecentTransactions = controllerWrapper(
  cashierService.getRecentTransactions,
);

/**
 * GET /api/v1/cashier/pending-queues
 * Get pending checkout queues
 */
const getPendingQueues = controllerWrapper(cashierService.getPendingQueues);

/**
 * GET /api/v1/cashier/recent-exchanges
 * Get recent exchanges handled by the cashier
 */
const getRecentExchanges = controllerWrapper(cashierService.getRecentExchanges);

/**
 * GET /api/v1/cashier/inventory
 * Get inventory list with search and filters
 */
const getInventory = controllerWrapper(cashierService.getInventory);

/**
 * PATCH /api/v1/cashier/inventory/:productId/stock
 * Update product stock quantity
 */
const updateStock = controllerWrapper(cashierService.updateStock);

/**
 * GET /api/v1/cashier/reports
 * Get sales reports with date range
 */
const getSalesReports = controllerWrapper(cashierService.getSalesReports);

/**
 * GET /api/v1/cashier/transactions
 * Get transaction history with filters
 */
const getTransactionHistory = controllerWrapper(
  cashierService.getTransactionHistory,
);

/**
 * GET /api/v1/cashier/low-stock-alerts
 * Get low stock alerts
 */
const getLowStockAlerts = controllerWrapper(cashierService.getLowStockAlerts);

/**
 * GET /api/v1/cashier/profile
 * Get cashier profile information
 */
const getProfile = controllerWrapper(cashierService.getProfile);

/**
 * PUT /api/v1/cashier/profile
 * Update cashier profile
 */
const updateProfile = controllerWrapper(cashierService.updateProfile);

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
