const Supplier = require("../models/supplierModel");
const Expense = require("../models/expenseModel");

// ═══════════════════════════════════════════════
//  CREATE SUPPLIER
// ═══════════════════════════════════════════════
exports.createSupplier = async (supplierData) => {
  return await Supplier.create(supplierData);
};

// ═══════════════════════════════════════════════
//  GET ALL SUPPLIERS
// ═══════════════════════════════════════════════
exports.getAllSuppliers = async (filters = {}) => {
  const { status, businessType, page = 1, limit = 50 } = filters;

  const query = {};
  if (status) query.status = status;
  if (businessType) query.businessType = businessType;

  const skip = (page - 1) * limit;

  const [suppliers, total] = await Promise.all([
    Supplier.find(query)
      .populate("addedBy", "name email")
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Supplier.countDocuments(query),
  ]);

  return {
    suppliers,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit),
    },
  };
};

// ═══════════════════════════════════════════════
//  GET SUPPLIER BY ID
// ═══════════════════════════════════════════════
exports.getSupplierById = async (id) => {
  const supplier = await Supplier.findById(id).populate(
    "addedBy",
    "name email role",
  );

  // Get expenses for this supplier
  const expenses = await Expense.find({ supplier: id })
    .sort({ expenseDate: -1 })
    .limit(10);

  // Calculate total spent
  const totalSpent = await Expense.aggregate([
    {
      $match: {
        supplier: mongoose.Types.ObjectId(id),
        status: { $ne: "CANCELLED" },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return {
    supplier,
    recentExpenses: expenses,
    totalSpent: totalSpent[0]?.total || 0,
  };
};

// ═══════════════════════════════════════════════
//  UPDATE SUPPLIER
// ═══════════════════════════════════════════════
exports.updateSupplier = async (id, updateData) => {
  return await Supplier.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("addedBy", "name email");
};

// ═══════════════════════════════════════════════
//  DELETE SUPPLIER
// ═══════════════════════════════════════════════
exports.deleteSupplier = async (id) => {
  // Check if supplier has expenses
  const expenseCount = await Expense.countDocuments({ supplier: id });
  if (expenseCount > 0) {
    throw new Error(
      `Cannot delete supplier with ${expenseCount} associated expenses`,
    );
  }
  return await Supplier.findByIdAndDelete(id);
};

// ═══════════════════════════════════════════════
//  GET SUPPLIER ANALYTICS
// ═══════════════════════════════════════════════
exports.getSupplierAnalytics = async () => {
  const total = await Supplier.countDocuments();
  const active = await Supplier.countDocuments({ status: "ACTIVE" });
  const byType = await Supplier.aggregate([
    {
      $group: {
        _id: "$businessType",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Average rating
  const ratingStats = await Supplier.aggregate([
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  return {
    total,
    active,
    byType,
    averageRating: ratingStats[0]?.avgRating || 0,
  };
};
