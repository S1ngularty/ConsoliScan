const Queue = require("../models/checkoutQueueModel");
const checkoutEmitter = require("../helper/socketEmitter");
const crypto = require("crypto");
const validationService = require("./validationService");

exports.checkout = async (request) => {
  if (!request.body) throw new Error("empty request content");
  const { userId } = request.body;
  const data = { ...request.body };
  const checkoutCode = `CHK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  data.userType = !userId ? "user" : "guest";
  data.checkoutCode = checkoutCode;

  const isQueue = await Queue.findOneAndUpdate(
    {
      user: userId,
      status: { $eq: "PENDING" },
    },
    {
      ...data,
    },
    { new: true, upsert: true },
  );

  return {
    checkoutCode,
  };
};

exports.getOrder = async (request) => {
  const { checkoutCode } = request.params;
  const { userId, name } = request.user;
  const order = await Queue.findOneAndUpdate(
    { checkoutCode: checkoutCode },
    {
      cashier: { cashierId: userId, name },
      status: "SCANNED",
      scannedAt: Date.now(),
    },
    { new: true },
  ).populate({
    path: "items.product",
    select: "barcode barcodeType category",
  });

  if (!order) throw new Error("order not found");

  // Assess cart for validation method
  const cartItems = order.items.map((item) => ({
    name: item.name,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    isBNPCEligible: item.isBNPCEligible || false,
    saleActive: item.saleActive || false,
  }));

  const validationAssessment =
    validationService.assessCartSensitivity(cartItems);

  checkoutEmitter.emitCheckout(checkoutCode, "checkout:scanned", {
    status: order.status,
    totals: order.totals,
    cashier: name,
  });

  // Return order with validation assessment
  return {
    ...order.toObject(),
    validation: validationAssessment,
  };
};

exports.lockedOrder = async (request) => {
  const { userId } = request.user;
  if (!request.body) throw new Error("empty request content");
  const { checkoutCode } = request.params;
  const order = await Queue.findOneAndUpdate(
    { checkoutCode, "cashier.cashierId": userId, status: "SCANNED" },
    {
      status: "LOCKED",
    },
    { new: true, runValidators: true },
  ).populate({
    path: "items.product",
    select: "checkoutCode",
  });

  if (!order) throw new Error("failed to update checkout status");

  checkoutEmitter.emitCheckout(checkoutCode, "checkout:locked", {
    status: order.status,
    totals: order.totals,
    cashier: order.name,
  });
  return order;
};

exports.payOrder = async (request) => {
  if (!request.body) throw new Error("undefined content request");
  const { checkoutCode } = request.params;
  const { userId } = request.user;

  const queue = await Queue.findOneAndUpdate(
    {
      checkoutCode: checkoutCode,
      "cashier.cashierId": userId,
      status: "LOCKED",
    },
    {
      status: "PAID",
      paidAt: Date.now(),
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate({
    path: "items.product",
    select: "checkoutCode",
  });
  if (!queue) throw new Error("failed to update checkout status");

  checkoutEmitter.emitCheckout(checkoutCode, "checkout:paid", {
    status: queue.status,
  });
  return queue;
};
