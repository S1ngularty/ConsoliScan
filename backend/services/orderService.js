const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const blockchainService = require("./blockchainService");
const CheckoutQueue = require("../models/checkoutQueueModel");
const { emitCheckout } = require("../helper/socketEmitter");
const {
  logBNPC_discountUsage,
  managePoints,
  promoUpdateUsage,
} = require("../helper/discountValidator");
const PDFDocument = require("pdfkit");

async function confirmOrder(request) {
  if (!request.body) throw new Error("empty content request");
  const { orderId } = request.params;
  const { userId } = request.user;

  // Validate required fields
  if (!request.body.transaction) {
    throw new Error("Transaction data required");
  }

  let orderData = { ...request.body.transaction, cashier: userId };

  if (!orderData.checkoutCode) {
    throw new Error("checkoutCode is required for idempotency");
  }

  const existingOrder = await Order.findOne({
    checkoutCode: orderData.checkoutCode,
  });
  if (existingOrder) {
    return existingOrder;
  }

  // Validate booklet update for eligible customers
  if (
    ["senior", "pwd"].includes(orderData.customerType) &&
    !orderData.bookletUpdated
  ) {
    throw new Error("Booklet must be updated for BNPC discounts");
  }

  // Process BNPC discount
  orderData = await logBNPC_discountUsage(orderData);

  // Manage points
  orderData.pointsEarned = await managePoints(orderData);

  await promoUpdateUsage(orderData);

  // Create order
  let order;
  try {
    order = await Order.create(orderData);
  } catch (error) {
    if (
      error?.code === 11000 &&
      (error?.keyPattern?.checkoutCode || error?.keyValue?.checkoutCode)
    ) {
      return Order.findOne({ checkoutCode: orderData.checkoutCode });
    }
    throw error;
  }

  // Blockchain logging
  const blockchainResult = await blockchainService.logConfirmedOrder(order);
  order.blockchainTxId = blockchainResult.txId;
  order.blockchainHash = blockchainResult.hash;
  await order.save();

  // Cleanup
  await CheckoutQueue.findByIdAndDelete(orderId);

  // Update stock
  if (order.items.length > 0) {
    const bulkOps = order.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stockQuantity: -item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps);
  }

  // Emit socket event
  emitCheckout(order.checkoutCode, "checkout:complete", {
    orderId: order._id,
    orderData: order,
    status: "COMPLETE",
  });

  return order;
}

async function getOrders(request) {
  const { userId } = request.user;
  const orders = await Order.find({ user: userId, status: "CONFIRMED" })
    .select(
      "loyaltyDiscount.pointsEarned finalAmountPaid baseAmount checkoutCode items status confirmedAt discountBreakdown",
    )
    .sort({ createdAt: -1 })
    .lean();

  const orderList = orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      product: item.product,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      itemTotal: item.itemTotal,
      status: item.status,
    })),
    pointsEarned: order.loyaltyDiscount.pointsEarned.toFixed(2),
    baseAmount: order.baseAmount,
  }));

  return orderList;
}

/**
 * Get all orders for admin with filtering, sorting, and population
 */
async function getAllOrdersAdmin(request) {
  const {
    status,
    customerType,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 50,
    sortBy = "confirmedAt",
    sortOrder = "desc",
  } = request.query;

  // Build filter
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (customerType) {
    filter.customerType = customerType;
  }

  if (startDate || endDate) {
    filter.confirmedAt = {};
    if (startDate) filter.confirmedAt.$gte = new Date(startDate);
    if (endDate) filter.confirmedAt.$lte = new Date(endDate);
  }

  if (search) {
    filter.$or = [{ checkoutCode: { $regex: search, $options: "i" } }];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  // Execute query
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email phone")
      .populate("cashier", "name email")
      .select("-serverCalculations -bnpcCaps")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

/**
 * Generate PDF report of orders with statistics
 */
async function generateOrdersReport(request) {
  const { status, customerType, startDate, endDate, search } = request.query;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (customerType) filter.customerType = customerType;
  if (startDate || endDate) {
    filter.confirmedAt = {};
    if (startDate) filter.confirmedAt.$gte = new Date(startDate);
    if (endDate) filter.confirmedAt.$lte = new Date(endDate);
  }
  if (search) {
    filter.$or = [{ checkoutCode: { $regex: search, $options: "i" } }];
  }

  // Fetch all filtered orders
  const orders = await Order.find(filter)
    .populate("user", "name email phone")
    .populate("cashier", "name email")
    .sort({ confirmedAt: -1 })
    .lean();

  // Calculate statistics
  const stats = {
    totalOrders: orders.length,
    totalRevenue: 0,
    totalDiscount: 0,
    byStatus: {},
    byCustomerType: {},
    byPaymentMethod: {},
  };

  orders.forEach((order) => {
    // Ensure numeric conversion
    const finalAmount = parseFloat(order.finalAmountPaid) || 0;
    const discountTotal = parseFloat(order.discountBreakdown?.total) || 0;

    stats.totalRevenue += finalAmount;
    stats.totalDiscount += discountTotal;

    // Count by status
    const st = order.status || "UNKNOWN";
    stats.byStatus[st] = (stats.byStatus[st] || 0) + 1;

    // Count by customer type
    const ct = order.customerType || "regular";
    stats.byCustomerType[ct] = (stats.byCustomerType[ct] || 0) + 1;
  });

  return { orders, stats, filter };
}

module.exports = {
  confirmOrder,
  getOrders,
  getAllOrdersAdmin,
  generateOrdersReport,
};
