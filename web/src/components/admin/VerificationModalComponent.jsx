import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Warning
} from '@mui/icons-material';

const VerificationModal = ({ open, onClose, beneficiary, onUpdate }) => {
  const [verificationStatus, setVerificationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!beneficiary) return null;

  const handleSubmit = async () => {
    if (!verificationStatus) {
      setError('Please select a verification status');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const isVerified = verificationStatus === 'verified';
      await onUpdate(beneficiary._id, isVerified);
      setVerificationStatus('');
    } catch (err) {
      setError('Failed to update verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVerificationStatus('');
    setError('');
    onClose();
  };

  const isExpired = new Date(beneficiary.expiryDate) < new Date();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography fontSize={20} fontWeight={700}>
          Update Verification Status
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {/* Current Status */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Box
            component="img"
            src={beneficiary.userPhoto?.url || beneficiary.avatar?.url}
            sx={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              objectFit: 'cover'
            }}
            alt={beneficiary.name}
          />
          <Box>
            <Typography fontWeight={600}>{beneficiary.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {beneficiary.idNumber}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Warnings */}
        {isExpired && (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
            This ID card has expired on {new Date(beneficiary.expiryDate).toLocaleDateString()}
          </Alert>
        )}

        {/* Verification Options */}
        <FormControl component="fieldset" sx={{ width: '100%' }}>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
            Select Verification Status
          </FormLabel>
          <RadioGroup
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value)}
          >
            <FormControlLabel
              value="verified"
              control={<Radio />}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircle color="success" />
                  <Box>
                    <Typography fontWeight={600}>Verify Beneficiary</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Approve this ID card as valid and active
                    </Typography>
                  </Box>
                </Stack>
              }
              sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}
            />
            
            <FormControlLabel
              value="unverified"
              control={<Radio />}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Cancel color="warning" />
                  <Box>
                    <Typography fontWeight={600}>Reject Verification</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Mark this ID card as invalid or require additional verification
                    </Typography>
                  </Box>
                </Stack>
              }
              sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}
            />
          </RadioGroup>
        </FormControl>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Additional Info */}
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Note:</strong> Verification changes are logged and cannot be undone. 
            Please verify all ID details before confirming.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !verificationStatus}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Updating...' : 'Confirm Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerificationModal;