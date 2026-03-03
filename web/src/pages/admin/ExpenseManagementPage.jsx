import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  PieChart as PieChartIcon,
  TrendingUp,
  Calendar,
  FileText,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseAnalytics,
} from "../../services/expenseService";
import Toast from "../../components/common/SnackbarComponent";
import "../../styles/admin/ExpenseManagementPageStyle.css";

const ExpenseManagementPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    category: "utilities",
    amount: "",
    description: "",
    status: "pending",
    paymentMethod: "cash",
    supplier: "",
    invoiceNumber: "",
  });

  const categories = [
    "utilities",
    "rent",
    "salaries",
    "supplies",
    "marketing",
    "maintenance",
    "taxes",
    "other",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesData, analyticsData] = await Promise.all([
        getAllExpenses(),
        getExpenseAnalytics(),
      ]);
      console.log("Expenses Data Result:", expensesData);
      console.log("Analytics Data Result:", analyticsData);
      setExpenses(expensesData.expenses || expensesData.data || []);
      setAnalytics(analyticsData.data || analyticsData || {});
    } catch (error) {
      showToast("Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await updateExpense(editingExpense._id, formData);
        showToast("Expense updated successfully");
      } else {
        await createExpense(formData);
        showToast("Expense created successfully");
      }
      fetchData();
      resetForm();
    } catch (error) {
      showToast(error.response?.data?.message || "Operation failed", "error");
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      status: expense.status,
      paymentMethod: expense.paymentMethod,
      supplier: expense.supplier?._id || "",
      invoiceNumber: expense.invoiceNumber || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;
    try {
      await deleteExpense(id);
      showToast("Expense deleted successfully");
      fetchData();
    } catch (error) {
      showToast("Failed to delete expense", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      category: "utilities",
      amount: "",
      description: "",
      status: "pending",
      paymentMethod: "cash",
      supplier: "",
      invoiceNumber: "",
    });
    setEditingExpense(null);
    setShowModal(false);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || expense.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" || expense.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="expense-management-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading expenses...</p>
        </div>
      </div>
    );
  }

  const COLORS = ["#5c6f2b", "#7a8f3a", "#98ad49", "#b6cb58", "#d4e967"];

  const categoryData = (analytics.byCategory || []).map((item) => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.totalAmount,
  }));

  const monthData = (analytics.byMonth || []).map((item) => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
    amount: item.totalAmount,
  }));

  return (
    <div className="expense-management-page">
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />

      <div className="page-header">
        <div className="header-content">
          <DollarSign className="header-icon" size={32} />
          <div>
            <h1>Expense Management</h1>
            <p>Track and manage business expenses</p>
          </div>
        </div>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Analytics Section */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="card-header">
            <PieChartIcon size={20} />
            <h3>Expenses by Category</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    `₱${value.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <TrendingUp size={20} />
            <h3>Monthly Trend</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  formatter={(value) =>
                    `₱${value.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}`
                  }
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#5c6f2b"
                  strokeWidth={2}
                  dot={{ fill: "#5c6f2b", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Expenses Table */}
      <div className="expenses-table-container">
        <table className="expenses-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense) => (
              <tr key={expense._id}>
                <td>
                  {new Date(expense.createdAt).toLocaleDateString("en-PH")}
                </td>
                <td>
                  <span className="category-badge">{expense.category}</span>
                </td>
                <td>
                  <div className="description-cell">
                    <div>{expense.description}</div>
                    {expense.invoiceNumber && (
                      <div className="invoice-num">
                        Invoice: {expense.invoiceNumber}
                      </div>
                    )}
                  </div>
                </td>
                <td className="amount">
                  ₱
                  {expense.amount.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td>
                  <span className={`status-badge ${expense.status}`}>
                    {expense.status}
                  </span>
                </td>
                <td>{expense.paymentMethod}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(expense)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(expense._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingExpense ? "Edit Expense" : "Add New Expense"}</h2>
              <button className="close-btn" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingExpense ? "Update" : "Create"} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagementPage;
