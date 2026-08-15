const Expense = require("../models/expenseModel");
const Supplier = require("../models/supplierModel");

// ═══════════════════════════════════════════════
//  CREATE EXPENSE
// ═══════════════════════════════════════════════
exports.createExpense = async (expenseData) => {
  const expense = await Expense.create(expenseData);
  return await Expense.findById(expense._id)
    .populate("recordedBy", "name email")
    .populate("supplier", "name contactPerson");
};

// ═══════════════════════════════════════════════
//  GET ALL EXPENSES
// ═══════════════════════════════════════════════
exports.getAllExpenses = async (filters = {}) => {
  const {
    category,
    status,
    startDate,
    endDate,
    supplier,
    page = 1,
    limit = 50,
  } = filters;

  const query = {};

  if (category) query.category = category;
  if (status) query.status = status;
  if (supplier) query.supplier = supplier;

  if (startDate || endDate) {
    query.expenseDate = {};
    if (startDate) query.expenseDate.$gte = new Date(startDate);
    if (endDate) query.expenseDate.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [expenses, total] = await Promise.all([
    Expense.find(query)
      .populate("recordedBy", "name email")
      .populate("supplier", "name contactPerson")
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Expense.countDocuments(query),
  ]);

  return {
    expenses,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit),
    },
  };
};

// ═══════════════════════════════════════════════
//  GET EXPENSE BY ID
// ═══════════════════════════════════════════════
exports.getExpenseById = async (id) => {
  return await Expense.findById(id)
    .populate("recordedBy", "name email role")
    .populate("supplier", "name contactPerson email phone");
};

// ═══════════════════════════════════════════════
//  UPDATE EXPENSE
// ═══════════════════════════════════════════════
exports.updateExpense = async (id, updateData) => {
  return await Expense.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("recordedBy", "name email")
    .populate("supplier", "name contactPerson");
};

// ═══════════════════════════════════════════════
//  DELETE EXPENSE
// ═══════════════════════════════════════════════
exports.deleteExpense = async (id) => {
  return await Expense.findByIdAndDelete(id);
};

// ═══════════════════════════════════════════════
//  GET EXPENSE ANALYTICS
// ═══════════════════════════════════════════════
exports.getExpenseAnalytics = async (timeRange = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);

  // Total expenses by category
  const byCategory = await Expense.aggregate([
    {
      $match: {
        expenseDate: { $gte: startDate },
        status: { $ne: "CANCELLED" },
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  // Total expenses by month
  const byMonth = await Expense.aggregate([
    {
      $match: {
        expenseDate: { $gte: startDate },
        status: { $ne: "CANCELLED" },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$expenseDate" },
          month: { $month: "$expenseDate" },
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Top suppliers by expense
  const topSuppliers = await Expense.aggregate([
    {
      $match: {
        expenseDate: { $gte: startDate },
        status: { $ne: "CANCELLED" },
        supplier: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$supplier",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
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
        total: 1,
        count: 1,
      },
    },
  ]);

  // Overall totals
  const totals = await Expense.aggregate([
    {
      $match: {
        expenseDate: { $gte: startDate },
        status: { $ne: "CANCELLED" },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        totalCount: { $sum: 1 },
      },
    },
  ]);

  // Pending vs Paid
  const byStatus = await Expense.aggregate([
    {
      $match: { expenseDate: { $gte: startDate } },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    byCategory,
    byMonth,
    topSuppliers,
    totals: totals[0] || { totalAmount: 0, totalCount: 0 },
    byStatus,
    timeRange,
  };
};
