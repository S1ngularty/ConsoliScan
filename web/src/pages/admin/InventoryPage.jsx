import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Search,
  Filter,
  FileText,
} from "lucide-react";
import {
  getStockMovements,
  adjustStock,
  getAllPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
} from "../../services/inventoryService";
import Toast from "../../components/common/SnackbarComponent";
import "../../styles/admin/InventoryPageStyle.css";

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState("stock");
  const [stockMovements, setStockMovements] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [stockForm, setStockForm] = useState({
    product: "",
    type: "ADJUSTMENT",
    quantity: "",
    reason: "",
  });

  const [poForm, setPOForm] = useState({
    supplier: "",
    items: [{ product: "", quantity: "", unitCost: "" }],
    expectedDeliveryDate: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "stock") {
        const data = await getStockMovements();
        console.log("Stock Movements Result:", data);
        setStockMovements(data.movements || data.data || []);
      } else {
        const data = await getAllPurchaseOrders();
        console.log("Purchase Orders Result:", data);
        setPurchaseOrders(data.purchaseOrders || data.data || []);
      }
    } catch (error) {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      await adjustStock(
        stockForm.product,
        stockForm.quantity,
        stockForm.reason,
      );
      showToast("Stock adjustment created successfully");
      fetchData();
      resetStockForm();
    } catch (error) {
      showToast(error.response?.data?.message || "Operation failed", "error");
    }
  };

  const handlePOSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPurchaseOrder(poForm);
      showToast("Purchase order created successfully");
      fetchData();
      resetPOForm();
    } catch (error) {
      showToast(error.response?.data?.message || "Operation failed", "error");
    }
  };

  const handleReceivePO = async (poId) => {
    if (!window.confirm("Mark this purchase order as received?")) return;
    try {
      await receivePurchaseOrder(poId);
      showToast("Purchase order received successfully");
      fetchData();
    } catch (error) {
      showToast("Failed to receive purchase order", "error");
    }
  };

  const resetStockForm = () => {
    setStockForm({
      product: "",
      type: "ADJUSTMENT",
      quantity: "",
      reason: "",
    });
    setShowStockModal(false);
  };

  const resetPOForm = () => {
    setPOForm({
      supplier: "",
      items: [{ product: "", quantity: "", unitCost: "" }],
      expectedDeliveryDate: "",
      notes: "",
    });
    setShowPOModal(false);
  };

  const addPOItem = () => {
    setPOForm({
      ...poForm,
      items: [...poForm.items, { product: "", quantity: "", unitCost: "" }],
    });
  };

  const removePOItem = (index) => {
    setPOForm({
      ...poForm,
      items: poForm.items.filter((_, i) => i !== index),
    });
  };

  const updatePOItem = (index, field, value) => {
    const newItems = [...poForm.items];
    newItems[index][field] = value;
    setPOForm({ ...poForm, items: newItems });
  };

  const filteredStockMovements = stockMovements.filter((movement) => {
    const matchesSearch = movement.product?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || movement.type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredPOs = purchaseOrders.filter((po) =>
    po.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="inventory-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />

      <div className="page-header">
        <div className="header-content">
          <Package className="header-icon" size={32} />
          <div>
            <h1>Inventory Management</h1>
            <p>Track stock movements and purchase orders</p>
          </div>
        </div>
        <button
          className="add-btn"
          onClick={() =>
            activeTab === "stock"
              ? setShowStockModal(true)
              : setShowPOModal(true)
          }
        >
          <Plus size={18} />
          {activeTab === "stock" ? "Adjust Stock" : "New Purchase Order"}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "stock" ? "active" : ""}`}
          onClick={() => setActiveTab("stock")}
        >
          <Package size={18} />
          Stock Movements
        </button>
        <button
          className={`tab ${activeTab === "po" ? "active" : ""}`}
          onClick={() => setActiveTab("po")}
        >
          <ShoppingCart size={18} />
          Purchase Orders
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder={`Search ${
              activeTab === "stock" ? "products" : "suppliers"
            }...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {activeTab === "stock" && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="SALE">Sale</option>
            <option value="PURCHASE">Purchase</option>
            <option value="RETURN">Return</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="DAMAGE">Damage</option>
            <option value="EXPIRY">Expiry</option>
          </select>
        )}
      </div>

      {/* Content */}
      {activeTab === "stock" ? (
        <div className="stock-table-container">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Before</th>
                <th>After</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredStockMovements.map((movement) => (
                <tr key={movement._id}>
                  <td>
                    {new Date(movement.createdAt).toLocaleDateString("en-PH")}
                  </td>
                  <td>
                    <div className="product-cell">
                      <div className="product-name">
                        {movement.product?.name || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`type-badge ${movement.type.toLowerCase()}`}
                    >
                      {movement.type === "SALE" && <TrendingDown size={14} />}
                      {movement.type === "PURCHASE" && <TrendingUp size={14} />}
                      {movement.type}
                    </span>
                  </td>
                  <td className="quantity">{movement.quantity}</td>
                  <td>{movement.previousStock}</td>
                  <td>{movement.newStock}</td>
                  <td className="reason">{movement.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="po-grid">
          {filteredPOs.map((po) => (
            <div key={po._id} className="po-card">
              <div className="po-header">
                <div className="po-number">
                  <FileText size={18} />
                  <span>PO-{po.poNumber}</span>
                </div>
                <span className={`po-status ${po.status.toLowerCase()}`}>
                  {po.status}
                </span>
              </div>

              <div className="po-supplier">
                <strong>Supplier:</strong> {po.supplier?.name || "Unknown"}
              </div>

              <div className="po-items">
                <strong>Items ({po.items.length}):</strong>
                <ul>
                  {po.items.slice(0, 3).map((item, idx) => (
                    <li key={idx}>
                      {item.product?.name || "N/A"} - {item.quantity} units
                    </li>
                  ))}
                  {po.items.length > 3 && (
                    <li className="more">+{po.items.length - 3} more...</li>
                  )}
                </ul>
              </div>

              <div className="po-footer">
                <div className="po-total">
                  <span>Total:</span>
                  <strong>
                    ₱
                    {po.totalCost?.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </div>
                {po.status === "pending" && (
                  <button
                    className="receive-btn"
                    onClick={() => handleReceivePO(po._id)}
                  >
                    <Check size={16} />
                    Receive
                  </button>
                )}
              </div>

              {po.expectedDeliveryDate && (
                <div className="po-date">
                  Expected:{" "}
                  {new Date(po.expectedDeliveryDate).toLocaleDateString(
                    "en-PH",
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && (
        <div className="modal-overlay" onClick={resetStockForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Stock Adjustment</h2>
              <button className="close-btn" onClick={resetStockForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStockSubmit}>
              <div className="form-group">
                <label>Product ID *</label>
                <input
                  type="text"
                  value={stockForm.product}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, product: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  value={stockForm.type}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, type: e.target.value })
                  }
                  required
                >
                  <option value="ADJUSTMENT">Adjustment</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="EXPIRY">Expiry</option>
                </select>
              </div>

              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, quantity: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Reason *</label>
                <textarea
                  value={stockForm.reason}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, reason: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetStockForm}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Order Modal */}
      {showPOModal && (
        <div className="modal-overlay" onClick={resetPOForm}>
          <div
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>New Purchase Order</h2>
              <button className="close-btn" onClick={resetPOForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePOSubmit}>
              <div className="form-group">
                <label>Supplier ID *</label>
                <input
                  type="text"
                  value={poForm.supplier}
                  onChange={(e) =>
                    setPOForm({ ...poForm, supplier: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Items *</label>
                {poForm.items.map((item, index) => (
                  <div key={index} className="po-item-row">
                    <input
                      type="text"
                      placeholder="Product ID"
                      value={item.product}
                      onChange={(e) =>
                        updatePOItem(index, "product", e.target.value)
                      }
                      required
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) =>
                        updatePOItem(index, "quantity", e.target.value)
                      }
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Unit Cost"
                      value={item.unitCost}
                      onChange={(e) =>
                        updatePOItem(index, "unitCost", e.target.value)
                      }
                      required
                    />
                    {poForm.items.length > 1 && (
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removePOItem(index)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-btn"
                  onClick={addPOItem}
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="form-group">
                <label>Expected Delivery Date</label>
                <input
                  type="date"
                  value={poForm.expectedDeliveryDate}
                  onChange={(e) =>
                    setPOForm({
                      ...poForm,
                      expectedDeliveryDate: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={poForm.notes}
                  onChange={(e) =>
                    setPOForm({ ...poForm, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetPOForm}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
