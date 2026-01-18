import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarQuickFilter
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
  Rating,
  Select,
  InputLabel,
  FormControl,
  MenuItem,
  Card,
  CardContent,
  Divider
} from "@mui/material";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  Filter,
  Search,
  X,
  User,
  Package,
  Calendar,
  AlertTriangle,
  Download
} from "lucide-react";

import "../../../styles/admin/product/ProductReviews.css";
import Toast from "../../../components/common/SnackbarComponent";

// Mock data generator
const generateMockReviews = (count = 60) => {
  const products = ["Wireless Headphones", "Smart Watch", "Laptop", "Coffee Maker", "Yoga Mat", "Backpack"];
  const statuses = ["Pending", "Approved", "Rejected", "Spam"];
  const ratings = [1, 2, 3, 4, 5];
  
  const reviews = [];
  
  for (let i = 0; i < count; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const rating = ratings[Math.floor(Math.random() * ratings.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const helpful = Math.floor(Math.random() * 50);
    const notHelpful = Math.floor(Math.random() * 10);
    const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    
    const reviewsText = [
      "Great product, very happy with my purchase!",
      "Average quality, could be better for the price.",
      "Absolutely love it! Would buy again.",
      "Not as described, disappointed.",
      "Fast shipping and good quality.",
      "Product stopped working after 2 weeks.",
      "Excellent value for money.",
      "The product is okay, nothing special.",
      "Best purchase I've made this year!",
      "Would not recommend to others."
    ];
    
    reviews.push({
      _id: `review_${i + 1}`,
      productId: `product_${Math.floor(Math.random() * 20) + 1}`,
      productName: product,
      userId: `user_${Math.floor(Math.random() * 50) + 1}`,
      userName: `Customer ${i + 1}`,
      userEmail: `customer${i + 1}@example.com`,
      rating,
      title: `Review for ${product}`,
      comment: reviewsText[Math.floor(Math.random() * reviewsText.length)],
      helpfulCount: helpful,
      notHelpfulCount: notHelpful,
      status,
      isVerified: Math.random() > 0.5,
      reportedCount: status === "Spam" ? Math.floor(Math.random() * 5) + 1 : 0,
      createdAt: createdAt.toISOString(),
      updatedAt: new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

function ProductReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    rating: "",
    search: "",
    verified: ""
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState("");

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
      setReviews(generateMockReviews(60));
      setLoading(false);
    }, 1000);
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setReviews(generateMockReviews(60));
      setLoading(false);
      showToast("Reviews refreshed", "info");
    }, 1000);
  };

  const handleClearFilters = () => {
    setFilters({
      status: "",
      rating: "",
      search: "",
      verified: ""
    });
  };

  const handleReviewAction = (action, reviewId) => {
    setActionType(action);
    setSelectedReview(reviews.find(r => r._id === reviewId));
    setIsActionDialogOpen(true);
  };

  const confirmAction = () => {
    let message = "";
    
    switch(actionType) {
      case "approve":
        message = "Review approved successfully";
        break;
      case "reject":
        message = "Review rejected successfully";
        break;
      case "delete":
        message = "Review deleted successfully";
        break;
      default:
        message = "Action completed";
    }
    
    // Update review status
    setReviews(prev => prev.map(review => 
      review._id === selectedReview._id 
        ? { ...review, status: actionType === "approve" ? "Approved" : actionType === "reject" ? "Rejected" : review.status }
        : review
    ));
    
    if (actionType === "delete") {
      setReviews(prev => prev.filter(review => review._id !== selectedReview._id));
    }
    
    showToast(message, "success");
    setIsActionDialogOpen(false);
    setSelectedReview(null);
    setActionType("");
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return '#f59e0b';
      case 'Approved': return '#00A86B';
      case 'Rejected': return '#ef4444';
      case 'Spam': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending': return <AlertTriangle size={16} />;
      case 'Approved': return <CheckCircle size={16} />;
      case 'Rejected': return <XCircle size={16} />;
      case 'Spam': return <Flag size={16} />;
      default: return null;
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      return (
        (!filters.status || review.status === filters.status) &&
        (!filters.rating || review.rating.toString() === filters.rating) &&
        (!filters.verified || 
          (filters.verified === "verified" && review.isVerified) ||
          (filters.verified === "not-verified" && !review.isVerified)) &&
        (!filters.search || 
          review.productName.toLowerCase().includes(filters.search.toLowerCase()) ||
          review.userName.toLowerCase().includes(filters.search.toLowerCase()) ||
          review.comment.toLowerCase().includes(filters.search.toLowerCase()))
      );
    });
  }, [reviews, filters]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'Pending').length;
    const approved = reviews.filter(r => r.status === 'Approved').length;
    const rejected = reviews.filter(r => r.status === 'Rejected').length;
    const spam = reviews.filter(r => r.status === 'Spam').length;
    const averageRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;
    const verified = reviews.filter(r => r.isVerified).length;

    return {
      total,
      pending,
      approved,
      rejected,
      spam,
      averageRating,
      verified,
      totalRating: reviews.reduce((sum, r) => sum + r.rating, 0)
    };
  }, [reviews]);

  const columns = [
    {
      field: "review",
      headerName: "Review",
      flex: 2,
      minWidth: 300,
      renderCell: ({ row }) => (
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Avatar sx={{ bgcolor: '#f0fdf4', color: '#00A86B', mt: 0.5 }}>
            <MessageSquare size={20} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} color="#111827">
              {row.productName}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Rating value={row.rating} size="small" readOnly />
              <Typography variant="caption" color="#6b7280">
                {row.rating}/5
              </Typography>
            </Box>
            <Typography variant="body2" color="#4b5563" sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {row.comment}
            </Typography>
            {row.isVerified && (
              <Chip
                label="Verified Purchase"
                size="small"
                sx={{
                  mt: 0.5,
                  bgcolor: '#ecfdf5',
                  color: '#00A86B',
                  fontSize: '0.7rem',
                  height: '20px'
                }}
              />
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: "user",
      headerName: "Customer",
      flex: 1,
      minWidth: 150,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {row.userName}
          </Typography>
          <Typography variant="caption" color="#6b7280">
            {row.userEmail}
          </Typography>
        </Box>
      ),
    },
    {
      field: "rating",
      headerName: "Rating",
      flex: 0.8,
      minWidth: 100,
      renderCell: ({ value }) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Star size={16} color="#fbbf24" fill="#fbbf24" />
          <Typography variant="body2" fontWeight={600}>
            {value}
          </Typography>
        </Box>
      ),
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
            label={value}
            size="small"
            icon={getStatusIcon(value)}
            sx={{
              bgcolor: color + '15',
              color: color,
              fontWeight: 600,
              fontSize: '0.75rem'
            }}
          />
        );
      },
    },
    {
      field: "helpful",
      headerName: "Helpful",
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ row }) => (
        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <ThumbsUp size={14} color="#00A86B" />
            <Typography variant="body2">{row.helpfulCount}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <ThumbsDown size={14} color="#ef4444" />
            <Typography variant="body2">{row.notHelpfulCount}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "createdAt",
      headerName: "Date",
      flex: 0.8,
      minWidth: 120,
      valueGetter: (params) => {
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.2,
      minWidth: 180,
      sortable: false,
      renderCell: ({ row }) => (
        <Box display="flex" gap={1}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              className="action-btn view"
              onClick={() => {
                setSelectedReview(row);
                setIsDetailDialogOpen(true);
              }}
            >
              <Eye size={18} />
            </IconButton>
          </Tooltip>
          {row.status === "Pending" && (
            <>
              <Tooltip title="Approve">
                <IconButton
                  size="small"
                  className="action-btn approve"
                  onClick={() => handleReviewAction("approve", row._id)}
                >
                  <CheckCircle size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton
                  size="small"
                  className="action-btn reject"
                  onClick={() => handleReviewAction("reject", row._id)}
                >
                  <XCircle size={18} />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Tooltip title="Delete">
            <IconButton
              size="small"
              className="action-btn delete"
              onClick={() => handleReviewAction("delete", row._id)}
            >
              <Trash2 size={18} />
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
          fileName: `reviews-${new Date().toISOString().split('T')[0]}`,
        }}
      />
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarQuickFilter 
        placeholder="Search reviews..." 
        value={filters.search}
        onChange={(e) => handleFilterChange('search', e.target.value)}
        sx={{ 
          '& .MuiInputBase-root': {
            height: '40px',
            width: '250px'
          }
        }}
      />
    </GridToolbarContainer>
  );

  return (
    <Box className="product-reviews-container">
      {/* Review Detail Dialog */}
      <Dialog 
        open={isDetailDialogOpen} 
        onClose={() => setIsDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <MessageSquare size={24} color="#00A86B" />
            <Typography variant="h6">
              Review Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Stack spacing={3}>
              {/* Review Content */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Review Content
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Product:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedReview.productName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Rating:</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Rating value={selectedReview.rating} readOnly />
                      <Typography variant="body2" fontWeight={600}>
                        {selectedReview.rating} out of 5
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Title:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedReview.title}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Comment:</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {selectedReview.comment}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Customer Info */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Customer Information
                </Typography>
                <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Name:</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedReview.userName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Email:</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedReview.userEmail}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Purchase Status:</Typography>
                    <Chip
                      label={selectedReview.isVerified ? "Verified Purchase" : "Not Verified"}
                      size="small"
                      sx={{
                        bgcolor: selectedReview.isVerified ? '#ecfdf5' : '#f3f4f6',
                        color: selectedReview.isVerified ? '#00A86B' : '#6b7280',
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Helpful Votes:</Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <ThumbsUp size={16} color="#00A86B" />
                        <Typography variant="body2" fontWeight={600}>
                          {selectedReview.helpfulCount}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <ThumbsDown size={16} color="#ef4444" />
                        <Typography variant="body2" fontWeight={600}>
                          {selectedReview.notHelpfulCount}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {/* Review Metadata */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Review Metadata
                </Typography>
                <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Status:</Typography>
                    <Chip
                      label={selectedReview.status}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(selectedReview.status) + '15',
                        color: getStatusColor(selectedReview.status),
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Reported:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedReview.reportedCount} times
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Created:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(selectedReview.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Last Updated:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(selectedReview.updatedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setIsDetailDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog 
        open={isActionDialogOpen} 
        onClose={() => setIsActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === "approve" && "Approve Review"}
          {actionType === "reject" && "Reject Review"}
          {actionType === "delete" && "Delete Review"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            Are you sure you want to {actionType} this review?
            {actionType === "delete" && " This action cannot be undone."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setIsActionDialogOpen(false)}
            startIcon={<X size={18} />}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmAction}
            startIcon={
              actionType === "approve" ? <CheckCircle size={18} /> :
              actionType === "reject" ? <XCircle size={18} /> :
              <Trash2 size={18} />
            }
            className={
              actionType === "approve" ? "approve-btn" :
              actionType === "reject" ? "reject-btn" :
              "delete-btn"
            }
          >
            {actionType === "approve" ? "Approve" :
             actionType === "reject" ? "Reject" :
             "Delete"}
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
      <Box className="reviews-header">
        <Box>
          <Typography variant="h5" fontWeight={700} color="#111827">
            Product Reviews
          </Typography>
          <Typography variant="body2" color="#6b7280">
            Manage and moderate customer reviews
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

      {/* Stats Cards */}
      <Box className="reviews-stats">
        <Card className="stat-card">
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: '#f0fdf4', color: '#00A86B' }}>
                <MessageSquare size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  Total Reviews
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: '#f0fdf4', color: '#00A86B' }}>
                <Star size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {stats.averageRating}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  Average Rating
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: '#fef3c7', color: '#92400e' }}>
                <AlertTriangle size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#92400e">
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  Pending
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: '#ecfdf5', color: '#00A86B' }}>
                <CheckCircle size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#00A86B">
                  {stats.approved}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  Approved
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
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
              <MenuItem value="Spam">Spam</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Rating</InputLabel>
            <Select
              value={filters.rating}
              label="Rating"
              onChange={(e) => handleFilterChange('rating', e.target.value)}
            >
              <MenuItem value="">All Ratings</MenuItem>
              <MenuItem value="1">1 Star</MenuItem>
              <MenuItem value="2">2 Stars</MenuItem>
              <MenuItem value="3">3 Stars</MenuItem>
              <MenuItem value="4">4 Stars</MenuItem>
              <MenuItem value="5">5 Stars</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Verified</InputLabel>
            <Select
              value={filters.verified}
              label="Verified"
              onChange={(e) => handleFilterChange('verified', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="verified">Verified Only</MenuItem>
              <MenuItem value="not-verified">Not Verified</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            size="small"
            startIcon={<X size={16} />}
            onClick={handleClearFilters}
            disabled={!Object.values(filters).some(val => val)}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Data Table */}
      <Box className="table-card">
        <DataGrid
          rows={filteredReviews}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          slots={{
            toolbar: CustomToolbar,
          }}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
            sorting: {
              sortModel: [{ field: 'createdAt', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: "none",
            '& .MuiDataGrid-virtualScroller': {
              minHeight: '400px'
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: "#f9fafb",
              borderBottom: '1px solid #e5e7eb',
              color: "#4b5563",
              fontWeight: 700,
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f3f4f6',
              '&:focus': { outline: "none" }
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: '#f9fafb'
              }
            }
          }}
        />
      </Box>

      {/* Summary */}
      <Box className="summary-footer">
        <Typography variant="body2" color="#6b7280">
          Showing {filteredReviews.length} of {reviews.length} reviews
          {Object.values(filters).some(val => val) && ' (filtered)'}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            label={`${stats.pending} pending`}
            size="small"
            sx={{ bgcolor: '#fef3c7', color: '#92400e' }}
          />
          <Chip
            label={`${stats.verified} verified`}
            size="small"
            sx={{ bgcolor: '#ecfdf5', color: '#00A86B' }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default ProductReviews;