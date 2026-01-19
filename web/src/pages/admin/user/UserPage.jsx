import React, { useEffect, useState, useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography, Button, Chip, Avatar } from "@mui/material";
import { UserPlus, ShieldCheck, Trash2, Edit } from "lucide-react";

import "../../../styles/admin/user/UserPageStyle.css";
import { getAllUser, deleteUser } from "../../../services/userService";
import UserModalComponent from "../../../components/admin/UserModalComponent";
import ConfirmModalComponent from "../../../components/common/ConfirmModalComponent";
import Toast from "../../../components/common/SnackbarComponent";

function UserPage() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getAllUser();
      setUsers(data);
    } catch {
      showToast("Failed to fetch users", "error");
    }
  }, [showToast]);

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      await deleteUser(deleteUserId);
      showToast("User deleted successfully");
      fetchUsers();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Something went wrong",
        "error",
      );
    } finally {
      setDeleteUserId("");
      setShowConfirmModal(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns = useMemo(
    () => [
      {
        field: "user",
        headerName: "User",
        flex: 1.5,
        renderCell: ({ row }) => (
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: "#f0fdf4", color: "#00A86B", fontSize: 14 }}>
              {row.name?.charAt(0)}
            </Avatar>
            <Box
              display={"flex"}
              flexDirection={"column"}
              alignItems={"start"}
              gap={1}
            >
              <Typography variant="body2" fontWeight={600}>
                {row.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {row.email}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        field: "role",
        headerName: "Role",
        flex: 1,
        renderCell: ({ value }) => (
          <Box
            display="flex"
            alignItems="center"
            justifyContent={"start"}
            gap={1}
            color="#6b7280"
          >
            <ShieldCheck size={16} />
            <Typography variant="body2">{value}</Typography>
          </Box>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        flex: 1,
        renderCell: ({ value }) => {
          const isActive = value === "active";
          return (
            <Chip
              label={value}
              size="small"
              sx={{
                bgcolor: isActive ? "#ecfdf5" : "#fff1f2",
                color: isActive ? "#00A86B" : "#e11d48",
                fontWeight: 600,
                borderRadius: "6px",
              }}
            />
          );
        },
      },
      {
        field: "lastLogin",
        headerName: "Last Login",
        flex: 1,
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 1,
        sortable: false,
        renderCell: ({ row }) => (
          <Box display="flex" gap={1}>
            <Button
              size="small"
              className="action-icon-btn"
              onClick={() => {
                setEditUser(row);
                setIsModalOpen(true);
              }}
            >
              <Edit size={18} />
            </Button>
            <Button
              size="small"
              className="action-icon-btn delete"
              onClick={() => {
                setDeleteUserId(row._id);
                setShowConfirmModal(true);
              }}
            >
              <Trash2 size={18} />
            </Button>
          </Box>
        ),
      },
    ],
    [],
  );

  return (
    <Box className="user-page-container">
      {isModalOpen && (
        <UserModalComponent
          isOpen
          data={editUser}
          mode={editUser?.name ? "edit" : "create"}
          onClose={() => {
            setIsModalOpen(false);
            setEditUser(null)
          }}
          onSave={(success) => {
            if (success) {
              showToast("updated the user successfully!", "success");
              fetchUsers();
            } else {
              showToast("failed to update the user!", "success");
            }
            setIsModalOpen(false);
          }}
        />
      )}

      {showConfirmModal && (
        <ConfirmModalComponent
          isOpen={showConfirmModal}
          title="Do you want to delete this user"
          message="Once deleted, it cannot be reverted"
          onConfirm={handleDeleteUser}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      <Toast
        open={snackbar.open}
        handleClose={closeToast}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      <Box
        className="user-page-header"
        display={"flex"}
        justifyContent={"space-between"}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="#111827">
            User Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your team members and their account permissions here.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UserPlus size={18} />}
          className="add-user-btn"
          onClick={() => {
            setEditUser({});
            setIsModalOpen(true);
          }}
        >
          Add New User
        </Button>
      </Box>

      <Box className="table-card">
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row._id}
          initialState={{
            pagination: { paginationModel: { pageSize: 5 } },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f9fafb",
              color: "#4b5563",
              fontWeight: 700,
            },
            "& .MuiDataGrid-cell:focus": { outline: "none" },
          }}
        />
      </Box>
    </Box>
  );
}

export default UserPage;
