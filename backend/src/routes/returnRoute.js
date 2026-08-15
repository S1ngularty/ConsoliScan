const express = require("express");
const router = express.Router();

const returnService = require("../services/returnService");
const authMiddleware = require("../middlewares/authMiddleware");

/* ─── Error wrapper ─────────────────────────────────────────────────────── */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* ═══════════════════════════════════════════════════════════════════════════
   CUSTOMER ROUTES
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * POST /api/returns/initiate
 * Customer initiates a return
 */
router.post(
  "/initiate",
  authMiddleware.verifyToken,
  asyncHandler(async (req, res) => {
    const result = await returnService.initiateReturn(req);
    res.status(201).json({
      success: true,
      message: "Return initiated",
      result,
    });
  }),
);

/**
 * GET /api/returns
 * Customer gets their return history
 */
router.get(
  "/",
  authMiddleware.verifyToken,
  asyncHandler(async (req, res) => {
    const result = await returnService.getCustomerReturns(req);
    res.status(200).json({
      success: true,
      message: "Returns retrieved",
      result,
    });
  }),
);

/**
 * GET /api/returns/:returnId
 * Get return status
 */
router.get(
  "/:returnId",
  authMiddleware.verifyToken,
  asyncHandler(async (req, res) => {
    const result = await returnService.getReturnStatus(req);
    res.status(200).json({
      success: true,
      message: "Return status retrieved",
      result,
    });
  }),
);

/**
 * PATCH /api/returns/:returnId/cancel
 * Customer cancels return
 */
router.patch(
  "/:returnId/cancel",
  authMiddleware.verifyToken,
  asyncHandler(async (req, res) => {
    const result = await returnService.cancelReturn(req);
    res.status(200).json({
      success: true,
      message: "Return cancelled",
      result,
    });
  }),
);

/* ═══════════════════════════════════════════════════════════════════════════
   CASHIER ROUTES
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * POST /api/returns/validate-qr
 * Cashier validates return QR or checkout code
 */
router.post(
  "/validate-qr",
  authMiddleware.verifyToken,
  asyncHandler(async (req, res) => {
    const result = await returnService.validateReturnQR(req);
    res.status(200).json({
      success: true,
      message: "Return validated",
      result,
    });
  }),
);

/**
 * POST /api/returns/:returnId/inspect
 * Cashier inspects returned item
 */
router.post(
  "/:returnId/inspect",
  authMiddleware.verifyToken,
  asyncHandler(async (req, res) => {
    const result = await returnService.inspectReturn(req);
    res.status(200).json({
      success: true,
      message: "Item inspection completed",
      result,
    });
  }),
);

/**
 * POST /api/returns/:returnId/complete-loyalty
 * Cashier completes return as loyalty points
 */
router.post(
  "/:returnId/complete-loyalty",
  authMiddleware.verifyToken,
  asyncHandler(async (req, res) => {
    const result = await returnService.completeReturnLoyalty(req);
    res.status(200).json({
      success: true,
      message: "Return completed as loyalty conversion",
      result,
    });
  }),
);

/**
 * POST /api/returns/:returnId/complete-swap
 * Cashier completes return as item swap
 */
router.post(
  "/:returnId/complete-swap",
  authMiddleware.verifyToken,
  asyncHandler(async (req, res) => {
    const result = await returnService.completeReturnSwap(req);
    res.status(200).json({
      success: true,
      message: "Return completed as item swap",
      result,
    });
  }),
);

/**
 * POST /api/returns/:returnId/reject
 * Cashier rejects return
 */
router.post(
  "/:returnId/reject",
  authMiddleware.verifyToken,
  asyncHandler(async (req, res) => {
    const result = await returnService.rejectReturn(req);
    res.status(200).json({
      success: true,
      message: "Return rejected",
      result,
    });
  }),
);

module.exports = router;
