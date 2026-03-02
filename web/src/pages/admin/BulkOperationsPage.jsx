import React, { useState, useEffect } from "react";
import {
  Settings,
  Upload,
  Download,
  Trash2,
  DollarSign,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  bulkPriceUpdate,
  bulkStockUpdate,
  bulkCategoryAssignment,
  bulkDelete,
  exportProducts,
  importProducts,
} from "../../services/bulkOperationsService";
import Toast from "../../components/common/SnackbarComponent";
import "../../styles/admin/BulkOperationsPageStyle.css";

const BulkOperationsPage = () => {
  const [selectedOperation, setSelectedOperation] = useState("price");
  const [productIds, setProductIds] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Price Update Form
  const [priceForm, setPriceForm] = useState({
    strategy: "SET",
    value: "",
  });

  // Stock Update Form
  const [stockForm, setStockForm] = useState({
    action: "ADD",
    quantity: "",
  });

  // Category Assign Form
  const [categoryForm, setCategoryForm] = useState({
    category: "",
  });

  // File for import
  const [importFile, setImportFile] = useState(null);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const getProductIdsArray = () => {
    return productIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  };

  const handlePriceUpdate = async () => {
    try {
      setLoading(true);
      const ids = getProductIdsArray();
      if (ids.length === 0) {
        showToast("Please enter at least one product ID", "error");
        return;
      }
      await bulkPriceUpdate({
        productIds: ids,
        strategy: priceForm.strategy,
        value: parseFloat(priceForm.value),
      });
      showToast(`Successfully updated prices for ${ids.length} products`);
      setProductIds("");
      setPriceForm({ strategy: "SET", value: "" });
    } catch (error) {
      showToast(
        error.response?.data?.message || "Price update failed",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async () => {
    try {
      setLoading(true);
      const ids = getProductIdsArray();
      if (ids.length === 0) {
        showToast("Please enter at least one product ID", "error");
        return;
      }
      await bulkStockUpdate({
        productIds: ids,
        action: stockForm.action,
        quantity: parseInt(stockForm.quantity),
      });
      showToast(`Successfully updated stock for ${ids.length} products`);
      setProductIds("");
      setStockForm({ action: "ADD", quantity: "" });
    } catch (error) {
      showToast(
        error.response?.data?.message || "Stock update failed",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryAssign = async () => {
    try {
      setLoading(true);
      const ids = getProductIdsArray();
      if (ids.length === 0) {
        showToast("Please enter at least one product ID", "error");
        return;
      }
      await bulkCategoryAssign({
        productIds: ids,
        category: categoryForm.category,
      });
      showToast(`Successfully assigned category to ${ids.length} products`);
      setProductIds("");
      setCategoryForm({ category: "" });
    } catch (error) {
      showToast(
        error.response?.data?.message || "Category assignment failed",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = getProductIdsArray();
    if (ids.length === 0) {
      showToast("Please enter at least one product ID", "error");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete ${ids.length} products? This action cannot be undone.`,
      )
    )
      return;

    try {
      setLoading(true);
      await bulkDelete({ productIds: ids });
      showToast(`Successfully deleted ${ids.length} products`);
      setProductIds("");
    } catch (error) {
      showToast(error.response?.data?.message || "Bulk delete failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const blob = await exportProducts();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Products exported successfully");
    } catch (error) {
      showToast("Export failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      showToast("Please select a file to import", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      setLoading(true);
      const result = await importProducts(formData);
      showToast(`Successfully imported ${result.imported} products`);
      setImportFile(null);
    } catch (error) {
      showToast(error.response?.data?.message || "Import failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-operations-page">
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />

      <div className="page-header">
        <div className="header-content">
          <Settings className="header-icon" size={32} />
          <div>
            <h1>Bulk Operations</h1>
            <p>Perform mass updates on multiple products</p>
          </div>
        </div>
      </div>

      <div className="operations-grid">
        {/* Operation Selector */}
        <div className="operation-selector">
          <h3>Select Operation</h3>
          <div className="operation-buttons">
            <button
              className={`operation-btn ${
                selectedOperation === "price" ? "active" : ""
              }`}
              onClick={() => setSelectedOperation("price")}
            >
              <DollarSign size={20} />
              <span>Price Update</span>
            </button>
            <button
              className={`operation-btn ${
                selectedOperation === "stock" ? "active" : ""
              }`}
              onClick={() => setSelectedOperation("stock")}
            >
              <Package size={20} />
              <span>Stock Update</span>
            </button>
            <button
              className={`operation-btn ${
                selectedOperation === "category" ? "active" : ""
              }`}
              onClick={() => setSelectedOperation("category")}
            >
              <Layers size={20} />
              <span>Category Assign</span>
            </button>
            <button
              className={`operation-btn danger ${
                selectedOperation === "delete" ? "active" : ""
              }`}
              onClick={() => setSelectedOperation("delete")}
            >
              <Trash2 size={20} />
              <span>Bulk Delete</span>
            </button>
            <button
              className={`operation-btn ${
                selectedOperation === "export" ? "active" : ""
              }`}
              onClick={() => setSelectedOperation("export")}
            >
              <Download size={20} />
              <span>Export Products</span>
            </button>
            <button
              className={`operation-btn ${
                selectedOperation === "import" ? "active" : ""
              }`}
              onClick={() => setSelectedOperation("import")}
            >
              <Upload size={20} />
              <span>Import Products</span>
            </button>
          </div>
        </div>

        {/* Operation Form */}
        <div className="operation-form">
          {selectedOperation !== "export" && selectedOperation !== "import" && (
            <div className="form-section">
              <label>Product IDs (comma-separated) *</label>
              <textarea
                value={productIds}
                onChange={(e) => setProductIds(e.target.value)}
                placeholder="e.g., 507f1f77bcf86cd799439011, 507f1f77bcf86cd799439012"
                rows={4}
              />
              <p className="help-text">
                Enter product IDs separated by commas. You can enter multiple
                IDs to perform bulk operations.
              </p>
            </div>
          )}

          {/* Price Update Form */}
          {selectedOperation === "price" && (
            <div className="form-section">
              <h3>
                <DollarSign size={20} />
                Price Update Settings
              </h3>
              <div className="form-group">
                <label>Strategy *</label>
                <select
                  value={priceForm.strategy}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, strategy: e.target.value })
                  }
                >
                  <option value="SET">Set Fixed Price</option>
                  <option value="INCREASE_PERCENT">Increase by %</option>
                  <option value="DECREASE_PERCENT">Decrease by %</option>
                  <option value="INCREASE_AMOUNT">Increase by Amount</option>
                  <option value="DECREASE_AMOUNT">Decrease by Amount</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  Value *{" "}
                  {priceForm.strategy.includes("PERCENT") ? "(%)" : "(₱)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={priceForm.value}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, value: e.target.value })
                  }
                  placeholder={
                    priceForm.strategy.includes("PERCENT")
                      ? "e.g., 10 (for 10%)"
                      : "e.g., 50.00"
                  }
                />
              </div>
              <button
                className="submit-btn"
                onClick={handlePriceUpdate}
                disabled={loading}
              >
                {loading ? "Processing..." : "Update Prices"}
              </button>
            </div>
          )}

          {/* Stock Update Form */}
          {selectedOperation === "stock" && (
            <div className="form-section">
              <h3>
                <Package size={20} />
                Stock Update Settings
              </h3>
              <div className="form-group">
                <label>Action *</label>
                <select
                  value={stockForm.action}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, action: e.target.value })
                  }
                >
                  <option value="ADD">Add Stock</option>
                  <option value="SUBTRACT">Subtract Stock</option>
                  <option value="SET">Set Stock</option>
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
                  placeholder="e.g., 100"
                />
              </div>
              <button
                className="submit-btn"
                onClick={handleStockUpdate}
                disabled={loading}
              >
                {loading ? "Processing..." : "Update Stock"}
              </button>
            </div>
          )}

          {/* Category Assign Form */}
          {selectedOperation === "category" && (
            <div className="form-section">
              <h3>
                <Layers size={20} />
                Category Assignment
              </h3>
              <div className="form-group">
                <label>Category ID *</label>
                <input
                  type="text"
                  value={categoryForm.category}
                  onChange={(e) =>
                    setCategoryForm({ category: e.target.value })
                  }
                  placeholder="Enter category ID"
                />
              </div>
              <button
                className="submit-btn"
                onClick={handleCategoryAssign}
                disabled={loading}
              >
                {loading ? "Processing..." : "Assign Category"}
              </button>
            </div>
          )}

          {/* Bulk Delete Form */}
          {selectedOperation === "delete" && (
            <div className="form-section danger-section">
              <h3>
                <AlertTriangle size={20} />
                Bulk Delete Products
              </h3>
              <div className="warning-box">
                <AlertTriangle size={24} />
                <div>
                  <strong>Warning!</strong>
                  <p>
                    This action will permanently delete all selected products.
                    This cannot be undone.
                  </p>
                </div>
              </div>
              <button
                className="submit-btn danger"
                onClick={handleBulkDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Products"}
              </button>
            </div>
          )}

          {/* Export Form */}
          {selectedOperation === "export" && (
            <div className="form-section">
              <h3>
                <Download size={20} />
                Export Products to CSV
              </h3>
              <p className="info-text">
                Export all products to a CSV file. This file can be used for
                backup or editing in spreadsheet software.
              </p>
              <div className="export-info">
                <CheckCircle size={20} />
                <span>All products will be exported</span>
              </div>
              <button
                className="submit-btn"
                onClick={handleExport}
                disabled={loading}
              >
                {loading ? "Exporting..." : "Download CSV"}
              </button>
            </div>
          )}

          {/* Import Form */}
          {selectedOperation === "import" && (
            <div className="form-section">
              <h3>
                <Upload size={20} />
                Import Products from CSV
              </h3>
              <p className="info-text">
                Upload a CSV file to import or update products. Make sure your
                file follows the correct format.
              </p>
              <div className="file-upload">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  id="file-input"
                />
                <label htmlFor="file-input" className="file-label">
                  <Upload size={20} />
                  {importFile ? importFile.name : "Choose CSV File"}
                </label>
              </div>
              {importFile && (
                <div className="file-info">
                  <CheckCircle size={16} />
                  <span>File ready: {importFile.name}</span>
                </div>
              )}
              <button
                className="submit-btn"
                onClick={handleImport}
                disabled={loading || !importFile}
              >
                {loading ? "Importing..." : "Import Products"}
              </button>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="tips-section">
          <h3>💡 Tips & Best Practices</h3>
          <ul>
            <li>
              <strong>Price Updates:</strong> Test on a few products first
              before applying to large batches.
            </li>
            <li>
              <strong>Stock Updates:</strong> Use "ADD" or "SUBTRACT" for
              incremental changes, "SET" to override current stock.
            </li>
            <li>
              <strong>Bulk Delete:</strong> Always backup your data before
              performing bulk deletes.
            </li>
            <li>
              <strong>Import/Export:</strong> Use CSV format with headers: name,
              price, stock, category, description.
            </li>
            <li>
              <strong>Product IDs:</strong> Copy IDs directly from your product
              list for accuracy.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BulkOperationsPage;
