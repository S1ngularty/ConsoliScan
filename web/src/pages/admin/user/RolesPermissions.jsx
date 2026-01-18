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
  Select,
  InputLabel,
  FormControl,
  MenuItem,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import {
  Shield,
  RefreshCw,
  Filter,
  Search,
  X,
  Edit,
  User,
  CheckCircle,
  XCircle,
  Users,
  Download,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";

import "../../../styles/admin/user/RolesPermission.css";
import Toast from "../../../components/common/SnackbarComponent";
import { getAllUser } from "../../../services/userService";

// // Mock data based on your schema
// const generateMockUsers = (count = 50) => {
//   const roles = ["user", "admin", "checker"];
//   const statuses = ["active", "inactive"];
//   const names = ["John Doe", "Jane Smith", "Robert Johnson", "Emily Davis", "Michael Wilson", "Sarah Brown"];
//   const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia"];

//   const users = [];

//   for (let i = 0; i < count; i++) {
//     const name = names[Math.floor(Math.random() * names.length)] + ` ${i + 1}`;
//     const role = roles[Math.floor(Math.random() * roles.length)];
//     const status = statuses[Math.floor(Math.random() * statuses.length)];
//     const email = `user${i + 1}@example.com`;
//     const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
//     const lastLogin = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

//     users.push({
//       _id: `user_${i + 1}`,
//       name,
//       email,
//       contactNumber: `+1 (555) ${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
//       city: cities[Math.floor(Math.random() * cities.length)],
//       state: "CA",
//       country: "United States",
//       role,
//       status,
//       createdAt: createdAt.toISOString(),
//       lastLogin: lastLogin.toISOString(),
//       avatar: {
//         url: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
//       }
//     });
//   }

//   return users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
// };

function RolePermissions() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    search: "",
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    role: "",
    status: "",
  });

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

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      fetchData();
      setLoading(false);
    }, 1000);
  }, []);

  const fetchData = async () => {
    try {
      const result = await getAllUser();
      setUsers(result);
    } catch (error) {
      console.log(error);
      showToast("failed to fetch the data", "error");
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setUsers(generateMockUsers(50));
      setLoading(false);
      showToast("Data refreshed", "info");
    }, 1000);
  };

  const handleClearFilters = () => {
    setFilters({
      role: "",
      status: "",
      search: "",
    });
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditData({
      role: user.role,
      status: user.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;

    // Update user role/status
    setUsers((prev) =>
      prev.map((user) =>
        user._id === selectedUser._id
          ? { ...user, role: editData.role, status: editData.status }
          : user,
      ),
    );

    showToast(
      `User ${selectedUser.name}'s role updated to ${editData.role}`,
      "success",
    );
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    setEditData({ role: "", status: "" });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "#00A86B";
      case "checker":
        return "#3b82f6";
      case "user":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Shield size={16} />;
      case "checker":
        return <CheckCircle size={16} />;
      case "user":
        return <User size={16} />;
      default:
        return <User size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#00A86B";
      case "inactive":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle size={16} />;
      case "inactive":
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      return (
        (!filters.role || user.role === filters.role) &&
        (!filters.status || user.status === filters.status) &&
        (!filters.search ||
          user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.role.toLowerCase().includes(filters.search.toLowerCase()))
      );
    });
  }, [users, filters]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const checkers = users.filter((u) => u.role === "checker").length;
    const regularUsers = users.filter((u) => u.role === "user").length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    const inactiveUsers = users.filter((u) => u.status === "inactive").length;

    return {
      totalUsers,
      admins,
      checkers,
      regularUsers,
      activeUsers,
      inactiveUsers,
      adminPercentage:
        totalUsers > 0 ? ((admins / totalUsers) * 100).toFixed(1) : 0,
    };
  }, [users]);

  const columns = [
    {
      field: "user",
      headerName: "User",
      flex: 1.5,
      minWidth: 250,
      renderCell: ({ row }) => (
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            src={row.avatar?.url}
            sx={{ bgcolor: "#f0fdf4", color: "#00A86B" }}
          >
            {!row.avatar?.url && row.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} color="#111827">
              {row.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Mail size={12} color="#6b7280" />
              <Typography variant="caption" color="#6b7280">
                {row.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ value }) => {
        const color = getRoleColor(value);
        return (
          <Chip
            label={value.charAt(0).toUpperCase() + value.slice(1)}
            size="small"
            icon={getRoleIcon(value)}
            sx={{
              bgcolor: color + "15",
              color: color,
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          />
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ value }) => {
        const color = getStatusColor(value);
        return (
          <Chip
            label={value.charAt(0).toUpperCase() + value.slice(1)}
            size="small"
            icon={getStatusIcon(value)}
            sx={{
              bgcolor: color + "15",
              color: color,
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          />
        );
      },
    },
    {
      field: "contactNumber",
      headerName: "Contact",
      flex: 1,
      minWidth: 150,
      renderCell: ({ value }) => (
        <Box
          display="flex"
          justifyContent={"center"}
          alignItems="flex-ebd"
          gap={1}
        >
          <Phone size={14} color="#6b7280" />
          <Typography variant="body2">{value ? value : "N/A"}</Typography>
        </Box>
      ),
    },
    {
      field: "lastLogin",
      headerName: "Last Login",
      flex: 1,
      minWidth: 150,
      renderCell: ({ value }) => (
        <Box
          display="flex"
          justifyContent={"center"}
          alignItems="flex-ebd"
          gap={1}
        >
          <Calendar size={14} color="#6b7280" />
          <Typography variant="body2">{value}</Typography>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      minWidth: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <Box
          display="flex"
          justifyContent={"center"}
          alignItems="flex-end"
          gap={1}
        >
          <Tooltip title="Edit Role">
            <IconButton
              size="small"
              className="action-btn edit"
              onClick={() => handleEditUser(row)}
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
          fileName: `users-roles-${new Date().toISOString().split("T")[0]}`,
        }}
      />
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarQuickFilter
        placeholder="Search users..."
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
    <Box className="role-permissions-container">
      {/* Edit Role Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Shield size={24} color="#00A86B" />
            <Typography variant="h6">
              Edit User Role - {selectedUser?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Current Email: <strong>{selectedUser?.email}</strong>
              </Typography>
            </Box>

            <FormControl fullWidth>
              <InputLabel>User Role</InputLabel>
              <Select
                value={editData.role}
                label="User Role"
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, role: e.target.value }))
                }
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="checker">Checker</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Account Status</InputLabel>
              <Select
                value={editData.status}
                label="Account Status"
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info" icon={<Shield size={20} />}>
              <Typography variant="body2" component="div">
                <strong>Role Descriptions:</strong>
                <Box component="ul" sx={{ pl: 2, mt: 0.5, mb: 0 }}>
                  <li>
                    <strong>Admin:</strong> Full system access
                  </li>
                  <li>
                    <strong>Checker:</strong> Can review and verify content
                  </li>
                  <li>
                    <strong>User:</strong> Basic access only
                  </li>
                </Box>
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setIsEditDialogOpen(false)}
            startIcon={<X size={18} />}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            startIcon={<CheckCircle size={18} />}
            className="save-btn"
          >
            Save Changes
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
      <Box className="role-header">
        <Box>
          <Typography variant="h5" fontWeight={700} color="#111827">
            User Roles Management
          </Typography>
          <Typography variant="body2" color="#6b7280">
            Manage user roles and account status (User, Admin, Checker)
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

      {/* Role Statistics */}
      <Box className="role-stats">
        <Card className="stat-card total">
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h4" fontWeight={700} color="#111827">
                  {stats.totalUsers}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  Total Users
                </Typography>
              </Box>
              <Users size={32} color="#6b7280" opacity={0.2} />
            </Box>
          </CardContent>
        </Card>

        <Card className="stat-card admin">
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: "#ecfdf5", color: "#00A86B" }}>
                <Shield size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#00A86B">
                  {stats.admins}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  Admins
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="caption"
              color="#00A86B"
              sx={{ mt: 1, display: "block" }}
            >
              {stats.adminPercentage}% of total
            </Typography>
          </CardContent>
        </Card>

        <Card className="stat-card checker">
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: "#eff6ff", color: "#3b82f6" }}>
                <CheckCircle size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#3b82f6">
                  {stats.checkers}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  Checkers
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card className="stat-card user">
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: "#f3f4f6", color: "#6b7280" }}>
                <User size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {stats.regularUsers}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  Regular Users
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
            <InputLabel>Role</InputLabel>
            <Select
              value={filters.role}
              label="Role"
              onChange={(e) => handleFilterChange("role", e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="checker">Checker</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            size="small"
            startIcon={<X size={16} />}
            onClick={handleClearFilters}
            disabled={!Object.values(filters).some((val) => val)}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Role Info Alert */}
      <Alert severity="info" icon={<Shield size={20} />}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <Typography variant="body2">
            <strong>Role Guidelines:</strong>
            <Box component="span" sx={{ ml: 1 }}>
              Admins have full access, Checkers can review content, Users have
              basic access only.
            </Box>
          </Typography>
          <Chip
            label={`${stats.activeUsers} active, ${stats.inactiveUsers} inactive`}
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>
      </Alert>

      {/* Data Table */}
      <Box className="table-card">
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          slots={{
            toolbar: CustomToolbar,
          }}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
            sorting: {
              sortModel: [{ field: "createdAt", sort: "desc" }],
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
          Showing {filteredUsers.length} of {users.length} users
          {Object.values(filters).some((val) => val) && " (filtered)"}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            icon={<Shield size={14} />}
            label={`${stats.admins} admins`}
            size="small"
            sx={{ bgcolor: "#ecfdf5", color: "#00A86B" }}
          />
          <Chip
            icon={<CheckCircle size={14} />}
            label={`${stats.checkers} checkers`}
            size="small"
            sx={{ bgcolor: "#eff6ff", color: "#3b82f6" }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default RolePermissions;
