import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  InputBase,
  Paper,
} from "@mui/material";
import {
  PackagePlus,
  Barcode,
  Layers,
  Edit,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import ProductModal from "../../components/admin/ProductModalComponent";
import "../../styles/admin/ProductPageStyle.css";
import Toast from "../../components/common/SnackbarComponent";

import { fetchProducts } from "../../services/productService";

function ProductPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProductId, setDeleteProductId] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const columns = [
    {
      field: "product",
      headerName: "Product Info",
      flex: 2,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            src={params.row.images[0]?.url}
            variant="rounded"
            sx={{
              width: 45,
              height: 45,
              border: "1px solid #f1f5f9",
              bgcolor: "#f8fafc",
            }}
          >
            <Layers size={20} color="#94a3b8" />
          </Avatar>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
              gap: 0.3,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "#1e293b" }}
            >
              {params.row.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              SKU: {params.row.sku}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "barcode",
      headerName: "Identifier",
      flex: 1.2,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography
            variant="body2"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: "#475569",
            }}
          >
            <Barcode size={14} color="#64748b" /> {params.row.barcode}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#00A86B", fontWeight: 700 }}
          >
            {params.row.barcodeType}
          </Typography>
        </Box>
      ),
    },
    {
      field: "price",
      headerName: "Price",
      flex: 0.8,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
          ${params.value.toFixed(2)}
        </Typography>
      ),
    },
    {
      field: "stockQuantity",
      headerName: "Inventory",
      flex: 1,
      renderCell: (params) => {
        const isLow = params.value < 10;
        return (
          <Chip
            label={`${params.value} in stock`}
            size="small"
            sx={{
              bgcolor: isLow ? "#fff1f2" : "#f0fdf4",
              color: isLow ? "#e11d48" : "#00A86B",
              fontWeight: 600,
              borderRadius: "6px",
            }}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            size="small"
            className="action-icon-btn"
            onClick={() => {
              setEditProduct(params.row);
              setIsModalOpen(true);
            }}
          >
            <Edit size={18} />
          </IconButton>
          <IconButton size="small" className="action-icon-btn delete">
            <Trash2 size={18} />
          </IconButton>
        </Box>
      ),
    },
  ];

  const showToast = React.useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeToast = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const result = await fetchProducts();
    setProducts(result);
    return;
  };

  // Filtering logic
  const filteredRows = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm)
  );

  return (
    <Box className="product-page-view">
      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          data={editProduct}
          onClose={() => {
            setIsModalOpen(false);
          }}
          onSave={() => {
            setIsModalOpen(false);
            showToast(
              `Successfully ${editProduct ? "edited" : "created"} the product!`,
              "success"
            );
            fetchData();
          }}
        ></ProductModal>
      )}

      <Toast
        open={snackbar.open}
        handleClose={closeToast}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      <Box className="product-header">
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>
            Inventory Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {filteredRows.length} total products available
          </Typography>
        </Box>
        <Button
          variant="contained"
          className="add-product-btn"
          startIcon={<PackagePlus size={18} />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Product
        </Button>
      </Box>

      {/* 2. SEARCH & TOOLBAR */}
      <Box className="search-toolbar">
        <Paper className="search-paper" elevation={0}>
          <Search size={18} color="#94a3b8" />
          <InputBase
            className="search-input"
            placeholder="Search by name, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Paper>
        <Button className="filter-btn" startIcon={<Filter size={18} />}>
          Filters
        </Button>
      </Box>

      {/* 3. DATA GRID */}
      <Box className="table-card">
        <DataGrid
          rows={filteredRows}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 8 } },
          }}
          getRowId={(row) => row._id}
          pageSizeOptions={[8, 15, 30]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f9fafb",
              color: "#4b5563",
              fontWeight: 700,
              textTransform: "uppercase",
              fontSize: "0.75rem",
              letterSpacing: "0.5px",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #f1f5f9",
            },
            "& .MuiDataGrid-cell:focus": { outline: "none" },
          }}
        />
      </Box>
    </Box>
  );
}

// Wrapper for buttons to handle styling
const IconButton = ({ children, className, onClick }) => (
  <button className={`action-icon-btn ${className}`} onClick={onClick}>
    {children}
  </button>
);

export default ProductPage;
