import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Vibration,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import BarcodeScanner from "../../components/BarcodeScanner";
import { scanProductForMerchandiser } from "../../api/product.api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../../utils/authUtil";

const { width, height } = Dimensions.get("window");

export default function ProductScanScreen({ navigation }) {
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [manualBarcodeVisible, setManualBarcodeVisible] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [lastScanned, setLastScanned] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanningLocked, setIsScanningLocked] = useState(false);

  const isProcessingRef = useRef(false);
  const processingTimeoutRef = useRef(null);
  const scanProgressTimeoutRef = useRef(null);

  // Scan consistency verification (like customer ScanningScreen)
  const scanBufferRef = useRef([]);
  const CONSISTENCY_THRESHOLD = 8; // Number of identical scans needed
  const SCAN_TIMEOUT_MS = 1000; // Clear scans older than this
  const resetTimeoutRef = useRef(null);

  // Reset scanning state when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log(
        "📸 [MERCHANDISER SCAN] Screen focused - resetting scan state",
      );
      setIsScanning(true);
      setIsScanningLocked(false);
      setScanProgress(0);
      setLastScanned("");
      isProcessingRef.current = false;
      scanBufferRef.current = [];

      // Cleanup on unfocus
      return () => {
        console.log("📸 [MERCHANDISER SCAN] Screen unfocused - cleaning up");
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
        }
        if (scanProgressTimeoutRef.current) {
          clearTimeout(scanProgressTimeoutRef.current);
        }
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }
      };
    }, []),
  );

  const handleBarcodeScanned = async (type, data) => {
    if (isScanningLocked || !data) {
      return;
    }

    const now = Date.now();

    // Add current scan to buffer
    scanBufferRef.current.push({
      barcode: data,
      type: type,
      timestamp: now,
    });

    // Remove old scans outside the time window
    scanBufferRef.current = scanBufferRef.current.filter(
      (scan) => now - scan.timestamp < SCAN_TIMEOUT_MS,
    );

    // Get the last N scans
    const recentScans = scanBufferRef.current.slice(-CONSISTENCY_THRESHOLD);

    // Calculate progress percentage
    const progress = (recentScans.length / CONSISTENCY_THRESHOLD) * 100;
    setScanProgress(progress);

    // Auto-reset: Clear progress if no new scans for 1.5 seconds
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = setTimeout(() => {
      if (!isScanningLocked) {
        setScanProgress(0);
        scanBufferRef.current = [];
      }
    }, 1500);

    // Check if we have enough scans
    if (recentScans.length < CONSISTENCY_THRESHOLD) {
      return;
    }

    // Check if all recent scans are identical
    const allSame = recentScans.every(
      (scan) => scan.barcode === recentScans[0].barcode,
    );

    if (!allSame) {
      return;
    }

    // Consistency verified! Process the scan
    const verifiedBarcode = recentScans[0].barcode;
    console.log(
      `✓ Scan verified: ${verifiedBarcode} (${CONSISTENCY_THRESHOLD}x consistent)`,
    );

    // Prevent duplicate processing of same barcode
    if (verifiedBarcode === lastScanned) {
      return;
    }

    // Clear auto-reset timeout since we're processing
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // Lock scanning and clear buffer
    setIsScanningLocked(true);
    setLastScanned(verifiedBarcode);
    scanBufferRef.current = [];
    isProcessingRef.current = true;

    // Animate scan progress
    setScanProgress(100);
    Vibration.vibrate(100);

    try {
      setLoading(true);

      const token = await getToken();
      if (!token) {
        Alert.alert(
          "Error",
          "Authentication token not found. Please login again.",
        );
        setIsScanningLocked(false);
        isProcessingRef.current = false;
        setScanProgress(0);
        setLoading(false);
        return;
      }

      const response = await scanProductForMerchandiser(verifiedBarcode, token);

      if (response.found && response.product) {
        // Product exists in database - go to edit screen
        setScanProgress(100);
        await incrementStat("productsScanned");

        setTimeout(() => {
          setScanProgress(0);
          setLoading(false);
          navigation.navigate("ProductEdit", { product: response.product });
        }, 400);
      } else {
        // Product not found - offer to add it
        setScanProgress(0);
        setLoading(false);

        Alert.alert(
          "Product Not Found",
          "This product doesn't exist in the system. Would you like to add it?",
          [
            {
              text: "Cancel",
              onPress: () => {
                setIsScanningLocked(false);
                setLastScanned("");
                isProcessingRef.current = false;
              },
              style: "cancel",
            },
            {
              text: "Add Product",
              onPress: () => {
                navigation.navigate("ProductAdd", { barcode: verifiedBarcode });
              },
            },
          ],
        );
      }
    } catch (error) {
      setScanProgress(0);
      setLoading(false);
      console.error("[MERCHANDISER SCAN] Error:", error);
      Alert.alert("Error", error.message || "Failed to scan product");
      setIsScanningLocked(false);
      setLastScanned("");
      isProcessingRef.current = false;
    } finally {
      // Reset lock after minimum delay
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      processingTimeoutRef.current = setTimeout(() => {
        setIsScanningLocked(false);
        setScanProgress(0);
        isProcessingRef.current = false;
      }, 1500);
    }
  };

  const handleManualEntry = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert("Error", "Please enter a barcode");
      return;
    }

    setManualBarcodeVisible(false);
    setLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert(
          "Error",
          "Authentication token not found. Please login again.",
        );
        setLoading(false);
        return;
      }

      const response = await scanProductForMerchandiser(
        manualBarcode.trim(),
        token,
      );

      if (response.found && response.product) {
        await incrementStat("productsScanned");
        navigation.navigate("ProductEdit", { product: response.product });
      } else {
        Alert.alert(
          "Product Not Found",
          "This product doesn't exist in the system. Would you like to add it?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Add Product",
              onPress: () => {
                navigation.navigate("ProductAdd", {
                  barcode: manualBarcode.trim(),
                });
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("[MERCHANDISER MANUAL SCAN] Error:", error);
      Alert.alert("Error", error.message || "Failed to find product");
    } finally {
      setLoading(false);
      setManualBarcode("");
    }
  };

  const incrementStat = async (stat) => {
    try {
      const statsData = await AsyncStorage.getItem("merchandiserStats");
      const stats = statsData
        ? JSON.parse(statsData)
        : {
            productsScanned: 0,
            productsUpdated: 0,
            productsAdded: 0,
          };
      stats[stat] = (stats[stat] || 0) + 1;
      await AsyncStorage.setItem("merchandiserStats", JSON.stringify(stats));
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Product</Text>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setManualBarcodeVisible(true)}
        >
          <MaterialCommunityIcons name="keyboard" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <BarcodeScanner
          onDetect={handleBarcodeScanned}
          scanProgress={scanProgress}
          barcodeTypes={[
            "ean8",
            "ean13",
            "upc_a",
            "upc_e",
            "code128",
            "code39",
            "code93",
            "codabar",
            "itf14",
          ]}
        />

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={manualBarcodeVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setManualBarcodeVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Barcode Manually</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter barcode number"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setManualBarcodeVisible(false);
                  setManualBarcode("");
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={handleManualEntry}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Search
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  manualButton: {
    padding: 8,
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  scanFrame: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: width * 0.7,
    height: width * 0.7,
    marginLeft: -(width * 0.35),
    marginTop: -(width * 0.35),
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#2E7D32",
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  instructionsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionsText: {
    color: "#fff",
    fontSize: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 20,
  },
  permissionButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f5f5f5",
  },
  modalButtonSubmit: {
    backgroundColor: "#2E7D32",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});
