import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  RefreshCw,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  X,
  Calendar,
  User,
  ShieldCheck,
  MapPin,
  Search,
} from "lucide-react";
import { fetchLogs } from "../../../services/userService";

function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    role: "",
    action: "",
    status: "",
    search: "",
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const logs = await fetchLogs();
    setLogs(logs);
    return;
  };

  const handleFilterChange = (field, value) =>
    setFilters((prev) => ({ ...prev, [field]: value }));
  const handleClearFilters = () =>
    setFilters({ role: "", action: "", status: "", search: "" });

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      return (
        (!filters.role || log.role === filters.role) &&
        (!filters.action || log.action === filters.action) &&
        (!filters.status || log.status === filters.status) &&
        (!filters.search ||
          log.description
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          log.name.toLowerCase().includes(filters.search.toLowerCase()))
      );
    });
  }, [filters, logs]);

  const getStatusStyles = (status) => {
    switch (status) {
      case "SUCCESS":
        return {
          color: "#059669",
          bg: "#ecfdf5",
          icon: <CheckCircle size={14} />,
        };
      case "FAILED":
        return { color: "#dc2626", bg: "#fef2f2", icon: <XCircle size={14} /> };
      case "WARNING":
        return {
          color: "#d97706",
          bg: "#fffbeb",
          icon: <AlertCircle size={14} />,
        };
      default:
        return { color: "#6b7280", bg: "#f3f4f6", icon: null };
    }
  };

  const getRoleColor = (role) => {
    const colors = { admin: "#ef4444", checker: "#f59e0b", user: "#3b82f6" };
    return colors[role] || "#6b7280";
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [filteredLogs, page, rowsPerPage]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f1f5f9", minHeight: "100vh" }}>
      {/* HEADER SECTION */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ color: "#0f172a", letterSpacing: "-0.5px" }}
          >
            System Audit
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            sx={{
              bgcolor: "white",
              color: "#64748b",
              border: "1px solid #e2e8f0",
            }}
            onClick={fetchData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            disableElevation
            startIcon={<Download size={18} />}
            sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
          >
            Export Logs
          </Button>
        </Stack>
      </Stack>

      {/* FILTERS SECTION */}
      <Paper
        elevation={0}
        sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid #e2e8f0" }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            size="small"
            placeholder="Search logs, users..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": { bgcolor: "white", borderRadius: 2 },
            }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange("status", e.target.value)}
                sx={{ bgcolor: "white" }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="SUCCESS">Success</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="WARNING">Warning</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                label="Role"
                onChange={(e) => handleFilterChange("role", e.target.value)}
                sx={{ bgcolor: "white" }}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="checker">Checker</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value={filters.action}
                label="Action"
                onChange={(e) => handleFilterChange("action", e.target.value)}
                sx={{ bgcolor: "white" }}
              >
                {/* User actions */}
                <MenuItem value="LOGIN">Login</MenuItem>
                <MenuItem value="LOGOUT">Logout</MenuItem>
                <MenuItem value="CREATE_USER">Create User</MenuItem>
                <MenuItem value="UPDATE_USER">Update User</MenuItem>
                <MenuItem value="DELETE_USER">Delete User</MenuItem>
                <MenuItem value="UPDATE_PROFILE">Update Profile</MenuItem>
                <MenuItem value="VALIDATE_USER_MEMBERSHIP_ID">
                  Validate User Membership ID
                </MenuItem>
                <MenuItem value="CHANGE_PERMISSION">Change Permission</MenuItem>
                {/* Product actions */}
                <MenuItem value="CREATE_PRODUCT">Create Product</MenuItem>
                <MenuItem value="UPDATE_PRODUCT">Update Product</MenuItem>
                <MenuItem value="DELETE_PRODUCT">Delete Product</MenuItem>
                <MenuItem value="TEMPORARY_DELETE">Temporary Delete</MenuItem>
                <MenuItem value="PERMANENT_DELETE">Permanent Delete</MenuItem>
                <MenuItem value="RESTORE_PRODUCT">Restore Product</MenuItem>
                {/* Category actions */}
                <MenuItem value="CREATE_CATEGORY">Create Category</MenuItem>
                <MenuItem value="UPDATE_CATEGORY">Update Category</MenuItem>
                <MenuItem value="DELETE_CATEGORY">Delete Category</MenuItem>
                {/* Discount actions */}
                <MenuItem value="CREATE_DISCOUNT">Create Discount</MenuItem>
                <MenuItem value="UPDATE_DISCOUNT">Update Discount</MenuItem>
                <MenuItem value="DELETE_DISCOUNT">Delete Discount</MenuItem>
              </Select>
            </FormControl>
            {Object.values(filters).some((v) => v) && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<X size={16} />}
                onClick={handleClearFilters}
                sx={{ height: "40px" }}
              >
                Clear
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* DATA TABLE SECTION */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          mb: 2,
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                  }}
                >
                  User Identity
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                  }}
                >
                  Activity
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                  }}
                >
                  Description
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                  }}
                >
                  Logged At
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.map((log) => {
                const statusStyle = getStatusStyles(log.status);
                const roleColor = getRoleColor(log.role);
                return (
                  <TableRow
                    key={log.activityLogId}
                    hover
                    sx={{
                      "&:hover": { bgcolor: "#f1f5f9" },
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSelectedLog(log);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            fontSize: 14,
                            fontWeight: 700,
                            bgcolor: `${roleColor}20`,
                            color: roleColor,
                            border: `1px solid ${roleColor}40`,
                          }}
                        >
                          {log.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {log.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action.replace("_", " ")}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ opacity: 0.9 }}
                      >
                        {log.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={statusStyle.icon}
                        label={log.status}
                        size="small"
                        sx={{
                          bgcolor: statusStyle.bg,
                          color: statusStyle.color,
                          fontWeight: 700,
                          borderRadius: "6px",
                          "& .MuiChip-icon": { color: "inherit" },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        color="text.secondary"
                      >
                        <Calendar size={14} />
                        <Typography variant="caption" fontWeight={500}>
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            timeZone: "Asia/Shanghai",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <Eye size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: "1px solid #e2e8f0" }}
        />
      </Paper>

      {/* SUMMARY */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: "center", mt: 2 }}
      >
        Showing {paginatedLogs.length} of {filteredLogs.length} logs
        {Object.values(filters).some((v) => v) && " (filtered)"}
      </Typography>

      {/* DETAIL DIALOG */}
      <Dialog
        open={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontSize={20} fontWeight={800}>
            Event Details
          </Typography>
          <IconButton onClick={() => setIsDetailDialogOpen(false)}>
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 3, p: 2, bgcolor: "#f8fafc", borderRadius: 3 }}
              >
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: getRoleColor(selectedLog.role),
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {selectedLog.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {selectedLog.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedLog.email}
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={2}>
                <DetailItem
                  icon={<ShieldCheck size={16} />}
                  label="Permission Role"
                  value={selectedLog.role}
                  capitalize
                />
                <DetailItem
                  icon={<Calendar size={16} />}
                  label="Exact Timestamp"
                  value={new Date(selectedLog.timestamp).toLocaleString()}
                />
                <DetailItem
                  icon={<RefreshCw size={16} />}
                  label="Trigger Action"
                  value={selectedLog.action}
                />
              </Grid>

              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  border: "1px dashed #e2e8f0",
                  borderRadius: 3,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                >
                  FULL SYSTEM DESCRIPTION
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>
                  {selectedLog.description}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setIsDetailDialogOpen(false)}
            fullWidth
            variant="contained"
            sx={{
              borderRadius: 2,
              bgcolor: "#0f172a",
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Helper component for Dialog
const DetailItem = ({ icon, label, value, capitalize }) => (
  <Grid item xs={6}>
    <Stack spacing={0.5}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        color="text.secondary"
      >
        {icon}
        <Typography variant="caption" fontWeight={700}>
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ textTransform: capitalize ? "capitalize" : "none" }}
      >
        {value}
      </Typography>
    </Stack>
  </Grid>
);

export default ActivityLogs;
