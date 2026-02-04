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
        <MaterialCommunityIcons name="camera-off" size={80} color="#666" />
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
      // Extract checkout code from QR data
      // console.log(checkoutCode)
      if (!checkoutCode) {
        throw new Error("Invalid QR code");
      }

      // Validate format for your example: CHK-206B0097
      // This format seems to be: CHK- followed by 8 alphanumeric characters
      if (!/^CHK-[A-Z0-9]{8}$/i.test(checkoutCode)) {
        throw new Error("Invalid checkout code format. Expected: CHK-XXXXXXXX");
      }

      // Mock API response - Replace with actual API call
      // const response = await getCheckoutDetails(checkoutCode)

      const OrderDetails = await getCheckoutDetails(checkoutCode);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const response = OrderDetails;
      // console.log(response)

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
        {/* Scan Frame */}
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

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <MaterialCommunityIcons name="qrcode-scan" size={24} color="#fff" />
          <Text style={styles.instructionsText}>
            Align customer's QR code within the frame
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Scan Customer QR</Text>
          <Text style={styles.subtitle}>Position QR code within frame</Text>
        </View>
        <TouchableOpacity
          style={styles.cameraToggle}
          onPress={toggleCameraFacing}
        >
          <MaterialCommunityIcons name="camera-flip" size={24} color="#fff" />
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
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Validating order...</Text>
        </View>
      )}

      {/* Manual Entry Option */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.manualEntryButton}
          onPress={() => navigation.navigate("ManualEntry")}
        >
          <MaterialCommunityIcons name="keyboard" size={20} color="#fff" />
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
            <ActivityIndicator color="#00A86B" style={styles.modalSpinner} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: "#00A86B",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#000",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 4,
  },
  cameraToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  scanFrame: {
    position: "absolute",
    top: (height - 400) / 2, // Centered vertically
    left: (width - 250) / 2 - 20, // Centered horizontally (minus margin)
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cornerTL: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#00A86B",
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#00A86B",
    borderTopRightRadius: 12,
  },
  cornerBL: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#00A86B",
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#00A86B",
    borderBottomRightRadius: 12,
  },
  scanLine: {
    width: 250,
    height: 2,
    backgroundColor: "#00A86B",
    position: "absolute",
    top: 0,
  },
  instructionsContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  instructionsText: {
    fontSize: 16,
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  exampleContainer: {
    position: "absolute",
    top: (height - 400) / 2 + 270,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  exampleText: {
    fontSize: 14,
    color: "#aaa",
    fontStyle: "italic",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    backgroundColor: "#000",
    alignItems: "center",
  },
  manualEntryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  manualEntryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  footerNote: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  modalSpinner: {
    marginTop: 10,
  },
});

export default QRScannerScreen;
