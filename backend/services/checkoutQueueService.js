const Queue = require("../models/checkoutQueueModel");
const checkoutEmitter = require("../helper/socketEmitter");
const crypto = require("crypto");

exports.checkout = async (request) => {
  if (!request.body) throw new Error("empty request content");
  const { userId } = request.user;
  const data = { ...request.body };
  const checkoutCode = `CHK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const expiresAt = Date.now() + 10 * 60 * 1000;
  data.user = userId;
  data.checkoutCode = checkoutCode;
  data.expiresAt = expiresAt;

  const isQueue = await Queue.findOneAndUpdate(
    {
      user: userId,
      status: { $eq: "PENDING" },
      expiresAt: { $gte: new Date() },
    },
    {
      ...data,
    },
    { new: true, upsert: true },
  );

  return {
    checkoutCode,
    expiresAt,
  };
};

exports.getOrder = async (request) => {
  const { checkoutCode } = request.params;
  const { userId, name } = request.user;
  const order = Queue.findOneAndUpdate(
    { checkoutCode: checkoutCode },
    {
      cashier: { cashierId: userId, name },
      status: "SCANNED",
      scannedAt: Date.now(),
    },
    { new: true },
  ).populate({
    path: "items.product",
    select: "barcode barcodeType",
  });

  if (!order) throw new Error("order not found");

  checkoutEmitter.emitCheckout(checkoutCode, "checkout:scanned", {
    status: order.status,
    totals: order.totals,
    cashier: name,
  });

  return order;
};

exports.lockedOrder = async (request) => {
  const { userId } = request.user;
  if (!request.body) throw new Error("empty request content");
  const { checkoutCode } = request.body;
  const order = await Queue.findOneAndUpdate(
    { checkoutCode, cashier: userId },
    {
      status: "LOCKED",
    },
    { new: true, runValidators: true },
  ).populate({
    path: "items.product",
    select: "checkoutCode",
  });

  if (!order) throw new Error("failed to update checkout status");

  checkoutEmitter.emitCheckout(checkoutCode, "checkout:LOCKED", {
    status: order.status,
    totals: order.totals,
    cashier: order.name,
  });
  return result;
};

exports.payOrder = async (request) => {
  if (!request.body) throw new Error("undefined content request");
  const { checkoutCode } = request.params;
  const { userId } = request.user;

  const queue = await Queue.findOneAndUpdate(
    {
      checkoutCode,
      cashier: userId,
      status: "LOCKED",
    },
    {
      status: "PAID",
      paidAt: Date.now(),
    },
  ).populate({
    path: "items.product",
    select: "checkoutCode",
  });

  if (!queue) throw new Error("failed to update checkout status");

  checkoutEmitter.emitCheckout(checkoutCode, "checkout:PAID", {
    status: queue.status,
    totals: queue.totals,
    cashier: queue.name,
  });
  return result;
};
