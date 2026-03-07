import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Search,
  Star,
  Phone,
  Mail,
  MapPin,
  X,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierAnalytics,
} from "../../services/supplierService";
import Toast from "../../components/common/SnackbarComponent";
import "../../styles/admin/SupplierManagementPageStyle.css";

const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    businessType: "manufacturer",
    rating: 5,
    creditLimit: "",
    paymentTerms: "net_30",
    taxId: "",
    notes: "",
  });

  const businessTypes = [
    "manufacturer",
    "wholesaler",
    "distributor",
    "importer",
    "service_provider",
    "other",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliersData, analyticsData] = await Promise.all([
        getAllSuppliers(),
        getSupplierAnalytics(),
      ]);
      console.log("Suppliers Data Result:", suppliersData);
      console.log("Analytics Data Result:", analyticsData);
      setSuppliers(suppliersData.suppliers || suppliersData.data || []);
      setAnalytics(analyticsData);
    } catch (error) {
      showToast("Failed to load suppliers", "error");
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
      if (editingSupplier) {
        await updateSupplier(editingSupplier._id, formData);
        showToast("Supplier updated successfully");
      } else {
        await createSupplier(formData);
        showToast("Supplier created successfully");
      }
      fetchData();
      resetForm();
    } catch (error) {
      showToast(error.response?.data?.message || "Operation failed", "error");
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      businessType: supplier.businessType,
      rating: supplier.rating,
      creditLimit: supplier.creditLimit || "",
      paymentTerms: supplier.paymentTerms,
      taxId: supplier.taxId || "",
      notes: supplier.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?"))
      return;
    try {
      await deleteSupplier(id);
      showToast("Supplier deleted successfully");
      fetchData();
    } catch (error) {
      showToast("Failed to delete supplier", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      businessType: "manufacturer",
      rating: 5,
      creditLimit: "",
      paymentTerms: "net_30",
      taxId: "",
      notes: "",
    });
    setEditingSupplier(null);
    setShowModal(false);
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading || !analytics) {
    return (
      <div className="supplier-management-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading suppliers...</p>
        </div>
      </div>
    );
  }

  const spendingData = (analytics.topSuppliers || []).map((supplier) => ({
    name: supplier.name,
    amount: supplier.totalSpent,
  }));

  return (
    <div className="supplier-management-page">
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />

      <div className="page-header">
        <div className="header-content">
          <Truck className="header-icon" size={32} />
          <div>
            <h1>Supplier Management</h1>
            <p>Manage supplier relationships and track spending</p>
          </div>
        </div>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card blue">
          <div className="card-icon">
            <Truck size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Total Suppliers</p>
            <h3 className="card-value">{suppliers.length}</h3>
          </div>
        </div>

        <div className="summary-card green">
          <div className="card-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Total Spending</p>
            <h3 className="card-value">
              ₱
              {(analytics.topSuppliers || [])
                .reduce((sum, s) => sum + s.totalSpent, 0)
                .toLocaleString("en-PH", {
                  maximumFractionDigits: 0,
                })}
            </h3>
          </div>
        </div>

        <div className="summary-card purple">
          <div className="card-icon">
            <Star size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Avg Rating</p>
            <h3 className="card-value">
              {analytics.averageRating
                ? analytics.averageRating.toFixed(1)
                : "0.0"}
            </h3>
          </div>
        </div>
      </div>

      {/* Top Suppliers Chart
      <div className="analytics-card">
        <div className="card-header">
          <TrendingUp size={20} />
          <h3>Top Suppliers by Spending</h3>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                formatter={(value) =>
                  `₱${value.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}`
                }
              />
              <Bar
                dataKey="amount"
                fill="#5c6f2b"
                radius={[8, 8, 0, 0]}
                name="Total Spent"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div> */}

      {/* Search */}
      <div className="search-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

        {/* Suppliers Grid */}
        <div className="suppliers-grid">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier._id} className="supplier-card">
              <div className="supplier-header">
                <div className="supplier-avatar">
                  {supplier.name?.charAt(0).toUpperCase()}
                </div>
                <div className="supplier-info">
                  <h3>{supplier.name}</h3>
                  <p className="business-type">
                    {supplier.businessType.replace("_", " ")}
                  </p>
                </div>
                <div className="rating">
                  <Star size={16} fill="#fbbf24" color="#fbbf24" />
                  <span>{supplier.rating}</span>
                </div>
              </div>

              <div className="supplier-details">
                {supplier.contactPerson && (
                  <div className="detail-item">
                    <Phone size={16} />
                    <span>{supplier.contactPerson}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="detail-item">
                    <Mail size={16} />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="detail-item">
                    <Phone size={16} />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="detail-item">
                    <MapPin size={16} />
                    <span>{supplier.address}</span>
                  </div>
                )}
              </div>

              <div className="supplier-meta">
                <div className="meta-item">
                  <span className="label">Payment Terms</span>
                  <span className="value">
                    {supplier.paymentTerms.replace("_", " ")}
                  </span>
                </div>
                {supplier.creditLimit > 0 && (
                  <div className="meta-item">
                    <span className="label">Credit Limit</span>
                    <span className="value">
                      ₱{supplier.creditLimit.toLocaleString("en-PH")}
                    </span>
                  </div>
                )}
              </div>

              <div className="supplier-actions">
                <button className="edit-btn" onClick={() => handleEdit(supplier)}>
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(supplier._id)}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</h2>
              <button className="close-btn" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Business Type *</label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    required
                  >
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ").charAt(0).toUpperCase() +
                          type.replace("_", " ").slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Rating *</label>
                  <select
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    required
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} Star{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Terms *</label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="cod">COD</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_60">Net 60</option>
                    <option value="net_90">Net 90</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Credit Limit</label>
                  <input
                    type="number"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleInputChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tax ID</label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
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
                  {editingSupplier ? "Update" : "Create"} Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagementPage;
