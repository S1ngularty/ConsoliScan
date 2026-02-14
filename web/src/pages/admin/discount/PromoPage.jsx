// src/pages/admin/promo/PromoListPage.jsx
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Calendar,
  Tag,
  DollarSign,
  Percent,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  ChevronDown,
  AlertCircle,
  Copy,
  Eye,
} from "lucide-react";
import PromoModal from "../../../components/admin/PromoModalComponent";
import ConfirmationModal from "../../../components/common/ConfirmModalComponent";
import Loader from "../../../components/common/LoaderComponent";
import "../../../styles/admin/discount/PromoPageStyle.css";
import {
  getPromos,
  createPromo,
  updatePromo,
  deletePromo,
  togglePromoStatus,
} from "../../../services/promoService";

const PromoListPage = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch promos
  const fetchPromos = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: perPage,
        search: searchTerm,
        promoType: filterType !== "all" ? filterType : undefined,
        active: filterStatus !== "all" ? (filterStatus === "active") : undefined,
        sortBy,
        sortOrder,
      };
      
      const response = await getPromos(params);
      setPromos(response.data || response);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch promos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, [page, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

  const handleCreatePromo = () => {
    setSelectedPromo(null);
    setModalMode("create");
    setShowPromoModal(true);
  };

  const handleEditPromo = (promo) => {
    setSelectedPromo(promo);
    setModalMode("edit");
    setShowPromoModal(true);
  };

  const handleDeleteClick = (promo) => {
    setSelectedPromo(promo);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPromo) return;
    
    try {
      await deletePromo(selectedPromo._id);
      fetchPromos();
      setShowDeleteModal(false);
      setSelectedPromo(null);
    } catch (error) {
      console.error("Failed to delete promo:", error);
    }
  };

  const handleToggleStatus = async (promoId, currentStatus) => {
    try {
      await togglePromoStatus(promoId, !currentStatus);
      fetchPromos();
    } catch (error) {
      console.error("Failed to toggle promo status:", error);
    }
  };

  const handleSavePromo = async (promoData) => {
    try {
      if (modalMode === "create") {
        await createPromo(promoData);
      } else {
        await updatePromo(selectedPromo._id, promoData);
      }
      fetchPromos();
      setShowPromoModal(false);
      setSelectedPromo(null);
    } catch (error) {
      console.error("Failed to save promo:", error);
      throw error;
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    // You can add a toast notification here
    alert("Promo code copied to clipboard!");
  };

  // Calculate remaining uses
  const calculateRemainingUses = (promo) => {
    if (!promo.usageLimit) return "Unlimited";
    return Math.max(0, promo.usageLimit - (promo.usedCount || 0));
  };

  // Filter promos
  const filteredPromos = promos.filter((promo) => {
    if (filterType !== "all" && promo.promoType !== filterType) return false;
    if (filterStatus !== "all") {
      if (filterStatus === "active" && !promo.active) return false;
      if (filterStatus === "inactive" && promo.active) return false;
    }
    return true;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  const isActive = (promo) => {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    return promo.active && now >= start && now <= end;
  };

  return (
    <div className="promo-management-container">
      {/* Header */}
      <header className="promo-header">
        <div>
          <h1 className="promo-title">Promo Management</h1>
          <p className="promo-subtitle">Create and manage promotional offers</p>
        </div>
        <button className="btn-create-promo" onClick={handleCreatePromo}>
          <Plus size={18} />
          <span>Create Promo</span>
        </button>
      </header>

      {/* Filters and Search */}
      <div className="promo-controls">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search promos by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="createdAt">Created Date</option>
              <option value="startDate">Start Date</option>
              <option value="endDate">End Date</option>
              <option value="promoName">Name</option>
              <option value="value">Discount Value</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="sort-order-btn"
            >
              <ChevronDown size={16} className={sortOrder === "desc" ? "desc" : "asc"} />
            </button>
          </div>
        </div>
      </div>

      {/* Promos Table */}
      <div className="promo-table-container">
        {loading ? (
          <div className="loading-container">
            <Loader variant="page" />
          </div>
        ) : filteredPromos.length === 0 ? (
          <div className="empty-state">
            <Tag size={48} className="empty-icon" />
            <h3>No promos found</h3>
            <p>Create your first promo to get started</p>
            <button className="btn-create-first" onClick={handleCreatePromo}>
              <Plus size={16} />
              <span>Create First Promo</span>
            </button>
          </div>
        ) : (
          <table className="promo-table">
            <thead>
              <tr>
                <th>Promo Name</th>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Scope</th>
                <th>Period</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromos.map((promo) => (
                <tr key={promo._id} className={!promo.active ? "inactive-row" : ""}>
                  <td>
                    <div className="promo-name-cell">
                      <span className="promo-name">{promo.promoName.promo}</span>
                      {isExpired(promo.endDate) && (
                        <span className="expired-badge">Expired</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="code-cell">
                      <code className="promo-code">{promo.code}</code>
                      <button
                        className="copy-btn"
                        onClick={() => handleCopyCode(promo.code)}
                        title="Copy code"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="type-cell">
                      {promo.promoType === "percentage" ? (
                        <Percent size={16} className="percentage-icon" />
                      ) : (
                        <DollarSign size={16} className="fixed-icon" />
                      )}
                      <span className="type-text">
                        {promo.promoType.charAt(0).toUpperCase() + promo.promoType.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="value-cell">
                      {promo.promoType === "percentage" ? (
                        <span className="percentage-value">{promo.value}%</span>
                      ) : (
                        <span className="fixed-value">${promo.value.toFixed(2)}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`scope-badge scope-${promo.scope}`}>
                      {promo.scope}
                    </span>
                  </td>
                  <td>
                    <div className="date-cell">
                      <div className="date-range">
                        <Calendar size={12} />
                        <span>{formatDate(promo.startDate)}</span>
                      </div>
                      <div className="date-range">
                        <Calendar size={12} />
                        <span>{formatDate(promo.endDate)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="usage-cell">
                      <div className="usage-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${promo.usageLimit ? ((promo.usedCount || 0) / promo.usageLimit) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="usage-text">
                          {promo.usedCount || 0} / {promo.usageLimit || "∞"}
                        </span>
                      </div>
                      <div className="remaining-uses">
                        {calculateRemainingUses(promo)} remaining
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      <button
                        className={`status-toggle ${isActive(promo) ? "active" : "inactive"}`}
                        onClick={() => handleToggleStatus(promo._id, promo.active)}
                      >
                        {isActive(promo) ? (
                          <>
                            <CheckCircle size={14} />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={14} />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => handleEditPromo(promo)}
                        title="Edit promo"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteClick(promo)}
                        title="Delete promo"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className="btn-action btn-view"
                        onClick={() => {/* Implement view details */}}
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {filteredPromos.length > 0 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPromoModal && (
        <PromoModal
          isOpen={showPromoModal}
          onClose={() => setShowPromoModal(false)}
          onSave={handleSavePromo}
          data={selectedPromo}
          mode={modalMode}
        />
      )}

      {showDeleteModal && selectedPromo && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedPromo(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Promo"
          message={`Are you sure you want to delete "${selectedPromo.promoName.promo}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </div>
  );
};

export default PromoListPage;