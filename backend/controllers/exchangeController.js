/**
 * exchangeController.js
 *
 * Matches your exact controller pattern:
 *  - confirmOrder-style manual try/catch for complex responses
 *  - controllerWrapper for simple read operations
 *
 * Drop into: controllers/exchangeController.js
 */

const exchangeService = require("../services/exchangeService");
const controllerWrapper = require("../utils/controllerWrapper");

/* ═══════════════════════════════════════════════════════════════════════════
   CUSTOMER ENDPOINTS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * POST /api/exchanges/initiate
 * Customer generates a QR for an item they want to exchange.
 */
async function initiateExchange(req, res) {
  try {
    const exchange = await exchangeService.initiateExchange(req);
    res.status(201).json({
      success: true,
      exchangeId: exchange._id,
      qrToken: exchange.qrToken,
      status: exchange.status,
      price: exchange.price,
      itemName: exchange.originalItemName,
    });
  } catch (error) {
    console.error("[ExchangeController] initiateExchange:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/exchanges/:exchangeId
 * Customer polls status (complement to WebSocket).
 * Uses controllerWrapper — same as getUser_OrderList.
 */
const getExchangeStatus = controllerWrapper(exchangeService.getExchangeStatus);

/**
 * GET /api/exchanges
 * Customer's full exchange history list.
 */
const getCustomerExchanges = controllerWrapper(
  exchangeService.getCustomerExchanges,
);

/**
 * PATCH /api/exchanges/:exchangeId/cancel
 * Customer cancels a pending exchange before going to the store.
 */
async function cancelExchange(req, res) {
  try {
    const exchange = await exchangeService.cancelExchange(req);
    res.status(200).json({ success: true, exchange });
  } catch (error) {
    console.error("[ExchangeController] cancelExchange:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/exchanges/:exchangeId/verify-replacement
 * Customer scans product to verify it matches the exchange price.
 */
async function verifyReplacementPrice(req, res) {
  try {
    const result = await exchangeService.verifyReplacementPrice(req);
    res.status(200).json({
      success: true,
      isValid: result.isValid,
      product: result.product,
      message: result.message,
    });
  } catch (error) {
    console.error(
      "[ExchangeController] verifyReplacementPrice:",
      error.message,
    );
    res.status(400).json({ success: false, message: error.message });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   CASHIER ENDPOINTS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * POST /api/exchanges/validate-qr
 * Cashier scans the customer's QR — validates item eligibility.
 */
async function validateQR(req, res) {
  try {
    const result = await exchangeService.validateExchangeQR(req);
    res.status(200).json({
      success: true,
      exchangeId: result.exchange._id,
      status: result.exchange.status,
      price: result.exchange.price,
      order: result.order,
      item: result.item,
    });
  } catch (error) {
    console.error("[ExchangeController] validateQR:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/exchanges/:exchangeId/validate-replacement
 * Cashier scans replacement barcode — validates product validity.
 */
async function validateReplacementItem(req, res) {
  try {
    const result = await exchangeService.validateReplacementItem(req);
    res.status(200).json({
      success: true,
      isValid: result.isValid,
      product: result.product,
      message: result.message,
    });
  } catch (error) {
    console.error(
      "[ExchangeController] validateReplacementItem:",
      error.message,
    );
    res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/exchanges/:exchangeId/complete
 * Cashier scans replacement barcode — completes exchange, updates inventory.
 */
async function completeExchange(req, res) {
  try {
    const result = await exchangeService.completeExchange(req);
    res.status(200).json({
      success: true,
      exchangeId: result.exchange._id,
      status: result.exchange.status,
      blockchainTxId: result.exchange.blockchainTxId,
      replacement: result.replacement,
    });
  } catch (error) {
    console.error("[ExchangeController] completeExchange:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  initiateExchange,
  getExchangeStatus,
  getCustomerExchanges,
  cancelExchange,
  verifyReplacementPrice,
  validateQR,
  validateReplacementItem,
  completeExchange,
};
