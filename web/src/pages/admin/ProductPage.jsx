import React, { useState } from "react";
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
        <Box>
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
    renderCell: () => (
      <Box sx={{ display: "flex", gap: 1 }}>
        <IconButton size="small" className="action-icon-btn">
          <Edit size={18} />
        </IconButton>
        <IconButton size="small" className="action-icon-btn delete">
          <Trash2 size={18} />
        </IconButton>
      </Box>
    ),
  },
];

// Mock Data matching your Mongoose Schema
const rows = [
  {
    id: 1,
    name: "Wireless Headphones",
    sku: "WH-1000XM4",
    barcode: "4500123456",
    barcodeType: "EAN_13",
    price: 299.99,
    stockQuantity: 45,
    images: [{ url: "" }],
  },
  {
    id: 2,
    name: "Mechanical Keyboard",
    sku: "RGB-MK-90",
    barcode: "9780201379",
    barcodeType: "CODE_128",
    price: 89.5,
    stockQuantity: 4,
    images: [{ url: "" }],
  },
  {
    id: 3,
    name: "Smart Watch v2",
    sku: "SW-V2-BLK",
    barcode: "1234567890",
    barcodeType: "UPC",
    price: 199.0,
    stockQuantity: 12,
    images: [{ url: "" }],
  },
  {
    id: 4,
    name: "USB-C Hub Adapter",
    sku: "HUB-9IN1",
    barcode: "8801234567",
    barcodeType: "QR",
    price: 45.0,
    stockQuantity: 150,
    images: [{ url: "" }],
  },
];

function ProductPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProductId, setDeleteProductId] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Filtering logic
  const filteredRows = rows.filter(
    (row) =>
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.barcode.includes(searchTerm)
  );

  return (
    <Box className="product-page-view">
      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          data={{}}
          Onclose={() => {
            setIsModalOpen(false);
          }}
        ></ProductModal>
      )}

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
