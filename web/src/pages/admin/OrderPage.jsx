import React, { useEffect, useState, useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  Chip,
  TextField,
  MenuItem,
  IconButton,
  Button,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  Filter,
} from "lucide-react";

import "../../styles/admin/OrderPageStyle.css";
import {
  getAllOrders,
  downloadReceipt,
  downloadOrdersReport,
} from "../../services/orderService";
import Toast from "../../components/common/SnackbarComponent";

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 1,
  });

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    customerType: "",
    search: "",
    startDate: "",
    endDate: "",
  });

  const [expandedRows, setExpandedRows] = useState(new Set());

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeToast = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllOrders({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });

      setOrders(data.orders || []);
      setPagination({
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 25,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 1,
      });
    } catch (error) {
      showToast("Failed to fetch orders", "error");
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [filters.status, filters.customerType, pagination.page, pagination.limit]);

  const handleSearch = () => {
    if (pagination.page === 1) {
      fetchOrders();
    } else {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDownloadReceipt = async (orderId, checkoutCode) => {
    try {
      const blob = await downloadReceipt(orderId, checkoutCode);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${checkoutCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast("Receipt downloaded successfully");
    } catch (error) {
      showToast("Failed to download receipt", "error");
    }
  };

  const handleDownloadReport = async () => {
    try {
      showToast("Generating report...");
      const blob = await downloadOrdersReport({
        status: filters.status,
        customerType: filters.customerType,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orders-report-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast("Report downloaded successfully");
    } catch (error) {
      console.error("Error downloading report:", error);
      showToast("Failed to download report", "error");
    }
  };

  const toggleRowExpansion = (orderId) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      CONFIRMED: { bg: "#ecfdf5", color: "#00A86B" },
      CANCELLED: { bg: "#fee2e2", color: "#dc2626" },
      REFUNDED: { bg: "#fef3c7", color: "#d97706" },
    };
    return colors[status] || { bg: "#f3f4f6", color: "#6b7280" };
  };

  const getCustomerTypeColor = (type) => {
    const colors = {
      senior: { bg: "#dbeafe", color: "#1e40af" },
      pwd: { bg: "#fce7f3", color: "#be185d" },
      regular: { bg: "#f3f4f6", color: "#4b5563" },
      none: { bg: "#f9fafb", color: "#9ca3af" },
    };
    return colors[type] || colors.regular;
  };

  const columns = useMemo(
    () => [
      {
        field: "expand",
        headerName: "",
        width: 60,
        sortable: false,
        renderCell: ({ row }) => (
          <IconButton
            size="small"
            onClick={() => toggleRowExpansion(row._id)}
            sx={{ color: "#6b7280" }}
          >
            {expandedRows.has(row._id) ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </IconButton>
        ),
      },
      {
        field: "checkoutCode",
        headerName: "Checkout Code",
        flex: 1,
        minWidth: 150,
        renderCell: ({ value }) => (
          <Box display="flex" alignItems="center" gap={1}>
            <FileText size={16} color="#6b7280" />
            <Typography variant="body2" fontWeight={600}>
              {value}
            </Typography>
          </Box>
        ),
      },
      {
        field: "user",
        headerName: "Customer",
        flex: 1,
        minWidth: 180,
        renderCell: ({ row }) => (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {row.user?.name || "Walk-in Customer"}
            </Typography>
            {row.user?.email && (
              <Typography variant="caption" color="textSecondary">
                {row.user.email}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: "customerType",
        headerName: "Type",
        flex: 0.8,
        minWidth: 100,
        renderCell: ({ value }) => {
          const style = getCustomerTypeColor(value);
          return (
            <Chip
              label={value?.toUpperCase() || "N/A"}
              size="small"
              sx={{
                bgcolor: style.bg,
                color: style.color,
                fontWeight: 600,
                fontSize: "0.75rem",
                borderRadius: "6px",
              }}
            />
          );
        },
      },
      {
        field: "baseAmount",
        headerName: "Base Amount",
        flex: 0.8,
        minWidth: 110,
        renderCell: ({ value }) => (
          <Typography variant="body2">{formatCurrency(value)}</Typography>
        ),
      },
      {
        field: "discountBreakdown",
        headerName: "Discount",
        flex: 0.8,
        minWidth: 100,
        renderCell: ({ row }) => {
          const total =
            row.discountBreakdown?.total ||
            (row.bnpcDiscount?.total || 0) +
              (row.promoDiscount?.amount || 0) +
              (row.loyaltyDiscount?.amount || 0) +
              (row.voucherDiscount || 0);
          return (
            <Typography variant="body2" color="error">
              -{formatCurrency(total)}
            </Typography>
          );
        },
      },
      {
        field: "finalAmountPaid",
        headerName: "Final Amount",
        flex: 0.9,
        minWidth: 120,
        renderCell: ({ value }) => (
          <Typography variant="body2" fontWeight={700} color="#00A86B">
            {formatCurrency(value)}
          </Typography>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        flex: 0.8,
        minWidth: 120,
        renderCell: ({ value }) => {
          const style = getStatusColor(value);
          return (
            <Chip
              label={value}
              size="small"
              sx={{
                bgcolor: style.bg,
                color: style.color,
                fontWeight: 600,
                borderRadius: "6px",
              }}
            />
          );
        },
      },
      {
        field: "confirmedAt",
        headerName: "Date",
        flex: 1,
        minWidth: 160,
        renderCell: ({ value }) => (
          <Typography variant="body2">{formatDate(value)}</Typography>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 0.6,
        minWidth: 80,
        sortable: false,
        renderCell: ({ row }) => (
          <IconButton
            size="small"
            onClick={() => handleDownloadReceipt(row._id, row.checkoutCode)}
            sx={{ color: "#00A86B" }}
            title="Download Receipt"
          >
            <Download size={18} />
          </IconButton>
        ),
      },
    ],
    [expandedRows],
  );

  const ExpandedRowContent = ({ row }) => {
    if (!expandedRows.has(row._id)) return null;

    return (
      <Box className="expanded-row-content">
        <Box className="order-details-grid">
          <Box className="detail-section">
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Order Information
            </Typography>
            <Box className="detail-row">
              <Typography variant="caption" color="textSecondary">
                Order ID:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {row._id}
              </Typography>
            </Box>
            <Box className="detail-row">
              <Typography variant="caption" color="textSecondary">
                Cashier:
              </Typography>
              <Typography variant="body2">
                {row.cashier?.name || "N/A"}
              </Typography>
            </Box>
            <Box className="detail-row">
              <Typography variant="caption" color="textSecondary">
                App User:
              </Typography>
              <Typography variant="body2">
                {row.appUser ? "Yes" : "No"}
              </Typography>
            </Box>
            {row.systemVerified && (
              <Box className="detail-row">
                <Typography variant="caption" color="textSecondary">
                  Verification:
                </Typography>
                <Chip
                  label="System Verified"
                  size="small"
                  sx={{
                    bgcolor: "#dbeafe",
                    color: "#1e40af",
                    fontSize: "0.7rem",
                  }}
                />
              </Box>
            )}
          </Box>

          <Box className="detail-section">
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Discount Details
            </Typography>
            {row.bnpcDiscount?.total > 0 && (
              <Box className="detail-row">
                <Typography variant="caption" color="textSecondary">
                  BNPC Discount:
                </Typography>
                <Typography variant="body2" color="error">
                  -{formatCurrency(row.bnpcDiscount.total)}
                </Typography>
              </Box>
            )}
            {row.promoDiscount?.amount > 0 && (
              <Box className="detail-row">
                <Typography variant="caption" color="textSecondary">
                  Promo ({row.promoDiscount.code}):
                </Typography>
                <Typography variant="body2" color="error">
                  -{formatCurrency(row.promoDiscount.amount)}
                </Typography>
              </Box>
            )}
            {row.loyaltyDiscount?.amount > 0 && (
              <Box className="detail-row">
                <Typography variant="caption" color="textSecondary">
                  Loyalty Points:
                </Typography>
                <Typography variant="body2" color="error">
                  -{formatCurrency(row.loyaltyDiscount.amount)} (
                  {row.loyaltyDiscount.pointsUsed} pts)
                </Typography>
              </Box>
            )}
            {row.loyaltyDiscount?.pointsEarned > 0 && (
              <Box className="detail-row">
                <Typography variant="caption" color="success.main">
                  Points Earned:
                </Typography>
                <Typography
                  variant="body2"
                  color="success.main"
                  fontWeight={600}
                >
                  +{row.loyaltyDiscount.pointsEarned.toFixed(2)} pts
                </Typography>
              </Box>
            )}
          </Box>

          <Box className="detail-section">
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Item Statistics
            </Typography>
            <Box className="detail-row">
              <Typography variant="caption" color="textSecondary">
                Total Items:
              </Typography>
              <Typography variant="body2">
                {row.itemStats?.totalItems || row.items?.length || 0}
              </Typography>
            </Box>
            <Box className="detail-row">
              <Typography variant="caption" color="textSecondary">
                Total Quantity:
              </Typography>
              <Typography variant="body2">
                {row.itemStats?.totalQuantity || 0}
              </Typography>
            </Box>
            {row.hasBNPCItems && (
              <Box className="detail-row">
                <Typography variant="caption" color="textSecondary">
                  BNPC Items:
                </Typography>
                <Chip
                  label={`${row.itemStats?.bnpcEligibleItems || 0} items`}
                  size="small"
                  sx={{
                    bgcolor: "#fef3c7",
                    color: "#d97706",
                    fontSize: "0.7rem",
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>

        {row.items && row.items.length > 0 && (
          <Box className="items-table">
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Order Items
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {row.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {item.name}
                      </Typography>
                      {item.sku && (
                        <Typography variant="caption" color="textSecondary">
                          SKU: {item.sku}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {item.quantity} {item.unit || "pc"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(item.itemTotal)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={item.status || "SOLD"}
                        size="small"
                        sx={{
                          fontSize: "0.7rem",
                          bgcolor:
                            item.status === "RETURNED"
                              ? "#fee2e2"
                              : item.status === "EXCHANGED"
                                ? "#fef3c7"
                                : "#ecfdf5",
                          color:
                            item.status === "RETURNED"
                              ? "#dc2626"
                              : item.status === "EXCHANGED"
                                ? "#d97706"
                                : "#00A86B",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box className="order-page-container">
      <Toast
        open={snackbar.open}
        handleClose={closeToast}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      <Box className="order-page-header">
        <Box>
          <Typography variant="h5" fontWeight={700} color="#111827">
            Sales Transactions
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and manage all sales orders and transactions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Download size={18} />}
          onClick={handleDownloadReport}
          sx={{
            backgroundColor: "#00A86B",
            textTransform: "none",
            fontWeight: 600,
            padding: "8px 20px",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#008f5b",
            },
          }}
        >
          Download Report
        </Button>
      </Box>

      <Box className="filters-section">
        <Box className="filter-row">
          <TextField
            placeholder="Search by checkout code..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            size="small"
            className="search-field"
            InputProps={{
              startAdornment: <Search size={18} style={{ marginRight: 8 }} />,
            }}
          />

          <TextField
            select
            label="Status"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            size="small"
            className="filter-field"
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="CONFIRMED">Confirmed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
            <MenuItem value="REFUNDED">Refunded</MenuItem>
          </TextField>

          <TextField
            select
            label="Customer Type"
            value={filters.customerType}
            onChange={(e) => handleFilterChange("customerType", e.target.value)}
            size="small"
            className="filter-field"
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="senior">Senior</MenuItem>
            <MenuItem value="pwd">PWD</MenuItem>
            <MenuItem value="regular">Regular</MenuItem>
            <MenuItem value="none">None</MenuItem>
          </TextField>

          <TextField
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            size="small"
            className="filter-field"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            size="small"
            className="filter-field"
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Box>

      <Box className="table-card">
        <DataGrid
          rows={orders}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          paginationMode="server"
          rowCount={pagination.total}
          paginationModel={{
            page: pagination.page - 1,
            pageSize: pagination.limit,
          }}
          onPaginationModelChange={(model) => {
            setPagination((prev) => ({
              ...prev,
              page: model.page + 1,
              limit: model.pageSize,
            }));
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          autoHeight
          getRowHeight={() => "auto"}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f9fafb",
              color: "#4b5563",
              fontWeight: 700,
            },
            "& .MuiDataGrid-cell": {
              padding: "12px",
            },
            "& .MuiDataGrid-cell:focus": { outline: "none" },
            "& .MuiDataGrid-row": {
              "&:hover": {
                backgroundColor: "#f9fafb",
              },
            },
          }}
        />
      </Box>

      {/* Render expanded row details below the table */}
      {orders.map((row) => (
        <Collapse key={`expanded-${row._id}`} in={expandedRows.has(row._id)}>
          <ExpandedRowContent row={row} />
        </Collapse>
      ))}
    </Box>
  );
};

export default OrderPage;
