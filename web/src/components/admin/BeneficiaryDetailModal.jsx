import React, { useState, useRef, useEffect } from "react";
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
  Tooltip,
} from "@mui/material";
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
  RotateRight,
  Elderly,
  AccessibilityNew,
  ChevronLeft,
  ChevronRight,
  Fullscreen,
  FullscreenExit,
} from "@mui/icons-material";

const BeneficiaryDetailModal = ({ open, onClose, beneficiary }) => {
  if (!beneficiary) return null;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // All images that can be previewed
  const images = [
    { url: beneficiary.userPhoto?.url, label: "Profile Photo" },
    { url: beneficiary.avatar?.url, label: "Avatar" },
    { url: beneficiary.idImage?.front?.url, label: "ID Card Front" },
    { url: beneficiary.idImage?.back?.url, label: "ID Card Back" },
  ].filter((img) => img.url);

  const handleImagePreview = (index) => {
    setCurrentImageIndex(index);
    setPreviewOpen(true);
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Calculate bounds to prevent dragging beyond image edges
      const containerWidth = containerRef.current?.clientWidth || 0;
      const containerHeight = containerRef.current?.clientHeight || 0;
      const imageWidth = imageRef.current?.clientWidth || 0;
      const imageHeight = imageRef.current?.clientHeight || 0;

      const maxX = Math.max(0, (imageWidth * zoom - containerWidth) / 2);
      const maxY = Math.max(0, (imageHeight * zoom - containerHeight) / 2);

      const boundedX = Math.max(-maxX, Math.min(maxX, newX));
      const boundedY = Math.max(-maxY, Math.min(maxY, newY));

      setImagePosition({ x: boundedX, y: boundedY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.25 : 0.25;
      setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewOpen) return;

      switch (e.key) {
        case "ArrowLeft":
          prevImage();
          break;
        case "ArrowRight":
          nextImage();
          break;
        case "Escape":
          handleClosePreview();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "0":
          handleReset();
          break;
        case "r":
        case "R":
          handleRotate();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewOpen]);

  const getStatusChip = (isVerified) => (
    <Chip
      icon={isVerified ? <CheckCircle /> : <Cancel />}
      label={isVerified ? "Verified" : "Unverified"}
      color={isVerified ? "success" : "warning"}
      sx={{ fontWeight: 600 }}
    />
  );

  const getTypeChip = (type) => {
    const config = {
      pwd: {
        label: "PWD",
        color: "primary",
        icon: <AccessibilityNew />,
      },
      senior: {
        label: "Senior Citizen",
        color: "secondary",
        icon: <Elderly />,
      },
    };

    const cfg = config[type] || { label: type, color: "default" };

    return (
      <Chip
        icon={cfg.icon}
        label={cfg.label}
        color={cfg.color}
        sx={{ fontWeight: 600 }}
      />
    );
  };

  const getDisabilityChip = (type, idType) => {
    if (idType === "senior") {
      return (
        <Chip
          label="Senior Citizen"
          color="secondary"
          sx={{ fontWeight: 600 }}
        />
      );
    }

    const colors = {
      visual: "info",
      hearing: "primary",
      physical: "secondary",
      mental: "warning",
      multiple: "error",
    };

    return (
      <Chip
        label={
          type ? type.charAt(0).toUpperCase() + type.slice(1) : "Not Specified"
        }
        color={colors[type] || "default"}
        sx={{ fontWeight: 600 }}
      />
    );
  };

  const DetailItem = ({ icon, label, value }) => (
    <Grid  sm={6}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{ color: "primary.main", mt: 0.5 }}>{icon}</Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            {label}
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {value || "N/A"}
          </Typography>
        </Box>
      </Stack>
    </Grid>
  );

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography fontSize={20} fontWeight={700}>
            Beneficiary Details
          </Typography>
        </DialogTitle>

        <DialogContent>
          {/* Header Section */}
          <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
            <Tooltip title="Click to preview">
              <Avatar
                src={beneficiary.userPhoto?.url || beneficiary.avatar?.url}
                sx={{
                  width: 80,
                  height: 80,
                  cursor: "pointer",
                  "&:hover": {
                    transform: "scale(1.05)",
                    transition: "transform 0.2s",
                  },
                }}
                onClick={() => handleImagePreview(0)}
              />
            </Tooltip>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={700}>
                {beneficiary.name}
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mt: 1 }}
              >
                {getStatusChip(beneficiary.isVerified)}
                {getTypeChip(beneficiary.idType)}
                {getDisabilityChip(
                  beneficiary.typeOfDisability,
                  beneficiary.idType,
                )}
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
                value={`${beneficiary.street || ""}, ${beneficiary.city || ""}, ${
                  beneficiary.state || ""
                }, ${beneficiary.country || ""}`.trim()}
              />
              {beneficiary.sex && (
                <DetailItem
                  icon={<Person />}
                  label="Gender"
                  value={
                    beneficiary.sex.charAt(0).toUpperCase() +
                    beneficiary.sex.slice(1)
                  }
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
              {beneficiary.expiryDate ? (
                <DetailItem
                  icon={<Warning />}
                  label="Expiry Date"
                  value={new Date(beneficiary.expiryDate).toLocaleDateString()}
                />
              ) : (
                <Grid sm={6}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ color: "secondary.main", mt: 0.5 }}>
                      <Elderly />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Expiry Date
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight={500}
                        color="secondary"
                      >
                        No expiry (Senior Citizen ID)
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              )}
              <Grid >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  gutterBottom
                >
                  ID Card Images (Click to preview)
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
                          objectFit: "cover",
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                          cursor: "pointer",
                          transition: "transform 0.2s",
                          "&:hover": {
                            transform: "scale(1.05)",
                            borderColor: "primary.main",
                          },
                        }}
                        alt="ID Front"
                        onClick={() => handleImagePreview(2)}
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
                          objectFit: "cover",
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                          cursor: "pointer",
                          transition: "transform 0.2s",
                          "&:hover": {
                            transform: "scale(1.05)",
                            borderColor: "primary.main",
                          },
                        }}
                        alt="ID Back"
                        onClick={() => handleImagePreview(3)}
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
                Image Gallery ({images.length})
              </Typography>
              <Grid container spacing={2}>
                {images.map((img, index) => (
                  <Grid sm={3} key={index}>
                    <Tooltip title={`Click to preview ${img.label}`}>
                      <Box
                        sx={{
                          position: "relative",
                          cursor: "pointer",
                          borderRadius: 1,
                          overflow: "hidden",
                          border: "1px solid #e0e0e0",
                          transition: "all 0.2s",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: 2,
                            borderColor: "primary.main",
                          },
                        }}
                        onClick={() => handleImagePreview(index)}
                      >
                        <Box
                          component="img"
                          src={img.url}
                          sx={{
                            width: "100%",
                            height: 120,
                            objectFit: "cover",
                            display: "block",
                          }}
                          alt={img.label}
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            bgcolor: "rgba(0,0,0,0.7)",
                            color: "white",
                            p: 0.5,
                            fontSize: "0.75rem",
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
            <Paper sx={{ p: 2, bgcolor: "success.light" }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Verification Information
              </Typography>
              <Typography variant="body2">
                Verified on:{" "}
                {new Date(beneficiary.verifiedAt).toLocaleDateString()} at{" "}
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

      {/* Enhanced Image Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={handleClosePreview}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Fade in={previewOpen}>
          <Box
            ref={containerRef}
            sx={{
              position: "relative",
              width: "90vw",
              height: "90vh",
              bgcolor: "rgba(0, 0, 0, 0.9)",
              borderRadius: 1,
              overflow: "hidden",
              outline: "none",
              cursor: zoom > 1 ? "grab" : "default",
              "&:active": {
                cursor: zoom > 1 ? "grabbing" : "default",
              },
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <IconButton
                  onClick={prevImage}
                  sx={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "white",
                    bgcolor: "rgba(0, 0, 0, 0.5)",
                    "&:hover": { bgcolor: "rgba(0, 0, 0, 0.7)" },
                  }}
                >
                  <ChevronLeft fontSize="large" />
                </IconButton>
                <IconButton
                  onClick={nextImage}
                  sx={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "white",
                    bgcolor: "rgba(0, 0, 0, 0.5)",
                    "&:hover": { bgcolor: "rgba(0, 0, 0, 0.7)" },
                  }}
                >
                  <ChevronRight fontSize="large" />
                </IconButton>
              </>
            )}

            {/* Image Display */}
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                p: 2,
              }}
            >
              {images[currentImageIndex] && (
                <Box
                  ref={imageRef}
                  component="img"
                  src={images[currentImageIndex].url}
                  alt={images[currentImageIndex].label}
                  sx={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    transform: `scale(${zoom}) rotate(${rotation}deg) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                    transition: isDragging ? "none" : "transform 0.3s",
                    objectFit: "contain",
                    userSelect: "none",
                    WebkitUserDrag: "none",
                  }}
                />
              )}
            </Box>

            {/* Controls Overlay */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bgcolor: "rgba(0, 0, 0, 0.7)",
                p: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" color="white" sx={{ ml: 2 }}>
                {images[currentImageIndex]?.label} ({currentImageIndex + 1}/
                {images.length}) | Zoom: {Math.round(zoom * 100)}% | Rotation:{" "}
                {rotation}°{zoom > 1 && " | Click and drag to pan"}
              </Typography>

              <Stack direction="row" spacing={1}>
                <Tooltip title="Previous (←)" arrow>
                  <IconButton
                    onClick={prevImage}
                    sx={{ color: "white" }}
                    disabled={images.length <= 1}
                  >
                    <ChevronLeft />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Next (→)" arrow>
                  <IconButton
                    onClick={nextImage}
                    sx={{ color: "white" }}
                    disabled={images.length <= 1}
                  >
                    <ChevronRight />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom In (+)" arrow>
                  <IconButton onClick={handleZoomIn} sx={{ color: "white" }}>
                    <ZoomIn />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom Out (-)" arrow>
                  <IconButton onClick={handleZoomOut} sx={{ color: "white" }}>
                    <ZoomOut />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Rotate (R)" arrow>
                  <IconButton onClick={handleRotate} sx={{ color: "white" }}>
                    <RotateRight />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Fullscreen (F)" arrow>
                  <IconButton
                    onClick={toggleFullscreen}
                    sx={{ color: "white" }}
                  >
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset (0)" arrow>
                  <IconButton onClick={handleReset} sx={{ color: "white" }}>
                    <Close />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close (ESC)" arrow>
                  <IconButton
                    onClick={handleClosePreview}
                    sx={{ color: "white" }}
                  >
                    <Close />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* Image Thumbnails */}
            {images.length > 1 && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: "rgba(0, 0, 0, 0.7)",
                  p: 1,
                  overflowX: "auto",
                }}
              >
                <Stack direction="row" spacing={1} justifyContent="center">
                  {images.map((img, index) => (
                    <Tooltip title={img.label} key={index}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 1,
                          overflow: "hidden",
                          border:
                            currentImageIndex === index
                              ? "2px solid"
                              : "1px solid",
                          borderColor:
                            currentImageIndex === index
                              ? "primary.main"
                              : "rgba(255,255,255,0.3)",
                          cursor: "pointer",
                          opacity: currentImageIndex === index ? 1 : 0.7,
                          flexShrink: 0,
                          "&:hover": {
                            opacity: 1,
                          },
                        }}
                        onClick={() => {
                          setCurrentImageIndex(index);
                          setZoom(1);
                          setRotation(0);
                          setImagePosition({ x: 0, y: 0 });
                        }}
                      >
                        <Box
                          component="img"
                          src={img.url}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          alt={img.label}
                        />
                      </Box>
                    </Tooltip>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Instruction Hint */}
            <Box
              sx={{
                position: "absolute",
                bottom: images.length > 1 ? 70 : 10,
                left: "50%",
                transform: "translateX(-50%)",
                bgcolor: "rgba(0, 0, 0, 0.5)",
                color: "white",
                px: 2,
                py: 0.5,
                borderRadius: 1,
                fontSize: "0.75rem",
                textAlign: "center",
              }}
            >
              Use mouse wheel to zoom • Click and drag to pan • Arrow keys to
              navigate
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default BeneficiaryDetailModal;
