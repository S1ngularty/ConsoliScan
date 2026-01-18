import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Stack,
  Chip
} from '@mui/material';
import {
  X,
  Package,
  TrendingUp,
  TrendingDown,
  Save,
  RotateCcw
} from 'lucide-react';
import { updateStock } from '../../services/productService';

const StockUpdateModal = ({ open, data, onClose, onSave }) => {
  const [stock, setStock] = useState('');
  const [error, setError] = useState('');
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    if (data) {
      setStock(data.stockQuantity?.toString() || '');
      setError('');
      setIsModified(false);
    }
  }, [data]);

  const handleStockChange = (e) => {
    const value = e.target.value;
    
    // Allow only numbers
    if (value === '' || /^\d+$/.test(value)) {
      setStock(value);
      setIsModified(true);
      setError('');
    }
  };

  const handleSave =async () => {
    if (stock === '') {
      setError('Stock quantity is required');
      return;
    }

    const newStock = parseInt(stock, 10);
    
    if (newStock < 0) {
      setError('Stock cannot be negative');
      return;
    }

    if (newStock > 1000000) {
      setError('Stock quantity is too large');
      return;
    }

    const stockDiff = newStock - (parseInt(data.stockQuantity) || 0);

    try {
        const result = await updateStock(newStock,data._id)
    } catch (error) {
        
    }
    
    onSave();
  };

  const handleReset = () => {
    setStock(data.stockQuantity?.toString() || '');
    setError('');
    setIsModified(false);
  };

  const handleClose = () => {
    if (isModified) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!data) return null;

  const handleSuggestStock= (num)=>{
    setStock((prevStock) => (parseInt(prevStock || 0) + parseInt(num)).toString())
    setIsModified(true)
  }

  const previousStock = parseInt(data.stockQuantity) || 0;
  const newStock = parseInt(stock) || 0;
  const stockDiff = newStock - previousStock;
  const stockChangePercent = previousStock > 0 
    ? ((stockDiff / previousStock) * 100).toFixed(1)
    : stockDiff > 0 ? 'New' : '0';

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Package size={24} />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Update Stock Level
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Product: {data.name}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={handleClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Product Info */}
        <Box sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: '#f8fafc', 
          borderRadius: 2,
          border: '1px solid #e2e8f0'
        }}>
          <Stack spacing={1}>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {data.name}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip 
                label={`SKU: ${data.sku || 'N/A'}`} 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={`Category: ${data.category || 'N/A'}`}
                size="small" 
                variant="outlined"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Current location: {data.location || 'Warehouse'}
            </Typography>
          </Stack>
        </Box>

        {/* Current Stock Display */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
            CURRENT STOCK LEVEL
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2,
            bgcolor: '#f1f5f9',
            borderRadius: 2
          }}>
            <Typography variant="h4" fontWeight={700} color="#3b82f6">
              {previousStock.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              units available
            </Typography>
          </Box>
        </Box>

        {/* Stock Input */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
            UPDATE TO NEW STOCK LEVEL
          </Typography>
          <TextField
            fullWidth
            type="text"
            inputMode="numeric"
            value={stock}
            onChange={handleStockChange}
            placeholder="Enter new stock quantity"
            error={!!error}
            helperText={error}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography variant="body2" color="text.secondary">
                    Units:
                  </Typography>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="body2" color="text.secondary">
                    units
                  </Typography>
                </InputAdornment>
              ),
              sx: { 
                fontSize: '1.125rem',
                fontWeight: 600,
                bgcolor: 'white'
              }
            }}
            sx={{ mb: 2 }}
          />

          {/* Quick Action Buttons */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleSuggestStock(10)}
              sx={{ borderRadius: 2 }}
            >
              +10
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleSuggestStock(50)}
              sx={{ borderRadius: 2 }}
            >
              +50
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleSuggestStock(100)}
              sx={{ borderRadius: 2 }}
            >
              +100
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleSuggestStock(1000)}
              sx={{ borderRadius: 2 }}
            >
              1000
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleReset}
              startIcon={<RotateCcw size={14} />}
              sx={{ borderRadius: 2 }}
            >
              Reset
            </Button>
          </Stack>
        </Box>

        {/* Change Summary */}
        {isModified && stock !== '' && !error && (
          <Alert 
            severity={stockDiff > 0 ? 'success' : stockDiff < 0 ? 'warning' : 'info'}
            icon={stockDiff > 0 ? <TrendingUp /> : stockDiff < 0 ? <TrendingDown /> : null}
            sx={{ 
              borderRadius: 2,
              alignItems: 'center'
            }}
          >
            <Stack spacing={0.5}>
              <Typography variant="body2" fontWeight={600}>
                Stock Change Summary
              </Typography>
              <Stack direction="row" spacing={3} alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Change
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color={stockDiff > 0 ? 'success.main' : stockDiff < 0 ? 'warning.main' : 'text.primary'}>
                    {stockDiff > 0 ? '+' : ''}{stockDiff.toLocaleString()} units
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Percentage
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {stockChangePercent === 'New' ? 'New Stock' : `${stockChangePercent}%`}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    New Total
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="#3b82f6">
                    {newStock.toLocaleString()} units
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            minWidth: 100
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save size={18} />}
          disabled={!isModified || !!error || stock === ''}
          sx={{ 
            borderRadius: 2,
            minWidth: 120,
            bgcolor: '#3b82f6',
            '&:hover': {
              bgcolor: '#2563eb'
            }
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};


export default StockUpdateModal;