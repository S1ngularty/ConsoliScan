const PurchaseOrder = require("../models/purchaseOrderModel");
const Product = require("../models/productModel");
const StockMovement = require("../models/stockMovementModel");

// ═══════════════════════════════════════════════
//  GENERATE PO NUMBER
// ═══════════════════════════════════════════════
const generatePONumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const lastPO = await PurchaseOrder.findOne({
    orderNumber: new RegExp(`^PO${year}${month}`),
  }).sort({ orderNumber: -1 });

  let sequence = 1;
  if (lastPO) {
    const lastSequence = parseInt(lastPO.orderNumber.slice(-4));
    sequence = lastSequence + 1;
  }

  return `PO${year}${month}${String(sequence).padStart(4, "0")}`;
};

// ═══════════════════════════════════════════════
//  CREATE PURCHASE ORDER
// ═══════════════════════════════════════════════
exports.createPurchaseOrder = async (poData) => {
  const orderNumber = await generatePONumber();

  const po = await PurchaseOrder.create({
    ...poData,
    orderNumber,
  });

  return await PurchaseOrder.findById(po._id)
    .populate("supplier", "name contactPerson email")
    .populate("items.product", "name sku")
    .populate("createdBy", "name email");
};

// ═══════════════════════════════════════════════
//  GET ALL PURCHASE ORDERS
// ═══════════════════════════════════════════════
exports.getAllPurchaseOrders = async (filters = {}) => {
  const {
    status,
    supplier,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = filters;

  const query = {};

  if (status) query.status = status;
  if (supplier) query.supplier = supplier;

  if (startDate || endDate) {
    query.orderDate = {};
    if (startDate) query.orderDate.$gte = new Date(startDate);
    if (endDate) query.orderDate.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    PurchaseOrder.find(query)
      .populate("supplier", "name contactPerson")
      .populate("items.product", "name sku")
      .populate("createdBy", "name")
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    PurchaseOrder.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit),
    },
  };
};

// ═══════════════════════════════════════════════
//  GET PURCHASE ORDER BY ID
// ═══════════════════════════════════════════════
exports.getPurchaseOrderById = async (id) => {
  return await PurchaseOrder.findById(id)
    .populate("supplier", "name contactPerson email phone address")
    .populate("items.product", "name sku barcode")
    .populate("createdBy", "name email role");
};

// ═══════════════════════════════════════════════
//  UPDATE PURCHASE ORDER
// ═══════════════════════════════════════════════
exports.updatePurchaseOrder = async (id, updateData) => {
  return await PurchaseOrder.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("supplier", "name contactPerson")
    .populate("items.product", "name sku")
    .populate("createdBy", "name");
};

// ═══════════════════════════════════════════════
//  RECEIVE PURCHASE ORDER (UPDATE STOCK)
// ═══════════════════════════════════════════════
exports.receivePurchaseOrder = async (id, receivedItems, userId) => {
  const po = await PurchaseOrder.findById(id).populate("items.product");

  if (!po) throw new Error("Purchase order not found");
  if (po.status === "CANCELLED")
    throw new Error("Cannot receive cancelled order");

  const movements = [];

  for (const item of receivedItems) {
    const poItem = po.items.find(
      (i) => i.product._id.toString() === item.productId,
    );
    if (!poItem) continue;

    // Update received quantity
    poItem.receivedQuantity += item.quantity;

    // Update product stock
    const product = await Product.findById(item.productId);
    if (product) {
      const quantityBefore = product.stock;
      product.stock += item.quantity;
      await product.save();

      // Record stock movement
      const movement = await StockMovement.create({
        product: item.productId,
        type: "PURCHASE",
        quantityBefore,
        quantityChange: item.quantity,
        quantityAfter: product.stock,
        performedBy: userId,
        referenceType: "PURCHASE",
        referenceId: po._id,
        reason: `Received from PO ${po.orderNumber}`,
      });

      movements.push(movement);
    }
  }

  // Update PO status
  const allReceived = po.items.every(
    (item) => item.receivedQuantity >= item.quantity,
  );
  const someReceived = po.items.some((item) => item.receivedQuantity > 0);

  if (allReceived) {
    po.status = "RECEIVED";
    po.actualDeliveryDate = new Date();
  } else if (someReceived) {
    po.status = "PARTIAL";
  }

  await po.save();

  return { po, movements };
};

// ═══════════════════════════════════════════════
//  DELETE PURCHASE ORDER
// ═══════════════════════════════════════════════
exports.deletePurchaseOrder = async (id) => {
  const po = await PurchaseOrder.findById(id);
  if (!po) throw new Error("Purchase order not found");

  if (po.status === "RECEIVED" || po.status === "PARTIAL") {
    throw new Error("Cannot delete purchase order with received items");
  }

  return await PurchaseOrder.findByIdAndDelete(id);
};

// ═══════════════════════════════════════════════
//  GET PURCHASE ORDER ANALYTICS
// ═══════════════════════════════════════════════
exports.getPurchaseOrderAnalytics = async (timeRange = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);

  const byStatus = await PurchaseOrder.aggregate([
    { $match: { orderDate: { $gte: startDate } } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalValue: { $sum: "$total" },
      },
    },
  ]);

  const bySupplier = await PurchaseOrder.aggregate([
    { $match: { orderDate: { $gte: startDate } } },
    {
      $group: {
        _id: "$supplier",
        count: { $sum: 1 },
        totalValue: { $sum: "$total" },
      },
    },
    { $sort: { totalValue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "suppliers",
        localField: "_id",
        foreignField: "_id",
        as: "supplierInfo",
      },
    },
    { $unwind: "$supplierInfo" },
    {
      $project: {
        supplierId: "$_id",
        supplierName: "$supplierInfo.name",
        count: 1,
        totalValue: 1,
      },
    },
  ]);

  const totals = await PurchaseOrder.aggregate([
    { $match: { orderDate: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalValue: { $sum: "$total" },
        totalPaid: { $sum: "$amountPaid" },
      },
    },
  ]);

  return {
    byStatus,
    bySupplier,
    totals: totals[0] || { totalOrders: 0, totalValue: 0, totalPaid: 0 },
    timeRange,
  };
};
