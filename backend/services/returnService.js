/**
 * returnService.js
 *
 * Return management service with inspection & fulfillment options:
 *  - Initiate return (customer)
 *  - Validate QR or checkout code (cashier)
 *  - Inspect item (cashier)
 *  - Complete as loyalty conversion (cashier)
 *  - Complete as item swap (cashier)
 *  - Reject return (cashier)
 *  - Cancel return (customer or cashier)
 */

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Return = require("../models/ReturnModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const blockchainService = require("./blockchainService");
const { emitCheckout, emitToRoom } = require("../helper/socketEmitter");

/* ─── Config ──────────────────────────────────────────────────────────────── */
const JWT_SECRET = process.env.JWT_SECRET || "return_secret_fallback";
const RETURN_WINDOW_DAYS = parseInt(process.env.RETURN_WINDOW_DAYS || "14", 10);

/* ─── Private helpers ─────────────────────────────────────────────────────── */
function signQrToken(payload) {
  return jwt.sign(payload, JWT_SECRET);
}

function verifyQrToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. INITIATE RETURN  (Customer)
   POST /api/returns/initiate
   Body: { orderId, itemId, returnReason, returnReasonNotes }
   ═══════════════════════════════════════════════════════════════════════════ */
async function initiateReturn(request) {
  const { userId } = request.user;
  const { orderId, itemId, returnReason, returnReasonNotes } = request.body;

  if (!orderId || !itemId) throw new Error("orderId and itemId are required");

  /* ── Find customer's confirmed order ── */
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    status: "CONFIRMED",
  });
  if (!order) throw new Error("Order not found or not eligible for return");

  /* ── Find line item ── */
  const lineItem = order.items.find(
    (i) => i.product?.toString() === itemId || i._id?.toString() === itemId,
  );
  if (!lineItem) throw new Error("Item not found in this order");

  if (lineItem.status === "RETURNED") {
    throw new Error("This item has already been returned");
  }

  if (lineItem.status === "EXCHANGED") {
    throw new Error("This item has already been exchanged");
  }

  /* ── Return window check ── */
  const orderDate = new Date(order.confirmedAt || order.createdAt);
  if (orderDate < daysAgo(RETURN_WINDOW_DAYS)) {
    throw new Error(
      `Return window closed. Items must be returned within ${RETURN_WINDOW_DAYS} days of purchase`,
    );
  }

  /* ── Check for existing open return (reuse QR if valid) ── */
  const existing = await Return.findOne({
    orderId,
    originalItemId: itemId,
    status: { $in: ["PENDING", "VALIDATED", "INSPECTED"] },
  });

  if (existing) {
    return existing;
  }

  /* ── Create return document ── */
  const returnDoc = await Return.create({
    orderId,
    customerId: userId,
    originalItemId: new mongoose.Types.ObjectId(itemId),
    originalItemName: lineItem.name,
    originalPrice: lineItem.unitPrice,
    returnReason: returnReason || "changed_mind",
    returnReasonNotes: returnReasonNotes || "",
    qrToken: "pending",
    status: "PENDING",
    initiatedAt: new Date(),
  });

  /* ── Sign QR token ── */
  const qrToken = signQrToken({
    returnId: returnDoc._id.toString(),
    orderId: orderId.toString(),
    itemId: itemId.toString(),
    customerId: userId.toString(),
    price: lineItem.unitPrice,
  });

  returnDoc.qrToken = qrToken;
  await returnDoc.save();

  return returnDoc;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. VALIDATE RETURN QR  (Cashier)
   POST /api/returns/validate-qr
   Body: { qrToken } OR { checkoutCode } (for offline)
   ═══════════════════════════════════════════════════════════════════════════ */
async function validateReturnQR(request) {
  const { userId } = request.user; // cashier userId
  const { qrToken, checkoutCode } = request.body;

  if (!qrToken && !checkoutCode) {
    throw new Error("Either qrToken or checkoutCode is required");
  }

  let returnDoc;

  /* ── Parse QR token if provided ── */
  if (qrToken) {
    let payload;
    try {
      payload = verifyQrToken(qrToken);
    } catch {
      throw new Error("QR code is invalid or expired");
    }

    const { returnId } = payload;
    returnDoc = await Return.findById(returnId);
  } else if (checkoutCode) {
    /* ── Find by checkout code (offline fallback) ── */
    const order = await Order.findOne({ checkoutCode });
    if (!order) throw new Error("Order not found");

    /* ── For now, find any pending return in this order ── */
    returnDoc = await Return.findOne({
      orderId: order._id,
      status: { $in: ["PENDING", "VALIDATED"] },
    });
  }

  if (!returnDoc) throw new Error("Return record not found");

  if (returnDoc.status === "COMPLETED") {
    throw new Error("This return has already been completed");
  }

  if (returnDoc.status === "REJECTED") {
    throw new Error("This return was rejected");
  }

  if (returnDoc.status === "CANCELLED") {
    throw new Error("This return has been cancelled");
  }

  /* ── Load order & item for context ── */
  const order = await Order.findById(returnDoc.orderId).lean();
  if (!order) throw new Error("Order not found");

  const lineItem = order.items.find(
    (i) =>
      i.product?.toString() === returnDoc.originalItemId.toString() ||
      i._id?.toString() === returnDoc.originalItemId.toString(),
  );
  if (!lineItem) throw new Error("Item not found in order");

  /* ── Mark VALIDATED ── */
  returnDoc.status = "VALIDATED";
  returnDoc.cashierId = userId;
  returnDoc.validatedAt = new Date();
  await Return.findByIdAndUpdate(returnDoc._id, returnDoc);

  /* ── Emit to customer ── */
  const roomName = `return:${returnDoc._id}`;
  emitToRoom(roomName, "return:validated", {
    returnId: returnDoc._id,
    status: "VALIDATED",
    message: "Item received at counter. Proceeding to inspection.",
  });

  return {
    returnId: returnDoc._id,
    status: "VALIDATED",
    order: {
      _id: order._id,
      checkoutCode: order.checkoutCode,
      confirmedAt: order.confirmedAt,
    },
    item: {
      productName: lineItem.name,
      name: lineItem.name,
      productId: lineItem.product,
      quantity: lineItem.quantity,
      price: lineItem.unitPrice,
      originalPrice: lineItem.unitPrice,
      categoryId: lineItem.category?.id || null,
      barcode: lineItem.barcode || lineItem.sku || null,
      sku: lineItem.sku,
      reason: returnDoc.returnReason,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. INSPECT RETURN  (Cashier)
   POST /api/returns/:returnId/inspect
   Body: { inspectionStatus, inspectionNotes }
   ═══════════════════════════════════════════════════════════════════════════ */
async function inspectReturn(request) {
  const { userId } = request.user;
  const { returnId } = request.params;
  const { inspectionStatus, inspectionNotes } = request.body;

  if (!["PASSED", "REJECTED"].includes(inspectionStatus)) {
    throw new Error("inspectionStatus must be PASSED or REJECTED");
  }

  const returnDoc = await Return.findById(returnId);
  if (!returnDoc) throw new Error("Return not found");

  if (returnDoc.status !== "VALIDATED") {
    throw new Error(
      `Return must be VALIDATED before inspection. Current: ${returnDoc.status}`,
    );
  }

  /* ── Update inspection ── */
  returnDoc.inspectionStatus = inspectionStatus;
  returnDoc.inspectionNotes = inspectionNotes || "";
  returnDoc.inspectedAt = new Date();

  if (inspectionStatus === "REJECTED") {
    returnDoc.status = "REJECTED";
    await returnDoc.save();

    /* ── Emit rejection to customer ── */
    const roomName = `return:${returnDoc._id}`;
    emitToRoom(roomName, "return:inspection-failed", {
      returnId: returnDoc._id,
      status: "REJECTED",
      inspectionStatus: "REJECTED",
      reason: inspectionNotes || "Item does not meet return conditions",
    });

    return {
      returnId: returnDoc._id,
      status: "REJECTED",
      inspectionStatus: "REJECTED",
      message: "Return rejected",
    };
  }

  /* ── PASSED: move to ready for fulfillment ── */
  returnDoc.status = "INSPECTED";
  await returnDoc.save();

  /* ── Emit inspection passed to customer ── */
  const roomName = `return:${returnDoc._id}`;
  emitToRoom(roomName, "return:inspection-passed", {
    returnId: returnDoc._id,
    status: "INSPECTED",
    inspectionStatus: "PASSED",
    message: "Inspection passed! Choose your return option.",
  });

  return {
    returnId: returnDoc._id,
    status: "INSPECTED",
    inspectionStatus: "PASSED",
    message: "Item inspection passed",
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. COMPLETE RETURN - LOYALTY  (Cashier)
   POST /api/returns/:returnId/complete-loyalty
   Body: { loyaltyAmount }
   ═══════════════════════════════════════════════════════════════════════════ */
async function completeReturnLoyalty(request) {
  const { userId } = request.user;
  const { returnId } = request.params;
  const { loyaltyAmount } = request.body;

  if (!loyaltyAmount || loyaltyAmount <= 0) {
    throw new Error("loyaltyAmount must be greater than 0");
  }

  const returnDoc = await Return.findById(returnId);
  if (!returnDoc) throw new Error("Return not found");

  if (returnDoc.status !== "INSPECTED") {
    throw new Error(
      `Return must be INSPECTED before completion. Current: ${returnDoc.status}`,
    );
  }

  if (returnDoc.inspectionStatus !== "PASSED") {
    throw new Error("Inspection must be PASSED to fulfill return");
  }

  /* ── Atomic transaction ── */
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const now = new Date();

    /* ── 1. Add loyalty points to customer ── */
    await User.findByIdAndUpdate(
      returnDoc.customerId,
      {
        $inc: { loyaltyPoints: loyaltyAmount },
        $push: {
          loyaltyHistory: {
            event: "earn",
            points: loyaltyAmount,
            date: now,
          },
        },
      },
      { session },
    );

    /* ── 2. Update order item status ── */
    await Order.updateOne(
      {
        _id: returnDoc.orderId,
        "items.product": returnDoc.originalItemId,
      },
      {
        $set: {
          "items.$.status": "RETURNED",
          "items.$.returnInfo.returnId": returnDoc._id.toString(),
          "items.$.returnInfo.reason": returnDoc.returnReason,
          "items.$.returnInfo.inspectionStatus": "PASSED",
          "items.$.returnInfo.fulfillmentType": "LOYALTY",
          "items.$.returnInfo.completedAt": now,
        },
      },
      { session },
    );

    /* ── 3. Return item to inventory ── */
    await Product.updateOne(
      { _id: returnDoc.originalItemId },
      { $inc: { stockQuantity: 1 } },
      { session },
    );

    /* ── 4. Mark return as COMPLETED ── */
    returnDoc.status = "COMPLETED";
    returnDoc.fulfillmentType = "LOYALTY_CONVERSION";
    returnDoc.loyaltyPointsAwarded = loyaltyAmount;
    returnDoc.completedAt = now;
    await returnDoc.save({ session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  /* ── Blockchain logging (non-fatal) ── */
  try {
    const blockchainResult = await blockchainService.logReturnCompleted({
      returnId: returnDoc._id,
      orderId: returnDoc.orderId,
      originalItemId: returnDoc.originalItemId,
      fulfillmentType: "LOYALTY",
      loyaltyPoints: loyaltyAmount,
      completedAt: returnDoc.completedAt,
    });
    returnDoc.blockchainTxId = blockchainResult.txId;
    returnDoc.blockchainHash = blockchainResult.hash;
    await returnDoc.save();
  } catch (blockchainErr) {
    console.error("[Return] Blockchain logging failed:", blockchainErr.message);
  }

  /* ── Emit completion ── */
  const roomName = `return:${returnDoc._id}`;
  emitToRoom(roomName, "return:completed", {
    returnId: returnDoc._id,
    status: "COMPLETED",
    fulfillmentType: "LOYALTY_CONVERSION",
    loyaltyPointsAwarded: loyaltyAmount,
    message: `Return complete! ₱${loyaltyAmount.toFixed(2)} converted to loyalty points`,
  });

  return {
    returnId: returnDoc._id,
    status: "COMPLETED",
    fulfillmentType: "LOYALTY_CONVERSION",
    loyaltyPointsAwarded: loyaltyAmount,
    message: `₱${loyaltyAmount.toFixed(2)} awarded as loyalty points`,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. COMPLETE RETURN - ITEM SWAP  (Cashier)
   POST /api/returns/:returnId/complete-swap
   Body: { replacementBarcode }
   ═══════════════════════════════════════════════════════════════════════════ */
async function completeReturnSwap(request) {
  const { userId } = request.user;
  const { returnId } = request.params;
  const { replacementBarcode } = request.body;

  if (!replacementBarcode) throw new Error("replacementBarcode is required");

  const returnDoc = await Return.findById(returnId);
  if (!returnDoc) throw new Error("Return not found");

  if (returnDoc.status !== "INSPECTED") {
    throw new Error(
      `Return must be INSPECTED before completion. Current: ${returnDoc.status}`,
    );
  }

  if (returnDoc.inspectionStatus !== "PASSED") {
    throw new Error("Inspection must be PASSED to fulfill return");
  }

  /* ── Load replacement product ── */
  const replacement = await Product.findOne({
    barcode: replacementBarcode,
    deletedAt: null,
  });
  if (!replacement) throw new Error("Replacement product not found");

  /* ── Verify it's the same product ── */
  const originalProduct = await Product.findById(returnDoc.originalItemId);
  if (!originalProduct) throw new Error("Original product not found");

  if (replacement._id.toString() !== originalProduct._id.toString()) {
    throw new Error(
      "Replacement must be the same product. Scan the correct item.",
    );
  }

  /* ── Stock check ── */
  if (replacement.stockQuantity < 1) {
    throw new Error("Replacement item is out of stock");
  }

  /* ── Atomic transaction ── */
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const now = new Date();

    /* ── 1. Update order item status ── */
    await Order.updateOne(
      {
        _id: returnDoc.orderId,
        "items.product": returnDoc.originalItemId,
      },
      {
        $set: {
          "items.$.status": "RETURNED",
          "items.$.returnInfo.returnId": returnDoc._id.toString(),
          "items.$.returnInfo.reason": returnDoc.returnReason,
          "items.$.returnInfo.inspectionStatus": "PASSED",
          "items.$.returnInfo.fulfillmentType": "ITEM_SWAP",
          "items.$.returnInfo.completedAt": now,
        },
      },
      { session },
    );

    /* ── 2. Inventory: return original, keep same product as replacement ── */
    await Product.bulkWrite(
      [
        {
          updateOne: {
            filter: { _id: returnDoc.originalItemId },
            update: { $inc: { stockQuantity: 1 } }, // original returned to stock
          },
        },
        {
          updateOne: {
            filter: { _id: replacement._id },
            update: { $inc: { stockQuantity: -1 } }, // same product taken
          },
        },
      ],
      { session },
    );

    /* ── 3. Mark return as COMPLETED ── */
    returnDoc.status = "COMPLETED";
    returnDoc.fulfillmentType = "ITEM_SWAP";
    returnDoc.replacementItemId = replacement._id;
    returnDoc.replacementItemName = replacement.name;
    returnDoc.completedAt = now;
    await returnDoc.save({ session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  /* ── Blockchain logging (non-fatal) ── */
  try {
    const blockchainResult = await blockchainService.logReturnCompleted({
      returnId: returnDoc._id,
      orderId: returnDoc.orderId,
      originalItemId: returnDoc.originalItemId,
      replacementItemId: replacement._id,
      fulfillmentType: "ITEM_SWAP",
      completedAt: returnDoc.completedAt,
    });
    returnDoc.blockchainTxId = blockchainResult.txId;
    returnDoc.blockchainHash = blockchainResult.hash;
    await returnDoc.save();
  } catch (blockchainErr) {
    console.error("[Return] Blockchain logging failed:", blockchainErr.message);
  }

  /* ── Emit completion ── */
  const roomName = `return:${returnDoc._id}`;
  emitToRoom(roomName, "return:completed", {
    returnId: returnDoc._id,
    status: "COMPLETED",
    fulfillmentType: "ITEM_SWAP",
    replacementItemName: replacement.name,
    message: "Item swapped successfully! Collect your new item and receipt.",
  });

  return {
    returnId: returnDoc._id,
    status: "COMPLETED",
    fulfillmentType: "ITEM_SWAP",
    replacementItemName: replacement.name,
    message: "Item swapped successfully",
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. REJECT RETURN  (Cashier)
   POST /api/returns/:returnId/reject
   Body: { reason }
   ═══════════════════════════════════════════════════════════════════════════ */
async function rejectReturn(request) {
  const { userId } = request.user;
  const { returnId } = request.params;
  const { reason } = request.body;

  const returnDoc = await Return.findById(returnId);
  if (!returnDoc) throw new Error("Return not found");

  if (!["VALIDATED", "INSPECTED"].includes(returnDoc.status)) {
    throw new Error(
      `Cannot reject return in ${returnDoc.status} status. Must be VALIDATED or INSPECTED.`,
    );
  }

  returnDoc.status = "REJECTED";
  returnDoc.inspectionStatus = "REJECTED";
  returnDoc.inspectionNotes = reason || "Return rejected by cashier";
  returnDoc.inspectedAt = new Date();
  await returnDoc.save();

  /* ── Emit rejection ── */
  const roomName = `return:${returnDoc._id}`;
  emitToRoom(roomName, "return:rejected", {
    returnId: returnDoc._id,
    status: "REJECTED",
    reason: reason || "Return rejected",
  });

  return {
    returnId: returnDoc._id,
    status: "REJECTED",
    message: "Return rejected",
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. CANCEL RETURN  (Customer or Cashier)
   PATCH /api/returns/:returnId/cancel
   ═══════════════════════════════════════════════════════════════════════════ */
async function cancelReturn(request) {
  const { userId } = request.user;
  const { returnId } = request.params;

  const returnDoc = await Return.findById(returnId);
  if (!returnDoc) throw new Error("Return not found");

  if (returnDoc.status === "COMPLETED") {
    throw new Error("Cannot cancel a completed return");
  }

  if (returnDoc.status === "CANCELLED") {
    throw new Error("Return already cancelled");
  }

  returnDoc.status = "CANCELLED";
  returnDoc.cancelledAt = new Date();
  await returnDoc.save();

  const roomName = `return:${returnDoc._id}`;
  emitToRoom(roomName, "return:cancelled", {
    returnId: returnDoc._id,
    status: "CANCELLED",
  });

  return { returnId: returnDoc._id, status: "CANCELLED" };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. GET RETURN STATUS  (Customer or Cashier)
   GET /api/returns/:returnId
   ═══════════════════════════════════════════════════════════════════════════ */
async function getReturnStatus(request) {
  const { returnId } = request.params;

  const returnDoc = await Return.findById(returnId).populate(
    "orderId customerId originalItemId",
  );
  if (!returnDoc) throw new Error("Return not found");

  return returnDoc;
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. LIST CUSTOMER RETURNS  (Customer)
   GET /api/returns
   ═══════════════════════════════════════════════════════════════════════════ */
async function getCustomerReturns(request) {
  const { userId } = request.user;

  const returns = await Return.find({ customerId: userId })
    .populate("orderId originalItemId")
    .sort({ initiatedAt: -1 });

  return returns;
}

module.exports = {
  initiateReturn,
  validateReturnQR,
  inspectReturn,
  completeReturnLoyalty,
  completeReturnSwap,
  rejectReturn,
  cancelReturn,
  getReturnStatus,
  getCustomerReturns,
};
