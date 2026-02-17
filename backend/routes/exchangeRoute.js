/**
 * exchangeRoutes.js
 *
 * Matches your exact router pattern (authMiddlware.verifyToken, no restrictTo wrapper).
 * Role separation is handled in the service layer by checking request.user.role
 * if you need it, or just mount cashier routes under a separate prefix.
 *
 * Mount in your main app.js / server.js:
 *   const exchangeRoutes = require("./routes/exchangeRoutes");
 *   app.use("/api", exchangeRoutes);
 *
 * Drop into: routes/exchangeRoutes.js
 */

const express = require("express");
const router = express.Router();
const authMiddlware = require("../middlewares/authMiddleware");
const exchangeController = require("../controllers/exchangeController");

/* ═══════════════════════════════════════════════════════════════════════════
   CUSTOMER ROUTES
   ═══════════════════════════════════════════════════════════════════════════ */

// List all exchanges for the logged-in customer
router
  .route("/exchanges")
  .get(authMiddlware.verifyToken, exchangeController.getCustomerExchanges);

// Initiate a new exchange → returns signed QR token
router
  .route("/exchanges/initiate")
  .post(authMiddlware.verifyToken, exchangeController.initiateExchange);

// Get single exchange status (customer polls while waiting for cashier)
router
  .route("/exchanges/:exchangeId")
  .get(authMiddlware.verifyToken, exchangeController.getExchangeStatus);

// Cancel a pending/validated exchange
router
  .route("/exchanges/:exchangeId/cancel")
  .patch(authMiddlware.verifyToken, exchangeController.cancelExchange);

// Customer verifies replacement product price before showing to cashier
router
  .route("/exchanges/:exchangeId/verify-replacement")
  .post(authMiddlware.verifyToken, exchangeController.verifyReplacementPrice);

/* ═══════════════════════════════════════════════════════════════════════════
   CASHIER ROUTES
   (same verifyToken — add role check in service or via your existing role middleware)
   ═══════════════════════════════════════════════════════════════════════════ */

// Cashier scans customer QR → validates item condition
router
  .route("/exchanges/validate-qr")
  .post(authMiddlware.verifyToken, exchangeController.validateQR);

// Cashier scans replacement barcode → completes exchange + inventory update
router
  .route("/exchanges/:exchangeId/complete")
  .post(authMiddlware.verifyToken, exchangeController.completeExchange);

module.exports = router;
