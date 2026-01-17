import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography, Button, Paper, InputBase, IconButton, Chip } from "@mui/material";
import { FolderPlus, Edit, Trash2, Search, Folder, BarChart2 } from "lucide-react";
import "../../styles/admin/CategoryPageStyle.css";

const columns = [
  {
    field: "categoryName",
    headerName: "Category Name",
    flex: 2,
    renderCell: (params) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <div className="category-icon-box">
          <Folder size={18} />
        </div>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#1e293b" }}>
          {params.value}
        </Typography>
      </Box>
    ),
  },
  {
    field: "count",
    headerName: "Total Products",
    flex: 1,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <BarChart2 size={16} color="#94a3b8" />
        <Chip 
          label={params.value || 0}
          size="small"
          sx={{ 
            fontWeight: 700, 
            bgcolor: "#f0fdf4", 
            color: "#00A86B", 
            borderRadius: "6px",
            minWidth: "40px"
          }}
        />
      </Box>
    ),
  },
  {
    field: "actions",
    headerName: "Actions",
    flex: 0.8,
    sortable: false,
    headerAlign: "right",
    align: "right",
    renderCell: () => (
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <IconButton size="small" className="action-icon-btn"><Edit size={18} /></IconButton>
        <IconButton size="small" className="action-icon-btn delete"><Trash2 size={18} /></IconButton>
      </Box>
    ),
  },
];

function CategoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const apiData = [
    { "_id": "696b3d130fd4f84705a00e87", "categoryName": "Automotive", "count": 0 },
    { "_id": "696b3d130fd4f84705a00e85", "categoryName": "Beauty & Personal Care", "count": 0 },
    { "_id": "696b3d130fd4f84705a00e82", "categoryName": "Electronics", "count": 0 },
    { "_id": "696b3d130fd4f84705a00e83", "categoryName": "Fashion", "count": 0 },
    { "_id": "696b3d130fd4f84705a00e81", "categoryName": "Groceries", "count": 0 },
    { "_id": "696b3d130fd4f84705a00e84", "categoryName": "Home & Living", "count": 0 },
    { "_id": "696b3d130fd4f84705a00e88", "categoryName": "Pets", "count": 0 },
    { "_id": "696b3d130fd4f84705a00e86", "categoryName": "Sports & Outdoor", "count": 0 }
  ];

  const filteredRows = apiData.filter((row) =>
    row.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box className="category-page-view">
      <Box className="category-header">
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>Categories</Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your product classifications
          </Typography>
        </Box>
        <Button variant="contained" className="add-category-btn" startIcon={<FolderPlus size={18} />}>
          Add Category
        </Button>
      </Box>

      <Box className="search-toolbar">
        <Paper className="search-paper" elevation={0}>
          <Search size={18} color="#94a3b8" />
          <InputBase
            className="search-input"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Paper>
      </Box>

      <Box className="table-card">
        <DataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row._id}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          autoHeight
          disableRowSelectionOnClick
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": { 
                backgroundColor: "#f9fafb",
                color: "#4b5563",
                fontWeight: 700,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
            },
            "& .MuiDataGrid-cell": { borderBottom: "1px solid #f1f5f9" },
            "& .MuiDataGrid-cell:focus": { outline: "none" },
          }}
        />
      </Box>
    </Box>
  );
}

export default CategoryPage;