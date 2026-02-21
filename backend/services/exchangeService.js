/**
 * exchangeService.js
 *
 * Follows your existing service pattern exactly:
 *  - Functions receive the full `request` object
 *  - Uses blockchainService for immutable logging
 *  - Uses emitCheckout / socket emitter for real-time UX
 *  - Uses mongoose sessions for atomic inventory updates (same as Product.bulkWrite pattern)
 *
 * Drop into: services/exchangeService.js
 */

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Exchange = require("../models/ExchangeModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const blockchainService = require("./blockchainService");
const { emitCheckout, emitToRoom } = require("../helper/socketEmitter");

/* ─── Config ──────────────────────────────────────────────────────────────── */
const JWT_SECRET = process.env.JWT_SECRET || "exchange_secret_fallback";
const EXCHANGE_WINDOW_DAYS = parseInt(
  process.env.EXCHANGE_WINDOW_DAYS || "7",
  10,
);

/* ─── Private helpers ─────────────────────────────────────────────────────── */
function signQrToken(payload) {
  return jwt.sign(payload, JWT_SECRET);
}

function verifyQrToken(token) {
  return jwt.verify(token, JWT_SECRET); // throws on invalid token
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. INITIATE EXCHANGE  (Customer — generates QR)
   POST /api/exchanges/initiate
   Body: { orderId, itemId }
   ═══════════════════════════════════════════════════════════════════════════ */
async function initiateExchange(request) {
  const { userId } = request.user;
  const { orderId, itemId } = request.body;

  if (!orderId || !itemId) throw new Error("orderId and itemId are required");

  /* ── Find the customer's confirmed order ── */
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    status: "CONFIRMED",
  });
  if (!order) throw new Error("Order not found or not eligible for exchange");

  /* ── Find the specific line item ── */
  const lineItem = order.items.find(
    (i) => i.product?.toString() === itemId || i._id?.toString() === itemId,
  );
  if (!lineItem) throw new Error("Item not found in this order");

  if (lineItem.status === "EXCHANGED") {
    throw new Error("This item has already been exchanged");
  }

  /* ── Exchange window check ── */
  const orderDate = new Date(order.confirmedAt || order.createdAt);
  if (orderDate < daysAgo(EXCHANGE_WINDOW_DAYS)) {
    throw new Error(
      `Exchange window closed. Items must be exchanged within ${EXCHANGE_WINDOW_DAYS} days of purchase`,
    );
  }

  /* ── Check for existing open exchange (reuse QR if still valid) ── */
  const existing = await Exchange.findOne({
    orderId,
    originalItemId: itemId,
    status: { $in: ["PENDING", "VALIDATED"] },
  });

  if (existing) {
    // Return the live exchange — app can re-display the same QR
    return existing;
  }

  /* ── Build & save new exchange ── */
  // Temporary token so we have an _id to embed
  const exchange = await Exchange.create({
    orderId,
    customerId: userId,
    originalItemId: new mongoose.Types.ObjectId(itemId),
    originalItemName: lineItem.name,
    price: lineItem.unitPrice,
    qrToken: "pending", // replaced below
    status: "PENDING",
    initiatedAt: new Date(),
  });

  const qrToken = signQrToken({
    exchangeId: exchange._id.toString(),
    orderId: orderId.toString(),
    itemId: itemId.toString(),
    customerId: userId.toString(),
    price: lineItem.unitPrice,
  });

  exchange.qrToken = qrToken;
  await exchange.save();

  return exchange;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. VALIDATE QR  (Cashier — scans customer QR at counter)
   POST /api/exchanges/validate-qr
   Body: { qrToken }
   ═══════════════════════════════════════════════════════════════════════════ */
async function validateExchangeQR(request) {
  const { userId } = request.user; // cashier's userId
  const { qrToken } = request.body;

  if (!qrToken) throw new Error("qrToken is required");

  /* ── Verify JWT ── */
  let payload;
  try {
    payload = verifyQrToken(qrToken);
  } catch {
    throw new Error("QR code is invalid");
  }

  const { exchangeId, orderId, itemId } = payload;

  /* ── Load exchange ── */
  const exchange = await Exchange.findById(exchangeId);
  if (!exchange) throw new Error("Exchange record not found");
  if (exchange.status === "COMPLETED")
    throw new Error("This exchange has already been completed");
  if (exchange.status === "CANCELLED")
    throw new Error("This exchange has been cancelled");
  if (exchange.status === "EXPIRED")
    throw new Error("This exchange has expired");

  /* ── Load order + line item for context ── */
  const order = await Order.findById(orderId).lean();
  if (!order) throw new Error("Order not found");

  const lineItem = order.items.find(
    (i) => i.product?.toString() === itemId || i._id?.toString() === itemId,
  );
  if (!lineItem) throw new Error("Item not found in order");
  if (lineItem.status === "EXCHANGED")
    throw new Error("Item is already marked as exchanged");

  /* ── Mark VALIDATED ── */
  exchange.status = "VALIDATED";
  exchange.cashierId = userId;
  exchange.timestamps.validatedAt = new Date();
  await exchange.save();

  /* ── Real-time: notify customer app via WebSocket ── */
  // Emit to exchange room so customer can receive real-time progress updates
  const roomName = `exchange:${exchange._id}`;
  console.log(
    `[Exchange] Validating exchange ${exchange._id}, room: ${roomName}`,
  );
  emitToRoom(roomName, "exchange:validated", {
    exchangeId: exchange._id,
    status: "VALIDATED",
    message: "Item verified — please pick your replacement",
  });
  console.log(`[Exchange] Emitted exchange:validated to room: ${roomName}`);

  return {
    exchange,
    order: {
      _id: order._id,
      checkoutCode: order.checkoutCode,
      confirmedAt: order.confirmedAt,
    },
    item: {
      name: lineItem.name,
      unitPrice: lineItem.unitPrice,
      sku: lineItem.sku,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. COMPLETE EXCHANGE  (Cashier — scans replacement barcode)
   POST /api/exchanges/:exchangeId/complete
   Body: { replacementBarcode }
   ═══════════════════════════════════════════════════════════════════════════ */
async function completeExchange(request) {
  const { userId } = request.user;
  const { exchangeId } = request.params;
  const { replacementBarcode } = request.body;

  if (!replacementBarcode) throw new Error("replacementBarcode is required");

  /* ── Load exchange ── */
  const exchange = await Exchange.findById(exchangeId);
  if (!exchange) throw new Error("Exchange not found");
  if (exchange.status !== "VALIDATED") {
    throw new Error(
      `Exchange must be VALIDATED before completing. Current: ${exchange.status}`,
    );
  }

  /* ── Load replacement product by barcode ── */
  const replacement = await Product.findOne({
    barcode: replacementBarcode,
    deletedAt: null,
  });
  if (!replacement) throw new Error("Replacement product not found");

  /* ── Price match ──
     Compare replacement current price (with active sale applied) against
     the original item's price paid during purchase (exchange.price).
     This ensures fair exchanges even when sales change between purchase and exchange.
  ── */
  const replacementPrice =
    replacement.saleActive && replacement.salePrice
      ? replacement.salePrice
      : replacement.price;

  const priceDifference = Math.abs(replacementPrice - exchange.price);
  if (priceDifference > 0.01) {
    throw new Error(
      `Price mismatch. Original price: ₱${exchange.price.toFixed(2)}, Replacement: ₱${replacementPrice.toFixed(2)}${replacement.saleActive ? " (on sale)" : ""}. Items must be the same price.`,
    );
  }

  /* ── Stock check ── */
  if (replacement.stockQuantity < 1) {
    throw new Error("Replacement item is out of stock");
  }

  /* ── Atomic updates (mirrors your Product.bulkWrite pattern) ── */
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const now = new Date();

    // 1. Update Order line item → EXCHANGED + embed exchangeInfo
    await Order.updateOne(
      {
        _id: exchange.orderId,
        "items.product": new mongoose.Types.ObjectId(exchange.originalItemId),
      },
      {
        $set: {
          "items.$.status": "EXCHANGED",
          "items.$.exchangeInfo.replacementItemId": replacement._id.toString(),
          "items.$.exchangeInfo.replacementName": replacement.name,
          "items.$.exchangeInfo.validatedAt": exchange.timestamps.validatedAt,
          "items.$.exchangeInfo.completedAt": now,
        },
      },
      { session },
    );

    // 2. Inventory: return original, deduct replacement (mirrors bulkWrite pattern)
    await Product.bulkWrite(
      [
        {
          updateOne: {
            filter: {
              _id: new mongoose.Types.ObjectId(exchange.originalItemId),
            },
            update: { $inc: { stockQuantity: 1 } }, // original returned
          },
        },
        {
          updateOne: {
            filter: { _id: replacement._id },
            update: { $inc: { stockQuantity: -1 } }, // replacement deducted
          },
        },
      ],
      { session },
    );

    // 3. Mark exchange COMPLETED
    exchange.status = "COMPLETED";
    exchange.cashierId = userId;
    exchange.replacementItemId = replacement._id.toString();
    exchange.replacementItemName = replacement.name;
    exchange.timestamps.completedAt = now;
    await exchange.save({ session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  /* ── Blockchain logging (mirrors your confirmOrder pattern) ── */
  try {
    const blockchainResult = await blockchainService.logExchangeCompleted({
      exchangeId: exchange._id,
      orderId: exchange.orderId,
      originalItemId: exchange.originalItemId,
      replacementItemId: replacement._id,
      price: exchange.price,
      completedAt: exchange.timestamps.completedAt,
    });
    exchange.blockchainTxId = blockchainResult.txId;
    exchange.blockchainHash = blockchainResult.hash;
    await exchange.save();
  } catch (blockchainErr) {
    // Non-fatal — log but don't fail the exchange
    console.error(
      "[Exchange] Blockchain logging failed:",
      blockchainErr.message,
    );
  }

  /* ── Real-time: notify customer app ── */
  // Emit to exchange room so customer receives completion update
  const completeRoomName = `exchange:${exchange._id}`;
  console.log(
    `[Exchange] Completing exchange ${exchange._id}, room: ${completeRoomName}`,
  );
  emitToRoom(completeRoomName, "exchange:completed", {
    exchangeId: exchange._id,
    status: "COMPLETED",
    replacementItemName: replacement.name,
    replacementPrice: replacementPrice,
    message: "Exchange complete! Collect your new item and receipt.",
  });
  console.log(
    `[Exchange] Emitted exchange:completed to room: ${completeRoomName}`,
  );

  return {
    exchange,
    replacement: {
      _id: replacement._id,
      name: replacement.name,
      sku: replacement.sku,
      barcode: replacement.barcode,
      price: replacementPrice,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. VALIDATE REPLACEMENT ITEM  (Cashier — scans & validates replacement barcode)
   POST /api/exchanges/:exchangeId/validate-replacement
   Body: { replacementBarcode }
   ═══════════════════════════════════════════════════════════════════════════ */
async function validateReplacementItem(request) {
  const { userId } = request.user; // cashier's userId
  const { exchangeId } = request.params;
  const { replacementBarcode } = request.body;

  if (!replacementBarcode) throw new Error("replacementBarcode is required");

  /* ── Load exchange ── */
  const exchange = await Exchange.findById(exchangeId);
  if (!exchange) throw new Error("Exchange not found");
  if (exchange.status !== "VALIDATED") {
    throw new Error(
      `Exchange must be VALIDATED before validating replacement. Current: ${exchange.status}`,
    );
  }

  /* ── Look up product by barcode ── */
  const replacement = await Product.findOne({
    barcode: replacementBarcode,
    deletedAt: null,
  });
  if (!replacement) throw new Error("Product not found by barcode");

  /* ── Stock check ── */
  if (replacement.stockQuantity < 1) {
    throw new Error("Product is out of stock");
  }

  /* ── Price match validation ── */
  const replacementPrice =
    replacement.saleActive && replacement.salePrice
      ? replacement.salePrice
      : replacement.price;

  const priceDifference = Math.abs(replacementPrice - exchange.price);
  if (priceDifference > 0.01) {
    throw new Error(
      `Price mismatch. Original price: ₱${exchange.price.toFixed(2)}, Replacement: ₱${replacementPrice.toFixed(2)}${replacement.saleActive ? " (on sale)" : ""}. Items must be the same price.`,
    );
  }

  /* ── All validations passed ── */
  return {
    isValid: true,
    product: {
      _id: replacement._id,
      name: replacement.name,
      sku: replacement.sku,
      barcode: replacement.barcode,
      price: replacementPrice,
      stockQuantity: replacement.stockQuantity,
    },
    message: "Replacement item validated successfully",
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. GET EXCHANGE STATUS  (Customer — polls or checks after WS event)
   GET /api/exchanges/:exchangeId
   ═══════════════════════════════════════════════════════════════════════════ */
async function getExchangeStatus(request) {
  const { userId } = request.user;
  const { exchangeId } = request.params;

  const exchange = await Exchange.findOne({
    _id: exchangeId,
    customerId: userId,
  })
    .populate("orderId", "checkoutCode confirmedAt")
    .lean();

  if (!exchange) throw new Error("Exchange not found");
  return exchange;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. LIST CUSTOMER EXCHANGES  (Customer — exchange history tab)
   GET /api/exchanges
   ═══════════════════════════════════════════════════════════════════════════ */
async function getCustomerExchanges(request) {
  const { userId } = request.user;

  const exchanges = await Exchange.find({ customerId: userId })
    .sort({ createdAt: -1 })
    .populate("orderId", "checkoutCode confirmedAt finalAmountPaid")
    .lean();

  return exchanges;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. CANCEL EXCHANGE  (Customer — before cashier validates)
   PATCH /api/exchanges/:exchangeId/cancel
   ═══════════════════════════════════════════════════════════════════════════ */
async function cancelExchange(request) {
  const { userId } = request.user;
  const { exchangeId } = request.params;

  const exchange = await Exchange.findOne({
    _id: exchangeId,
    customerId: userId,
  });
  if (!exchange) throw new Error("Exchange not found");

  if (!["PENDING", "VALIDATED"].includes(exchange.status)) {
    throw new Error(
      `Cannot cancel a ${exchange.status.toLowerCase()} exchange`,
    );
  }

  exchange.status = "CANCELLED";
  await exchange.save();
  return exchange;
}

/**
 * Customer verifies replacement product price.
 * Allows customer to scan products and check if price matches before showing to cashier.
 */
async function verifyReplacementPrice(request) {
  const { exchangeId } = request.params;
  const { barcode } = request.body;
  const { userId } = request.user;

  if (!barcode) throw new Error("Barcode is required");

  // Find exchange
  const exchange = await Exchange.findOne({
    _id: exchangeId,
    customerId: userId,
    status: "VALIDATED",
  });
  if (!exchange)
    throw new Error("Exchange not found or not in validated state");

  // Look up product by barcode
  const product = await Product.findOne({ barcode }).lean();
  if (!product) throw new Error("Product not found");

  // Check if on sale
  const productPrice =
    product.isOnSale && product.salePrice ? product.salePrice : product.price;

  // Verify price matches
  const isValid = Math.abs(productPrice - exchange.price) < 0.01;

  return {
    isValid,
    product: {
      _id: product._id,
      name: product.name,
      barcode: product.barcode,
      price: productPrice,
    },
    message: isValid
      ? "Valid replacement - show this item to the cashier"
      : `Price mismatch: This item costs ₱${productPrice.toFixed(2)}, but you need ₱${exchange.price.toFixed(2)}`,
  };
}

module.exports = {
  initiateExchange,
  validateExchangeQR,
  validateReplacementItem,
  completeExchange,
  getExchangeStatus,
  getCustomerExchanges,
  cancelExchange,
  verifyReplacementPrice,
};
