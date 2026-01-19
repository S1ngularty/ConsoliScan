import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Divider,
  Chip,
  Stack,
  Paper,
  Avatar,
  Modal,
  Backdrop,
  Fade,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Badge,
  Warning,
  CheckCircle,
  Cancel,
  ZoomIn,
  ZoomOut,
  Close,
  RotateRight
} from '@mui/icons-material';

const BeneficiaryDetailModal = ({ open, onClose, beneficiary }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!beneficiary) return null;
  console.log(beneficiary.idImage)
  const handleImagePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewOpen(true);
    setZoom(1);
    setRotation(0);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewImage(null);
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const getStatusChip = (isVerified) => (
    <Chip
      icon={isVerified ? <CheckCircle /> : <Cancel />}
      label={isVerified ? 'Verified' : 'Unverified'}
      color={isVerified ? 'success' : 'warning'}
      sx={{ fontWeight: 600 }}
    />
  );

  const getDisabilityChip = (type) => {
    const colors = {
      visual: 'info',
      hearing: 'primary',
      physical: 'secondary',
      mental: 'warning',
      multiple: 'error'
    };
    
    return (
      <Chip
        label={type.charAt(0).toUpperCase() + type.slice(1)}
        color={colors[type] || 'default'}
        sx={{ fontWeight: 600 }}
      />
    );
  };

  const DetailItem = ({ icon, label, value }) => (
    <Grid item xs={12} sm={6}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{ color: 'primary.main', mt: 0.5 }}>{icon}</Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            {label}
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {value || 'N/A'}
          </Typography>
        </Box>
      </Stack>
    </Grid>
  );

  // All images that can be previewed
  const images = [
    { url: beneficiary.userPhoto?.url, label: 'Profile Photo' },
    { url: beneficiary.idImage?.front?.url, label: 'ID Card Front' },
    { url: beneficiary.idImage?.back?.url, label: 'ID Card Back' }
  ].filter(img => img.url);

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography fontSize={20} fontWeight={750}>
            Beneficiary Details
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          {/* Header Section */}
          <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={700}>
                {beneficiary.name}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                {getStatusChip(beneficiary.isVerified)}
                {getDisabilityChip(beneficiary.typeOfDisability)}
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Personal Information */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <DetailItem
                icon={<Person />}
                label="Full Name"
                value={beneficiary.name}
              />
              <DetailItem
                icon={<Email />}
                label="Email Address"
                value={beneficiary.email}
              />
              <DetailItem
                icon={<Phone />}
                label="Contact Number"
                value={beneficiary.contactNumber}
              />
              <DetailItem
                icon={<LocationOn />}
                label="Address"
                value={`${beneficiary.street || ''}, ${beneficiary.city || ''}, ${beneficiary.state || ''}, ${beneficiary.country || ''}`.trim()}
              />
              {beneficiary.sex && (
                <DetailItem
                  icon={<Person />}
                  label="Gender"
                  value={beneficiary.sex.charAt(0).toUpperCase() + beneficiary.sex.slice(1)}
                />
              )}
              {beneficiary.age && (
                <DetailItem
                  icon={<CalendarToday />}
                  label="Age"
                  value={beneficiary.age}
                />
              )}
              {beneficiary.birthDate && (
                <DetailItem
                  icon={<CalendarToday />}
                  label="Birth Date"
                  value={new Date(beneficiary.birthDate).toLocaleDateString()}
                />
              )}
            </Grid>
          </Paper>

          {/* ID Information */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              ID Card Information
            </Typography>
            <Grid container spacing={2}>
              <DetailItem
                icon={<Badge />}
                label="ID Number"
                value={beneficiary.idNumber}
              />
              <DetailItem
                icon={<CalendarToday />}
                label="Date Issued"
                value={new Date(beneficiary.dateIssued).toLocaleDateString()}
              />
              <DetailItem
                icon={<Warning />}
                label="Expiry Date"
                value={new Date(beneficiary.expiryDate).toLocaleDateString()}
              />
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  ID Card Images
                </Typography>
                <Stack direction="row" spacing={2}>
                  {beneficiary.idImage?.front?.url && (
                    <Tooltip title="Click to preview">
                      <Box
                        component="img"
                        src={beneficiary.idImage.front.url}
                        sx={{
                          width: 150,
                          height: 100,
                          objectFit: 'cover',
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            borderColor: 'primary.main'
                          }
                        }}
                        alt="ID Front"
                        onClick={() => handleImagePreview(beneficiary.idImage.front.url)}
                      />
                    </Tooltip>
                  )}
                  {beneficiary.idImage?.back?.url && (
                    <Tooltip title="Click to preview">
                      <Box
                        component="img"
                        src={beneficiary.idImage.back.url}
                        sx={{
                          width: 150,
                          height: 100,
                          objectFit: 'cover',
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            borderColor: 'primary.main'
                          }
                        }}
                        alt="ID Back"
                        onClick={() => handleImagePreview(beneficiary.idImage.back.url)}
                      />
                    </Tooltip>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* All Images Gallery */}
          {images.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                All Images ({images.length})
              </Typography>
              <Grid container spacing={2}>
                {images.map((img, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <Tooltip title={`Click to preview ${img.label}`}>
                      <Box
                        sx={{
                          position: 'relative',
                          cursor: 'pointer',
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid #e0e0e0',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 2,
                            borderColor: 'primary.main'
                          }
                        }}
                        onClick={() => handleImagePreview(img.url)}
                      >
                        <Box
                          component="img"
                          src={img.url}
                          sx={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          alt={img.label}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            p: 0.5,
                            fontSize: '0.75rem'
                          }}
                        >
                          {img.label}
                        </Box>
                      </Box>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Verification Info */}
          {beneficiary.isVerified && beneficiary.verifiedAt && (
            <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Verification Information
              </Typography>
              <Typography variant="body2">
                Verified on: {new Date(beneficiary.verifiedAt).toLocaleDateString()} at{' '}
                {new Date(beneficiary.verifiedAt).toLocaleTimeString()}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={handleClosePreview}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={previewOpen}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '800px',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 24,
              p: 1,
              outline: 'none'
            }}
          >
            {/* Controls */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              p: 1,
              bgcolor: 'rgba(0,0,0,0.8)',
              borderRadius: 1
            }}>
              <Typography variant="body2" color="white">
                Zoom: {Math.round(zoom * 100)}% | Rotation: {rotation}°
              </Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Zoom In">
                  <IconButton onClick={handleZoomIn} sx={{ color: 'white' }}>
                    <ZoomIn />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom Out">
                  <IconButton onClick={handleZoomOut} sx={{ color: 'white' }}>
                    <ZoomOut />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Rotate 90°">
                  <IconButton onClick={handleRotate} sx={{ color: 'white' }}>
                    <RotateRight />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset">
                  <IconButton onClick={handleReset} sx={{ color: 'white' }}>
                    <Close />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close">
                  <IconButton onClick={handleClosePreview} sx={{ color: 'white' }}>
                    <Close />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* Image Display */}
            <Box
              sx={{
                width: '100%',
                height: '70vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                p: 2
              }}
            >
              {previewImage && (
                <Box
                  component="img"
                  src={previewImage}
                  alt="Preview"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.3s',
                    objectFit: 'contain'
                  }}
                />
              )}
            </Box>

            {/* Image Navigation */}
            {images.length > 1 && (
              <Box sx={{ mt: 2, p: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Other Images:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 1 }}>
                  {images.map((img, index) => (
                    <Tooltip title={img.label} key={index}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: previewImage === img.url ? '2px solid' : '1px solid',
                          borderColor: previewImage === img.url ? 'primary.main' : '#e0e0e0',
                          cursor: 'pointer',
                          opacity: previewImage === img.url ? 1 : 0.7,
                          '&:hover': {
                            opacity: 1
                          }
                        }}
                        onClick={() => {
                          setPreviewImage(img.url);
                          setZoom(1);
                          setRotation(0);
                        }}
                      >
                        <Box
                          component="img"
                          src={img.url}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          alt={img.label}
                        />
                      </Box>
                    </Tooltip>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default BeneficiaryDetailModal;