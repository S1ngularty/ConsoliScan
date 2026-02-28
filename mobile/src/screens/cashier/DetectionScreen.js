// screens/cashier/ObjectDetectionScreen.jsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MACHINE_SERVICE } from "../../constants/config";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");
const RESULTS_PANEL_HEIGHT = SCREEN_HEIGHT * 0.45;
const SCAN_FRAME_SIZE = 250;

export default function ObjectDetectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { checkoutCode, orderItems = [], checkoutData } = route.params || {};

  const [permission, requestPermission] = useCameraPermissions();
  const [remainingItems, setRemainingItems] = useState(
    orderItems.reduce((sum, item) => sum + item.quantity, 0),
  );
  const [totalDetected, setTotalDetected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("back");
  const [scans, setScans] = useState([]);
  const [validationComplete, setValidationComplete] = useState(false);
  const cameraRef = useRef(null);

  // Get total items expected from order
  const totalExpectedItems = orderItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  // Calculate validation status based on remaining items
  const getValidationStatus = () => {
    if (remainingItems === 0) return "success";
    if (remainingItems < 0) return "extra"; // More detected than expected
    return "missing"; // Some items still missing
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "#00A86B";
      case "extra":
        return "#FF9800";
      case "missing":
        return "#EF4444";
      default:
        return "#64748B";
    }
  };

  const getStatusMessage = (status) => {
    if (status === "success") {
      return "All items detected!";
    } else if (status === "extra") {
      return `Extra items detected (${Math.abs(remainingItems)} extra)`;
    } else {
      return `${remainingItems} item(s) remaining`;
    }
  };

  // Auto-return to Payment when validation is complete and successful
  useEffect(() => {
    if (validationComplete && getValidationStatus() === "success") {
      const timer = setTimeout(() => {
        navigation.navigate("Payment", {
          validationResult: {
            isValidated: true,
            validationMethod: "object_detection",
            validationDate: new Date().toISOString(),
            scannedCount: totalExpectedItems - remainingItems,
            totalCount: totalExpectedItems,
          },
          checkoutCode,
          checkoutData,
          appUser: checkoutData?.userType === "user",
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [
    validationComplete,
    remainingItems,
    totalExpectedItems,
    checkoutCode,
    checkoutData,
    navigation,
  ]);

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <MaterialCommunityIcons name="camera-off" size={80} color="#64748B" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera permission to detect items
        </Text>
        <TouchableOpacity
          style={styles.grantButton}
          onPress={requestPermission}
        >
          <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.grantButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const runDetection = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    setScanning(true);

    try {
      // Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      // Prepare form data
      const data = new FormData();
      data.append("file", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "detection.jpg",
      });

      // Call FastAPI backend
      const res = await fetch(`${MACHINE_SERVICE}/detect`, {
        method: "POST",
        body: data,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const json = await res.json();

      if (json.count !== undefined) {
        const newDetectionCount = json.count;

        // Add to scan history
        const newScan = {
          id: Date.now(),
          detectedCount: newDetectionCount,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setScans((prev) => [newScan, ...prev.slice(0, 4)]);

        // Update total detected count
        setTotalDetected(newDetectionCount);

        // Calculate new remaining items
        // This scan detected X items, so subtract X from remaining
        const newRemaining = totalExpectedItems - newDetectionCount;
        setRemainingItems(newRemaining);

        // Show alert with current status
        if (newRemaining === 0) {
          Alert.alert(
            "Perfect Match!",
            `Detected ${newDetectionCount} items which matches the order.`,
            [
              {
                text: "Continue",
                onPress: () => {
                  setValidationComplete(true);
                },
              },
            ],
          );
        } else if (newRemaining > 0) {
          Alert.alert(
            "Items Detected",
            `Detected ${newDetectionCount} items. ${newRemaining} item(s) remaining.`,
            [{ text: "OK" }],
          );
        } else {
          Alert.alert(
            "Extra Items Detected",
            `Detected ${newDetectionCount} items (${Math.abs(newRemaining)} extra).`,
            [{ text: "OK" }],
          );
        }
      } else if (json.error) {
        Alert.alert("Detection Error", json.error);
      }
    } catch (error) {
      console.log("Detection request error:", error);
      Alert.alert(
        "Connection Error",
        "Failed to connect to detection service. Please check your connection and try again.",
        [{ text: "OK" }],
      );
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleToggleCamera = () => {
    setCameraFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleCompleteValidation = () => {
    const currentStatus = getValidationStatus();

    if (currentStatus === "success") {
      setValidationComplete(true);
    } else {
      Alert.alert("Validation Result", getStatusMessage(currentStatus), [
        {
          text: "Continue Anyway",
          style: "destructive",
          onPress: () => {
            navigation.navigate("Payment", {
              validationResult: {
                isValidated: false,
                validationMethod: "object_detection",
                validationDate: new Date().toISOString(),
                scannedCount: totalExpectedItems - remainingItems,
                totalCount: totalExpectedItems,
              },
              checkoutCode,
              checkoutData,
              appUser: checkoutData?.userType === "user",
            });
          },
        },
        {
          text: "Scan Again",
          onPress: handleRetry,
        },
      ]);
    }
  };

  const handleRetry = () => {
    setValidationComplete(false);
    setScans([]);
    setRemainingItems(totalExpectedItems);
    setTotalDetected(0);
  };

  const handleBack = () => {
    Alert.alert(
      "Exit Validation",
      "Are you sure you want to exit? Your validation progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          onPress: () => {
            navigation.goBack();
          },
        },
      ],
    );
  };

  const currentStatus = getValidationStatus();
  const statusColor = getStatusColor(currentStatus);

  return (
    <View style={styles.container}>
      {/* Camera View - Full Screen */}
      <CameraView ref={cameraRef} style={styles.camera} facing={cameraFacing} />

      {/* Overlay with proper spacing */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.overlay}>
          {/* Top area for header space */}
          <View style={[styles.overlaySection, { height: 60 }]} />

          {/* Middle area with scan frame cutout */}
          <View style={styles.scanFrameContainer}>
            <View
              style={[
                styles.overlaySide,
                { width: (width - SCAN_FRAME_SIZE) / 2 },
              ]}
            />

            <View style={styles.scanFrame}>
              {/* Corner markers */}
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />

              {scanning && (
                <View style={styles.scanningIndicator}>
                  <ActivityIndicator color="#00A86B" size="large" />
                  <Text style={styles.scanningText}>Detecting...</Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.overlaySide,
                { width: (width - SCAN_FRAME_SIZE) / 2 },
              ]}
            />
          </View>

          {/* Bottom area */}
          <View
            style={[
              styles.overlayBottom,
              {
                height: RESULTS_PANEL_HEIGHT,
              },
            ]}
          >
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                Place items within the frame
              </Text>
              <Text style={styles.instructionSubtext}>
                Ensure good lighting and clear view
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Object Detection</Text>
            <Text style={styles.headerSubtitle}>Checkout: #{checkoutCode}</Text>
          </View>

          <TouchableOpacity
            style={styles.flipButton}
            onPress={handleToggleCamera}
          >
            <MaterialCommunityIcons
              name="camera-flip"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Detect Button */}
      <View style={styles.detectButtonContainer}>
        <TouchableOpacity
          style={[styles.detectButton, loading && styles.detectButtonDisabled]}
          onPress={runDetection}
          disabled={loading || validationComplete}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="camera" size={22} color="#FFFFFF" />
              <Text style={styles.detectButtonText}>
                {validationComplete ? "Scan Complete" : "Detect Items"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Panel */}
      <View style={[styles.resultsPanel, { height: RESULTS_PANEL_HEIGHT }]}>
        <View style={styles.dragHandle}>
          <View style={styles.dragHandleBar} />
        </View>

        <ScrollView
          style={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Count Summary */}
          <View
            style={[
              styles.summaryCard,
              validationComplete && { borderColor: statusColor },
            ]}
          >
            <View style={styles.summaryHeader}>
              <MaterialCommunityIcons
                name={validationComplete ? "shield-check" : "counter"}
                size={24}
                color={validationComplete ? statusColor : "#64748B"}
              />
              <Text style={styles.summaryTitle}>
                {validationComplete ? "Validation Result" : "Detection Results"}
              </Text>
            </View>

            <View style={styles.countRow}>
              <View style={styles.countItem}>
                <Text style={styles.countLabel}>Total Expected</Text>
                <Text style={styles.countValue}>{totalExpectedItems}</Text>
              </View>

              <View style={styles.countDivider} />

              <View style={styles.countItem}>
                <Text style={styles.countLabel}>Detected</Text>
                <Text style={[styles.countValue, { color: "#00A86B" }]}>
                  {totalDetected}
                </Text>
              </View>

              <View style={styles.countDivider} />

              <View style={styles.countItem}>
                <Text style={styles.countLabel}>Remaining</Text>
                <Text
                  style={[
                    styles.countValue,
                    {
                      color:
                        remainingItems > 0
                          ? "#EF4444"
                          : remainingItems < 0
                            ? "#FF9800"
                            : "#00A86B",
                    },
                  ]}
                >
                  {remainingItems}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.statusMessage,
                { backgroundColor: `${statusColor}20` },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  currentStatus === "success"
                    ? "check-circle"
                    : currentStatus === "extra"
                      ? "alert-circle"
                      : "close-circle"
                }
                size={20}
                color={statusColor}
              />
              <Text style={[styles.statusMessageText, { color: statusColor }]}>
                {getStatusMessage(currentStatus)}
              </Text>
            </View>

            {validationComplete && currentStatus === "success" && (
              <View style={styles.successConfirmation}>
                <ActivityIndicator color="#00A86B" size="small" />
                <Text style={styles.successConfirmationText}>
                  Returning to order details...
                </Text>
              </View>
            )}
          </View>

          {/* Simple Progress Bar */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <MaterialCommunityIcons
                name="progress-check"
                size={22}
                color="#64748B"
              />
              <Text style={styles.progressTitle}>Progress</Text>
              <Text style={styles.progressPercentage}>
                {totalExpectedItems > 0
                  ? Math.round(
                      ((totalExpectedItems - remainingItems) /
                        totalExpectedItems) *
                        100,
                    )
                  : 0}
                %
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      totalExpectedItems > 0
                        ? Math.min(
                            100,
                            ((totalExpectedItems - remainingItems) /
                              totalExpectedItems) *
                              100,
                          )
                        : 0
                    }%`,
                    backgroundColor:
                      currentStatus === "success"
                        ? "#00A86B"
                        : currentStatus === "extra"
                          ? "#FF9800"
                          : "#3B82F6",
                  },
                ]}
              />
            </View>

            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                Detected: {totalExpectedItems - remainingItems}
              </Text>
              <Text style={styles.progressLabel}>
                Remaining: {Math.max(0, remainingItems)}
              </Text>
            </View>
          </View>

          {/* Scan History - Simplified */}
          {scans.length > 0 && (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <MaterialCommunityIcons
                  name="history"
                  size={22}
                  color="#64748B"
                />
                <Text style={styles.historyTitle}>Recent Scans</Text>
              </View>

              {scans.map((scan, index) => (
                <View
                  key={scan.id}
                  style={[styles.scanItem, index === 0 && styles.latestScan]}
                >
                  <View style={styles.scanInfo}>
                    <MaterialCommunityIcons
                      name="camera"
                      size={18}
                      color={index === 0 ? "#00A86B" : "#64748B"}
                    />
                    <Text style={styles.scanTime}>{scan.timestamp}</Text>
                  </View>
                  <Text style={styles.scanCount}>
                    {scan.detectedCount} items
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.completeButton,
                scans.length === 0 && styles.completeButtonDisabled,
                validationComplete &&
                  currentStatus === "success" &&
                  styles.completeButtonSuccess,
              ]}
              onPress={
                validationComplete ? handleRetry : handleCompleteValidation
              }
              disabled={scans.length === 0}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={validationComplete ? "refresh" : "check-circle"}
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.completeButtonText}>
                {validationComplete
                  ? currentStatus === "success"
                    ? "Validated ✓"
                    : "Try Again"
                  : "Complete Validation"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                navigation.replace("QRScanValidation", {
                  checkoutCode,
                  orderItems,
                  checkoutData,
                });
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={20}
                color="#00A86B"
              />
              <Text style={styles.switchButtonText}>Switch to Manual Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>
                {scans.length > 0 ? "Cancel & Exit" : "Back"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  grantButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A86B",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  grantButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlaySection: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scanFrameContainer: {
    flexDirection: "row",
    height: SCAN_FRAME_SIZE,
  },
  overlaySide: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayBottom: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#00A86B",
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#00A86B",
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#00A86B",
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#00A86B",
    borderBottomRightRadius: 8,
  },
  scanningIndicator: {
    position: "absolute",
    alignItems: "center",
    gap: 8,
  },
  scanningText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  instructionContainer: {
    alignItems: "center",
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  instructionSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  detectButtonContainer: {
    position: "absolute",
    bottom: RESULTS_PANEL_HEIGHT + 20,
    left: 20,
    right: 20,
  },
  detectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  detectButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  detectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: "center",
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E8F5EF",
    borderRadius: 2,
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 30,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#E8F5EF",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 10,
  },
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  countItem: {
    alignItems: "center",
    flex: 1,
  },
  countLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  countValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
  },
  countDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E8F5EF",
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  statusMessageText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  successConfirmation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9F5",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  successConfirmationText: {
    fontSize: 14,
    color: "#00A86B",
    fontWeight: "600",
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8F5EF",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 10,
    flex: 1,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00A86B",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E8F5EF",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8F5EF",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 10,
    flex: 1,
  },
  scanItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  latestScan: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  scanInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  scanTime: {
    fontSize: 14,
    color: "#64748B",
  },
  scanCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  completeButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  completeButtonSuccess: {
    backgroundColor: "#00A86B",
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  switchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  switchButtonText: {
    color: "#00A86B",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 20,
  },
});
