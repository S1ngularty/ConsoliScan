import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography, Button, Chip, Avatar } from "@mui/material";
import { UserPlus, Mail, ShieldCheck, Trash2, Edit } from "lucide-react";
import "../../styles/admin/UserPageStyle.css";
import { getAllUser } from "../../services/userService";
import UserModalComponent from "../../components/admin/UserModalComponent";

const columns = [
  {
    field: "user",
    headerName: "User",
    flex: 1.5,
    renderCell: (params) => (
      <Box
        sx={{
          display: "flex",
          justifyContent: "start",
          alignItems: "center",
          gap: 2,
        }}>
        <Avatar
          sx={{ bgcolor: "#f0fdf4", color: "#00A86B", fontSize: "0.85rem" }}>
          {params.row.name.charAt(0)}
        </Avatar>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "end",
            alignItems: "start",
            gap: 0.5,
          }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.row.name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {params.row.email}
          </Typography>
        </Box>
      </Box>
    ),
  },
  {
    field: "role",
    headerName: "Role",
    flex: 1,
    renderCell: (params) => (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "#6b7280",
        }}>
        <ShieldCheck size={16} />
        <Typography variant="body2">{params.value}</Typography>
      </Box>
    ),
  },
  {
    field: "status",
    headerName: "Status",
    flex: 1,
    renderCell: (params) => {
      const isActive = params.value === "active";
      return (
        <Chip
          label={params.value}
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
    renderCell: () => (
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button size="small" className="action-icon-btn">
          <Edit size={18} />
        </Button>
        <Button size="small" className="action-icon-btn delete">
          <Trash2 size={18} />
        </Button>
      </Box>
    ),
  },
];

function UserPage() {
  const [users, setUsers] = React.useState([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchUsers = async () => {
      const users = await getAllUser();
      console.log(users);
      setUsers(users);
    };

    fetchUsers();
  }, []);

  return (
    <Box className="user-page-container">
      {isOpen && (
        <UserModalComponent
          isOpen={true}
          data={{}}
          Onclose={() => setIsOpen(false)}></UserModalComponent>
      )}

      <Box className="user-page-header">
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>
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
          onClick={() => setIsOpen(true)}>
          Add New User
        </Button>
      </Box>

      <Box className="table-card">
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row.userId}
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
