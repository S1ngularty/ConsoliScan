// screens/cashier/QRScannerScreen.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getCheckoutDetails } from "../../api/checkout.api";

const { width, height } = Dimensions.get("window");

const QRScannerScreen = () => {
  const navigation = useNavigation();
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState("");
  const [lastScanTime, setLastScanTime] = useState(0);

  const scanAnimation = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef(null);

  // Animation for scan line
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <MaterialCommunityIcons name="camera-off" size={80} color="#64748B" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan customer QR codes
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    // Add 2-second delay between scans to prevent spamming
    const currentTime = Date.now();
    if (currentTime - lastScanTime < 2000) {
      return; // Ignore scan if less than 2 seconds since last scan
    }
    setLastScanTime(currentTime);
    const checkoutCode = data.trim();

    try {
      setIsLoading(true);
      setError("");
      
      if (!checkoutCode) {
        throw new Error("Invalid QR code");
      }

      if (!/^CHK-[A-Z0-9]{8}$/i.test(checkoutCode)) {
        throw new Error("Invalid checkout code format. Expected: CHK-XXXXXXXX");
      }

      const OrderDetails = await getCheckoutDetails(checkoutCode);
      console.log(OrderDetails)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const response = OrderDetails;

      if (response.status === "PAID") {
        throw new Error("This order has already been paid");
      }

      if (response.status === "CANCELLED") {
        throw new Error("This order has been cancelled");
      }

      if (response.status === "EXPIRED") {
        throw new Error("This checkout code has expired");
      }

      setScannedData(response);
      setShowSuccessModal(true);

      // Navigate to order details after delay
      setTimeout(() => {
        setShowSuccessModal(false);
        navigation.navigate("OrderDetails", {
          checkoutData: response,
          checkoutCode,
        });
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to validate checkout code");
      Alert.alert("Scan Failed", err.message || "Please try scanning again", [
        { text: "OK", onPress: () => setIsLoading(false) },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const renderCameraOverlay = () => {
    return (
      <View style={StyleSheet.absoluteFill}>
        {/* Dimmed Top and Bottom Areas */}
        <View style={[styles.dimmedArea, styles.dimmedTop]} />
        <View style={[styles.dimmedArea, styles.dimmedBottom]} />
        <View style={[styles.dimmedArea, styles.dimmedLeft]} />
        <View style={[styles.dimmedArea, styles.dimmedRight]} />

        {/* Scan Frame */}
        <View style={styles.scanFrameContainer}>
          <View style={styles.scanFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            {/* Animated Scan Line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 250],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionsIconContainer}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.instructionsText}>
            Align customer's QR code within the frame
          </Text>
          <Text style={styles.instructionsSubtext}>
            Ensure the QR code is well-lit and fully visible
          </Text>
        </View>

        {/* Example Code */}
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleText}>Example: CHK-206B0097</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Scan Customer QR</Text>
          <Text style={styles.subtitle}>Position QR code within frame</Text>
        </View>
        
        <TouchableOpacity
          style={styles.cameraToggle}
          onPress={toggleCameraFacing}
        >
          <MaterialCommunityIcons name="camera-flip" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={isLoading ? undefined : handleBarCodeScanned}
        />

        {/* Overlay rendered separately */}
        {renderCameraOverlay()}
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Validating order...</Text>
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.manualEntryButton}
          onPress={() => navigation.navigate("ManualEntry")}
          activeOpacity={0.8}
        >
          <View style={styles.manualEntryIcon}>
            <MaterialCommunityIcons name="keyboard-outline" size={22} color="#64748B" />
          </View>
          <Text style={styles.manualEntryText}>Enter Code Manually</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Scan the QR code shown on customer's device after checkout
        </Text>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <MaterialCommunityIcons
                name="check-circle"
                size={60}
                color="#00A86B"
              />
            </View>
            <Text style={styles.successTitle}>Order Retrieved!</Text>
            <Text style={styles.successText}>
              Redirecting to order details...
            </Text>
            <View style={styles.successSpinner}>
              <ActivityIndicator color="#00A86B" size="small" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: "#00A86B",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  cameraToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  dimmedArea: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  dimmedTop: {
    top: 0,
    left: 0,
    right: 0,
    height: (height - 320) / 2 - 60, // Adjust based on header
  },
  dimmedBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 140, // Footer area
  },
  dimmedLeft: {
    top: (height - 320) / 2 - 60,
    left: 0,
    width: (width - 280) / 2,
    height: 320,
  },
  dimmedRight: {
    top: (height - 320) / 2 - 60,
    right: 0,
    width: (width - 280) / 2,
    height: 320,
  },
  scanFrameContainer: {
    position: "absolute",
    top: (height - 320) / 2 - 60,
    left: (width - 280) / 2,
    width: 280,
    height: 320,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    position: "relative",
    backgroundColor: "rgba(0, 168, 107, 0.05)",
  },
  cornerTL: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#00A86B",
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#00A86B",
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#00A86B",
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#00A86B",
    borderBottomRightRadius: 8,
  },
  scanLine: {
    width: 280,
    height: 2,
    backgroundColor: "#00A86B",
    position: "absolute",
    top: 0,
    opacity: 0.8,
  },
  instructionsContainer: {
    position: "absolute",
    bottom: 180,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  instructionsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 4,
  },
  instructionsSubtext: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
  exampleContainer: {
    position: "absolute",
    top: (height - 320) / 2 + 240,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  exampleText: {
    fontSize: 14,
    color: "#94A3B8",
    fontStyle: "italic",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#000000",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  manualEntryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    width: "100%",
    justifyContent: "center",
  },
  manualEntryIcon: {
    marginRight: 12,
  },
  manualEntryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  footerNote: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  successModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
    textAlign: "center",
  },
  successText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  successSpinner: {
    marginTop: 8,
  },
});

export default QRScannerScreen;