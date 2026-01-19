import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Search,
  FilterAlt,
  CheckCircle,
  Cancel,
  Edit,
  Visibility,
  Person,
  Badge,
  CalendarToday,
  Warning,
} from "@mui/icons-material";
import * as beneficiaryService from "../../../services/userService";
import BeneficiaryDetailModal from "../../../components/admin/BeneficiaryDetailModal";
import VerificationModal from "../../../components/admin/VerificationModalComponent";
import Toast from "../../../components/common/SnackbarComponent";

const BeneficiaryManagement = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [disabilityFilter, setDisabilityFilter] = useState("all");

  // Modal states
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
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
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      const data = await beneficiaryService.fetchBeneficiaries();
      setBeneficiaries(data);
      setError("");
    } catch (err) {
      setError("Failed to fetch beneficiaries");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setDetailModalOpen(true);
  };

  const handleEditVerification = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setVerificationModalOpen(true);
  };

  const handleVerificationUpdate = async (id, isVerified) => {
    try {
      console.log(id, isVerified);
      await beneficiaryService.verificationRequest(id, { isVerified });
      setBeneficiaries((prev) =>
        prev.map((b) =>
          b._id === id
            ? { ...b, isVerified, verifiedAt: isVerified ? new Date() : null }
            : b,
        ),
      );
      setVerificationModalOpen(false);
      showToast(`Successfully ${!isVerified ?? "un"}verified`, "success");
    } catch (err) {
      console.error("Failed to update verification:", err);
      showToast("Something went Wrong, please try again.", "error");
    }
  };

  const filteredBeneficiaries = beneficiaries.filter((beneficiary) => {
    const matchesSearch =
      search === "" ||
      beneficiary.name?.toLowerCase().includes(search.toLowerCase()) ||
      beneficiary.idNumber?.toLowerCase().includes(search.toLowerCase()) ||
      beneficiary.email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "verified" && beneficiary.isVerified) ||
      (statusFilter === "unverified" && !beneficiary.isVerified);

    const matchesDisability =
      disabilityFilter === "all" ||
      beneficiary.typeOfDisability === disabilityFilter;

    return matchesSearch && matchesStatus && matchesDisability;
  });

  const paginatedData = filteredBeneficiaries.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const getStatusChip = (isVerified) => (
    <Chip
      icon={isVerified ? <CheckCircle /> : <Cancel />}
      label={isVerified ? "Verified" : "Unverified"}
      color={isVerified ? "success" : "warning"}
      size="small"
      variant="outlined"
    />
  );

  const getDisabilityChip = (type) => {
    const colors = {
      visual: "info",
      hearing: "primary",
      physical: "secondary",
      mental: "warning",
      multiple: "error",
    };

    return (
      <Chip
        label={type.charAt(0).toUpperCase() + type.slice(1)}
        color={colors[type] || "default"}
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Toast
        open={snackbar.open}
        handleClose={closeToast}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Beneficiary Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and verify disability identification cards
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            size="small"
            placeholder="Search by name, ID number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Verification Status</InputLabel>
            <Select
              value={statusFilter}
              label="Verification Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="unverified">Unverified</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Disability Type</InputLabel>
            <Select
              value={disabilityFilter}
              label="Disability Type"
              onChange={(e) => setDisabilityFilter(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="visual">Visual</MenuItem>
              <MenuItem value="hearing">Hearing</MenuItem>
              <MenuItem value="physical">Physical</MenuItem>
              <MenuItem value="mental">Mental</MenuItem>
              <MenuItem value="multiple">Multiple</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<FilterAlt />}
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setDisabilityFilter("all");
            }}
          >
            Clear Filters
          </Button>
        </Stack>
      </Paper>

      {/* Stats Summary */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1, textAlign: "center" }}>
          <Typography variant="h6">{beneficiaries.length}</Typography>
          <Typography variant="body2" color="text.secondary">
            Total Beneficiaries
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: "center" }}>
          <Typography variant="h6" color="success.main">
            {beneficiaries.filter((b) => b.isVerified).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verified
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: "center" }}>
          <Typography variant="h6" color="warning.main">
            {beneficiaries.filter((b) => !b.isVerified).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pending Verification
          </Typography>
        </Paper>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Member</TableCell>
              <TableCell>ID Details</TableCell>
              <TableCell>Disability Type</TableCell>
              <TableCell>Verification Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No beneficiaries found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((beneficiary) => (
                <TableRow key={beneficiary._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        component="img"
                        src={
                          beneficiary.userPhoto?.url || beneficiary.avatar?.url
                        }
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #e0e0e0",
                        }}
                        alt={beneficiary.name}
                      />
                      <Box>
                        <Typography fontWeight={600}>
                          {beneficiary.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {beneficiary.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">
                        <Badge fontSize="small" sx={{ mr: 1 }} />
                        ID: {beneficiary.idNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <CalendarToday fontSize="inherit" sx={{ mr: 0.5 }} />
                        Expires:{" "}
                        {new Date(beneficiary.expiryDate).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {getDisabilityChip(beneficiary.typeOfDisability)}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(beneficiary.isVerified)}
                    {beneficiary.verifiedAt && (
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        {new Date(beneficiary.verifiedAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewDetails(beneficiary)}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        color={beneficiary.isVerified ? "warning" : "success"}
                        onClick={() => handleEditVerification(beneficiary)}
                      >
                        <Edit />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredBeneficiaries.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Modals */}
      <BeneficiaryDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        beneficiary={selectedBeneficiary}
      />

      <VerificationModal
        open={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        beneficiary={selectedBeneficiary}
        onUpdate={handleVerificationUpdate}
      />
    </Box>
  );
};

export default BeneficiaryManagement;
