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
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MACHINE_SERVICE } from "../../constants/config";
import { lockedOrder } from "../../api/checkout.api";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
  const [cameraFacing, setCameraFacing] = useState("back");
  const [scans, setScans] = useState([]);
  const [validationComplete, setValidationComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const cameraRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const totalExpectedItems = orderItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  useEffect(() => {
    lockedOrder(checkoutCode);
  }, []);

  const getValidationStatus = () => {
    if (remainingItems === 0) return "success";
    if (remainingItems < 0) return "extra";
    return "missing";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "#10B981";
      case "extra":
        return "#F59E0B";
      case "missing":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return "check-circle";
      case "extra":
        return "alert";
      case "missing":
        return "close-circle";
      default:
        return "help";
    }
  };

  const togglePanel = () => {
    if (isPanelVisible) {
      // Close panel
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT * 0.65,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsPanelVisible(false);
        setShowResults(false);
      });
    } else {
      // Open panel
      setIsPanelVisible(true);
      setShowResults(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const runDetection = async () => {
    if (!cameraRef.current) return;

    setLoading(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
      });

      const data = new FormData();
      data.append("file", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "detection.jpg",
      });

      const res = await fetch(`${MACHINE_SERVICE}/detect`, {
        method: "POST",
        body: data,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const json = await res.json();

      if (!res.ok) {
        Alert.alert(
          "Detection Error",
          json?.error || "Detection failed. Please try again.",
        );
        return;
      }

      if (json.count !== undefined) {
        const newDetectionCount = json.count;
        const newRemaining = totalExpectedItems - newDetectionCount;

        const newScan = {
          id: Date.now(),
          detectedCount: newDetectionCount,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        };

        setScans((prev) => [newScan, ...prev.slice(0, 2)]);
        setTotalDetected(newDetectionCount);
        setRemainingItems(newRemaining);

        if (newRemaining === 0) {
          setValidationComplete(true);
          Alert.alert(
            "Perfect Match",
            `Detected ${newDetectionCount} item(s). Order is complete.`,
          );
        } else if (newRemaining > 0) {
          Alert.alert(
            "Detection Result",
            `Detected ${newDetectionCount} item(s). ${newRemaining} item(s) still remaining.`,
          );
        } else {
          Alert.alert(
            "Extra Items Detected",
            `Detected ${newDetectionCount} item(s), which is ${Math.abs(newRemaining)} extra item(s).`,
          );
        }

        // Automatically show panel when first scan is done
        if (scans.length === 0 && !isPanelVisible) {
          togglePanel();
        }
      } else {
        Alert.alert(
          "Detection Error",
          "No valid detection count was returned. Please try again.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Connection Error",
        "Failed to connect to detection service. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteValidation = () => {
    const status = getValidationStatus();

    if (status === "success") {
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
    } else {
      Alert.alert(
        "Validation Incomplete",
        status === "extra"
          ? "Extra items detected. Continue anyway?"
          : `${remainingItems} items still need to be detected.`,
        [
          { text: "Scan More", style: "cancel" },
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
        ],
      );
    }
  };

  if (!permission) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient
        colors={["#0F172A", "#1E293B"]}
        style={styles.permissionContainer}
      >
        <View style={styles.permissionContent}>
          <View style={styles.permissionIconContainer}>
            <MaterialCommunityIcons
              name="camera-off"
              size={60}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to detect and validate items for this order
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.permissionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.permissionButtonText}>Grant Access</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const status = getValidationStatus();
  const statusColor = getStatusColor(status);
  const progressPercentage =
    totalExpectedItems > 0
      ? Math.min(
          100,
          ((totalExpectedItems - remainingItems) / totalExpectedItems) * 100,
        )
      : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Main Camera View */}
      <View style={styles.cameraSection}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraFacing}
          ratio="16:9"
        />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={["rgba(0,0,0,0.8)", "transparent", "rgba(0,0,0,0.8)"]}
          style={styles.cameraOverlay}
          pointerEvents="none"
        />

        {/* Header */}
        <SafeAreaView style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.checkoutCode}>#{checkoutCode}</Text>
            <Text style={styles.headerSubtitle}>Object Detection</Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              setCameraFacing((current) =>
                current === "back" ? "front" : "back",
              )
            }
          >
            <MaterialCommunityIcons
              name="camera-flip"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Quick Stats Pill */}
        <View style={styles.quickStats}>
          <View style={styles.statPill}>
            <MaterialCommunityIcons
              name="package-variant"
              size={16}
              color="#10B981"
            />
            <Text style={styles.statText}>{totalExpectedItems} items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statPill}>
            <MaterialCommunityIcons
              name={remainingItems > 0 ? "clock-outline" : "check-circle"}
              size={16}
              color={remainingItems > 0 ? "#F59E0B" : "#10B981"}
            />
            <Text
              style={[
                styles.statText,
                { color: remainingItems > 0 ? "#F59E0B" : "#10B981" },
              ]}
            >
              {remainingItems > 0 ? `${remainingItems} left` : "complete"}
            </Text>
          </View>
        </View>

        {/* Bottom Controls Container */}
        <View style={styles.bottomControls}>
          {/* Show Results Button - appears when panel is closed */}
          {!isPanelVisible && scans.length > 0 && (
            <TouchableOpacity
              style={styles.showResultsButton}
              onPress={togglePanel}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="arrow-up"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.showResultsText}>Show Results</Text>
            </TouchableOpacity>
          )}

          {/* Circular Scan Button */}
          <TouchableOpacity
            style={[
              styles.scanButton,
              loading && styles.scanButtonLoading,
              validationComplete && styles.scanButtonComplete,
              !isPanelVisible &&
                scans.length > 0 &&
                styles.scanButtonWithResults,
            ]}
            onPress={runDetection}
            disabled={loading || validationComplete}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#10B981" size="large" />
            ) : validationComplete ? (
              <MaterialCommunityIcons name="check" size={40} color="#10B981" />
            ) : (
              <MaterialCommunityIcons name="camera" size={40} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Scan Button Label */}
        {!loading && !validationComplete && (
          <Text style={styles.scanButtonLabel}>Tap to scan items</Text>
        )}
      </View>

      {/* Slide-up Results Panel */}
      <Animated.View
        style={[
          styles.resultsPanel,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.panelHandle}>
          <View style={styles.handleBar} />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={togglePanel}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={24}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.panelContent}
        >
          {/* Main Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Detection Progress</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${statusColor}15` },
                ]}
              >
                <MaterialCommunityIcons
                  name={getStatusIcon(status)}
                  size={16}
                  color={statusColor}
                />
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {status === "success"
                    ? "Complete"
                    : status === "extra"
                      ? "Extra Items"
                      : `${remainingItems} remaining`}
                </Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: statusColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>

            <View style={styles.countGrid}>
              <View style={styles.countItem}>
                <Text style={styles.countLabel}>Expected</Text>
                <Text style={styles.countValue}>{totalExpectedItems}</Text>
              </View>
              <View style={styles.countItem}>
                <Text style={styles.countLabel}>Detected</Text>
                <Text style={[styles.countValue, { color: "#10B981" }]}>
                  {totalDetected}
                </Text>
              </View>
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
                            ? "#F59E0B"
                            : "#10B981",
                    },
                  ]}
                >
                  {Math.abs(remainingItems)}
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Scans */}
          {scans.length > 0 && (
            <View style={styles.scansCard}>
              <View style={styles.scansHeader}>
                <MaterialCommunityIcons
                  name="history"
                  size={20}
                  color="#64748B"
                />
                <Text style={styles.scansTitle}>Recent Scans</Text>
              </View>

              {scans.map((scan, index) => (
                <View
                  key={scan.id}
                  style={[
                    styles.scanItem,
                    index === 0 && styles.latestScanItem,
                  ]}
                >
                  <View style={styles.scanItemLeft}>
                    <View
                      style={[
                        styles.scanIndicator,
                        index === 0 && styles.latestScanIndicator,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="camera"
                        size={14}
                        color={index === 0 ? "#10B981" : "#94A3B8"}
                      />
                    </View>
                    <View>
                      <Text style={styles.scanTime}>{scan.timestamp}</Text>
                      <Text style={styles.scanDetected}>
                        {scan.detectedCount} items detected
                      </Text>
                    </View>
                  </View>
                  <View style={styles.scanBadge}>
                    <Text style={styles.scanBadgeText}>
                      Scan #{scans.length - index}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteValidation}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  scans.length === 0
                    ? ["#94A3B8", "#64748B"]
                    : ["#10B981", "#059669"]
                }
                style={styles.completeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons
                  name={validationComplete ? "check-circle" : "arrow-right"}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.completeButtonText}>
                  {validationComplete
                    ? "Complete & Continue"
                    : "Continue to Payment"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  navigation.replace("QRScanValidation", {
                    checkoutCode,
                    orderItems,
                    checkoutData,
                  });
                }}
              >
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={20}
                  color="#64748B"
                />
                <Text style={styles.secondaryButtonText}>Switch to QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color="#64748B"
                />
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  permissionContainer: {
    flex: 1,
  },
  permissionContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  permissionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: 300,
  },
  permissionButton: {
    width: "100%",
    maxWidth: 280,
    borderRadius: 16,
    overflow: "hidden",
  },
  permissionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  cameraSection: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerCenter: {
    alignItems: "center",
  },
  checkoutCode: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  quickStats: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  statText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  bottomControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  showResultsButton: {
    position: "absolute",
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  showResultsText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  scanButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonWithResults: {
    marginLeft: 40, // Offset to center when results button is visible
  },
  scanButtonLoading: {
    backgroundColor: "#FFFFFF",
  },
  scanButtonComplete: {
    backgroundColor: "#FFFFFF",
    borderColor: "#10B981",
  },
  scanButtonLabel: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  resultsPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  panelHandle: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
  },
  panelContent: {
    padding: 24,
    paddingBottom: 32,
  },
  progressCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    minWidth: 45,
  },
  countGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  countItem: {
    alignItems: "center",
  },
  countLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  countValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  scansCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  scansHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  scansTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  scanItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  latestScanItem: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  scanItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scanIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  latestScanIndicator: {
    backgroundColor: "#E8F5E9",
  },
  scanTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  scanDetected: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  scanBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scanBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  actionSection: {
    marginTop: 8,
  },
  completeButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  completeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
  },
  secondaryButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },
});
