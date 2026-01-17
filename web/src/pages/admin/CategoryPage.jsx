import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  Button,
  Paper,
  InputBase,
  IconButton,
  Chip,
} from "@mui/material";
import {
  FolderPlus,
  Edit,
  Trash2,
  Search,
  Folder,
  BarChart2,
} from "lucide-react";
import "../../styles/admin/CategoryPageStyle.css";
import Toast from "../../components/common/SnackbarComponent";
import Loader from "../../components/common/LoaderComponent";
import ConfirmModalComponent from "../../components/common/ConfirmModalComponent";
import CategoryModal from "../../components/admin/CategoryModalComponent";

import {
  fetchCategories,
  deleteCategory,
} from "../../services/categoryService";

function CategoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "#1e293b" }}
          >
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
              minWidth: "40px",
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
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <IconButton
            size="small"
            className="action-icon-btn"
            onClick={() => {
              setEditCategory(params.row);
              setIsModalOpen(true);
            }}
          >
            <Edit size={18} />
          </IconButton>
          <IconButton
            size="small"
            className="action-icon-btn delete"
            onClick={() => {
              setDeleteCategoryId(params.row._id);
              setShowConfirmModal(true);
            }}
          >
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
    const result = await fetchCategories();
    setCategories(result);
    return;
  };

  const handleDelete = async () => {
    try {
      if (!deleteCategoryId) throw new Error("undefined category id");
      setIsLoading(true);
      const isDeleted = await deleteCategory(deleteCategoryId);
      showToast("Successfully delete the category.", "success");
      setShowConfirmModal(false);
      setDeleteCategoryId("");
      fetchData();
    } catch (error) {
      console.log(error);
      showToast("Sorry, something went wrong, please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRows = categories.filter((row) =>
    row.categoryName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Box className="category-page-view">
      {isModalOpen && (
        <CategoryModal
          isOpen={isModalOpen}
          data={editCategory}
          onClose={() => {
            setIsModalOpen(false);
          }}
          onSave={() => {
            setIsModalOpen(false);
            showToast(
              `Successfully ${editCategory ? "edited" : "created"} the product!`,
              "success",
            );
            fetchData();
          }}
        ></CategoryModal>
      )}

      {showConfirmModal && (
        <ConfirmModalComponent
          isOpen={showConfirmModal}
          title={"Do you really want to delete this category?"}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowConfirmModal(false);
            setDeleteCategoryId("");
          }}
        ></ConfirmModalComponent>
      )}

      <Toast
        open={snackbar.open}
        handleClose={closeToast}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      <Box className="category-header">
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>
            Categories
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your product classifications
          </Typography>
        </Box>
        <Button
          variant="contained"
          className="add-category-btn"
          startIcon={<FolderPlus size={18} />}
          onClick={() => setIsModalOpen(true)}
        >
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
        {isLoading ? (
          <Loader></Loader>
        ) : (
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
                letterSpacing: "0.5px",
              },
              "& .MuiDataGrid-cell": { borderBottom: "1px solid #f1f5f9" },
              "& .MuiDataGrid-cell:focus": { outline: "none" },
            }}
          />
        )}
      </Box>
    </Box>
  );
}

export default CategoryPage;
