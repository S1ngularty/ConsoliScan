import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Stack,
  LinearProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  InputAdornment,
  Card,
  CardContent,
} from "@mui/material";
import {
  Package,
  RefreshCw,
  Filter,
  Search,
  X,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Tag,
  Box as BoxIcon,
  Barcode,
  Layers,
  Image,
  TrendingUp,
  TrendingDown,
  Download,
} from "lucide-react";

import "../../../styles/admin/product/ProductInventory.css";
import Toast from "../../../components/common/SnackbarComponent";
import StockUpdateModal from "../../../components/admin/StockUpdateModal";
import { fetchProducts } from "../../../services/productService";

function ProductInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    stockFilter: "all",
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchData = async () => {
    const data = await fetchProducts();
    // console.log(data)
    setInventory(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeToast = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      fetchData();
      setLoading(false);
    }, 1000);
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      fetchData()
      setLoading(false);
      showToast("Inventory refreshed", "info");
    }, 1000);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      stockFilter: "all",
    });
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return "Out of Stock";
    if (quantity <= 10) return "Low Stock";
    if (quantity > 100) return "High Stock";
    return "In Stock";
  };

  const getStockColor = (quantity) => {
    const status = getStockStatus(quantity);
    switch (status) {
      case "In Stock":
        return "#00A86B";
      case "Low Stock":
        return "#f59e0b";
      case "Out of Stock":
        return "#ef4444";
      case "High Stock":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getStockIcon = (quantity) => {
    const status = getStockStatus(quantity);
    switch (status) {
      case "In Stock":
        return <CheckCircle size={16} />;
      case "Low Stock":
        return <AlertTriangle size={16} />;
      case "Out of Stock":
        return <XCircle size={16} />;
      case "High Stock":
        return <TrendingUp size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        !filters.search ||
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.barcode.includes(filters.search);

      let matchesStock = true;
      if (filters.stockFilter === "low") {
        matchesStock = item.stockQuantity <= 10;
      } else if (filters.stockFilter === "out") {
        matchesStock = item.stockQuantity === 0;
      } else if (filters.stockFilter === "high") {
        matchesStock = item.stockQuantity > 100;
      }

      return matchesSearch && matchesStock;
    });
  }, [inventory, filters]);

  const stats = useMemo(() => {
    const totalValue = inventory.reduce(
      (sum, item) => sum + item.price * item.stockQuantity,
      0,
    );
    const totalStock = inventory.reduce(
      (sum, item) => sum + item.stockQuantity,
      0,
    );
    const outOfStock = inventory.filter(
      (item) => item.stockQuantity === 0,
    ).length;
    const lowStock = inventory.filter(
      (item) => item.stockQuantity > 0 && item.stockQuantity <= 10,
    ).length;
    const totalProducts = inventory.length;

    return {
      totalValue: totalValue.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
      totalStock,
      outOfStock,
      lowStock,
      totalProducts,
      averageStock:
        totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0,
    };
  }, [inventory]);

  const columns = [
    {
      field: "product",
      headerName: "Product",
      flex: 1.5,
      minWidth: 250,
      renderCell: ({ row }) => (
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              bgcolor: getStockColor(row.stockQuantity) + "20",
              color: getStockColor(row.stockQuantity),
              fontSize: 14,
            }}
          >
            <Package size={20} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} color="#111827">
              {row.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Tag size={12} color="#6b7280" />
              <Typography variant="caption" color="#6b7280">
                {row.sku}
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      field: "barcode",
      headerName: "Barcode",
      flex: 1,
      minWidth: 150,
      renderCell: ({ row }) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Barcode size={14} color="#6b7280" />
          <Typography variant="body2" fontFamily="monospace">
            {row.barcode}
          </Typography>
        </Box>
      ),
    },
    {
      field: "price",
      headerName: "Price",
      flex: 0.8,
      minWidth: 100,
      renderCell: ({ value }) => (
        <Box display="flex" alignItems="center" gap={1}>
          <DollarSign size={14} color="#00A86B" />
          <Typography variant="body2" fontWeight={600} color="#00A86B">
            {value.toFixed(2)}
          </Typography>
        </Box>
      ),
    },
    {
      field: "stockQuantity",
      headerName: "Stock",
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => {
        const status = getStockStatus(row.stockQuantity);
        const color = getStockColor(row.stockQuantity);

        return (
          <Box width="100%">
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={0.5}
            >
              <Typography variant="body2" fontWeight={600}>
                {row.stockQuantity}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                {getStockIcon(row.stockQuantity)}
                <Typography variant="caption" color={color}>
                  {status}
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min((row.stockQuantity / 500) * 100, 100)}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: "#f3f4f6",
                "& .MuiLinearProgress-bar": {
                  bgcolor: color,
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        );
      },
    },
    {
      field: "barcodeType",
      headerName: "Barcode Type",
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          sx={{
            bgcolor: "#f3f4f6",
            color: "#4b5563",
            fontWeight: 500,
            fontSize: "0.75rem",
          }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      minWidth: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <Box display="flex" gap={1}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              className="action-btn view"
              onClick={() => {
                setSelectedProduct(row);
                setIsDetailDialogOpen(true);
              }}
            >
              <Eye size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Product">
            <IconButton
              size="small"
              className="action-btn edit"
              onClick={() => {
                setSelectedProduct(row)
                setStockModalOpen(true)
              }}
            >
              <Edit size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer sx={{ p: 2, gap: 1 }}>
      <GridToolbarFilterButton />
      <GridToolbarExport
        csvOptions={{
          fileName: `inventory-${new Date().toISOString().split("T")[0]}`,
        }}
      />
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarQuickFilter
        placeholder="Search products..."
        value={filters.search}
        onChange={(e) => handleFilterChange("search", e.target.value)}
        sx={{
          "& .MuiInputBase-root": {
            height: "40px",
            width: "250px",
          },
        }}
      />
    </GridToolbarContainer>
  );

  return (
    <Box className="product-inventory-container">
      {/* Product Detail Dialog */}

      <StockUpdateModal
        open={stockModalOpen}
        data={selectedProduct}
        onClose={() => setStockModalOpen(false)}
        onSave={() => {
          showToast(`${selectedProduct.name}'s stock updated successfully!`);
          setSelectedProduct(null);
          setIsDetailDialogOpen(false);
          setStockModalOpen(false);
          fetchData();
        }}
      ></StockUpdateModal>
      <Dialog
        open={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Package size={24} color="#00A86B" />
            <Typography variant="h6">{selectedProduct?.name}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Stack spacing={3}>
              {/* Basic Info */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Product Information
                </Typography>
                <Stack spacing={2}>
                  <Box
                    display="grid"
                    gridTemplateColumns="repeat(2, 1fr)"
                    gap={2}
                  >
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        SKU:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedProduct.sku}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Barcode:
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        fontFamily="monospace"
                      >
                        {selectedProduct.barcode}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Barcode Type:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedProduct.barcodeType}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Slug:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedProduct.slug}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>

              {/* Stock & Price */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Stock & Pricing
                </Typography>
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(2, 1fr)"
                  gap={3}
                >
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Stock Quantity:
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color={getStockColor(selectedProduct.stockQuantity)}
                    >
                      {selectedProduct.stockQuantity}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {getStockStatus(selectedProduct.stockQuantity)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Price:
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="#00A86B">
                      ${selectedProduct.price.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Total Value: $
                      {(
                        selectedProduct.price * selectedProduct.stockQuantity
                      ).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Description */}
              {selectedProduct.description && (
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {selectedProduct.description}
                  </Typography>
                </Paper>
              )}

              {/* Timestamps */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Timestamps
                </Typography>
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(2, 1fr)"
                  gap={2}
                >
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Created:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(selectedProduct.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Last Updated:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(selectedProduct.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setIsDetailDialogOpen(false);
              // Navigate to edit page
            }}
            className="edit-product-btn"
          >
            Edit Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Toast
        open={snackbar.open}
        handleClose={closeToast}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      {/* Header */}
      <Box className="inventory-header">
        <Box>
          <Typography variant="h5" fontWeight={700} color="#111827">
            Product Inventory
          </Typography>
          <Typography variant="body2" color="#6b7280">
            Manage product stock and view inventory details
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download size={18} />}
            className="export-btn"
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Box className="inventory-stats">
        <Card className="stat-card">
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: "#f0fdf4", color: "#00A86B" }}>
                <Package size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {stats.totalProducts}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  Total Products
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: "#f0fdf4", color: "#00A86B" }}>
                <BoxIcon size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {stats.totalStock}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  Total Stock
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: "#fef3c7", color: "#92400e" }}>
                <AlertTriangle size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#92400e">
                  {stats.lowStock}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  Low Stock
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: "#fef2f2", color: "#dc2626" }}>
                <XCircle size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#dc2626">
                  {stats.outOfStock}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  Out of Stock
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filter Bar */}
      <Paper className="filter-bar">
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <Typography variant="subtitle2" fontWeight={600} color="#374151">
            <Filter size={16} style={{ marginRight: 8 }} />
            Filters:
          </Typography>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Stock Status</InputLabel>
            <Select
              value={filters.stockFilter}
              label="Stock Status"
              onChange={(e) =>
                handleFilterChange("stockFilter", e.target.value)
              }
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="low">Low Stock (≤ 10)</MenuItem>
              <MenuItem value="out">Out of Stock</MenuItem>
              <MenuItem value="high">High Stock (100)</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            size="small"
            startIcon={<X size={16} />}
            onClick={handleClearFilters}
            disabled={!filters.search && filters.stockFilter === "all"}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Data Table */}
      <Box className="table-card">
        <DataGrid
          rows={filteredInventory}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          slots={{
            toolbar: CustomToolbar,
          }}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
            sorting: {
              sortModel: [{ field: "stockQuantity", sort: "desc" }],
            },
          }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: "none",
            "& .MuiDataGrid-virtualScroller": {
              minHeight: "400px",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              color: "#4b5563",
              fontWeight: 700,
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #f3f4f6",
              "&:focus": { outline: "none" },
            },
            "& .MuiDataGrid-row": {
              "&:hover": {
                backgroundColor: "#f9fafb",
              },
            },
          }}
        />
      </Box>

      {/* Summary */}
      <Box className="summary-footer">
        <Typography variant="body2" color="#6b7280">
          Showing {filteredInventory.length} of {inventory.length} products
          {(filters.search || filters.stockFilter !== "all") && " (filtered)"}
        </Typography>
        <Typography variant="body2" color="#00A86B" fontWeight={600}>
          Total Value: {stats.totalValue}
        </Typography>
      </Box>
    </Box>
  );
}

export default ProductInventory;
