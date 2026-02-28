import React, { useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  SectionList,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useCameraPermissions, CameraView } from "expo-camera";
import { useFocusEffect } from "@react-navigation/native";
import { validateReturnQR } from "../../api/return.api";

const ReturnValidationScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState("qr"); // "qr" or "manual"
  const [checkoutCode, setCheckoutCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const cameraRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      if (permission?.granted && scanMode === "qr") {
        setIsScanning(true);
      }
    }, [permission, scanMode]),
  );

  const handleQRScanned = async ({ data }) => {
    if (!isScanning || isValidating) return;

    setIsScanning(false);
    setIsValidating(true);

    try {
      const returnData = await validateReturnQR({ qrToken: data });
      const normalizedItem = {
        ...returnData?.item,
        productName:
          returnData?.item?.productName ||
          returnData?.item?.name ||
          "Returned Item",
        price:
          returnData?.item?.price ??
          returnData?.item?.originalPrice ??
          returnData?.item?.unitPrice ??
          0,
        quantity: returnData?.item?.quantity ?? returnData?.item?.qty ?? 1,
        barcode:
          returnData?.item?.barcode ||
          returnData?.item?.productBarcode ||
          returnData?.item?.sku ||
          null,
      };

      // Navigate to inspection screen
      navigation.navigate("ReturnInspection", {
        returnId: returnData.returnId,
        order: returnData.order,
        item: normalizedItem,
      });
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to scan QR code");
      setIsScanning(true);
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualValidation = async () => {
    if (!checkoutCode.trim()) {
      Alert.alert("Error", "Please enter a checkout code");
      return;
    }

    setIsValidating(true);

    try {
      const returnData = await validateReturnQR({
        checkoutCode: checkoutCode.trim(),
      });
      const normalizedItem = {
        ...returnData?.item,
        productName:
          returnData?.item?.productName ||
          returnData?.item?.name ||
          "Returned Item",
        price:
          returnData?.item?.price ??
          returnData?.item?.originalPrice ??
          returnData?.item?.unitPrice ??
          0,
        quantity: returnData?.item?.quantity ?? returnData?.item?.qty ?? 1,
        barcode:
          returnData?.item?.barcode ||
          returnData?.item?.productBarcode ||
          returnData?.item?.sku ||
          null,
      };

      navigation.navigate("ReturnInspection", {
        returnId: returnData.returnId,
        order: returnData.order,
        item: normalizedItem,
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result.granted) {
      setIsScanning(true);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#00A86B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validate Return</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Selection */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, scanMode === "qr" && styles.tabActive]}
          onPress={() => {
            setScanMode("qr");
            if (permission.granted) {
              setIsScanning(true);
            }
          }}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={18}
            color={scanMode === "qr" ? "#00A86B" : "#64748B"}
          />
          <Text
            style={[styles.tabText, scanMode === "qr" && styles.tabTextActive]}
          >
            Scan QR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, scanMode === "manual" && styles.tabActive]}
          onPress={() => {
            setScanMode("manual");
            setIsScanning(false);
          }}
        >
          <MaterialCommunityIcons
            name="text-box"
            size={18}
            color={scanMode === "manual" ? "#00A86B" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              scanMode === "manual" && styles.tabTextActive,
            ]}
          >
            Enter Code
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {scanMode === "qr" ? (
        <View style={styles.cameraContainer}>
          {permission.granted && isScanning ? (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              onBarcodeScanned={handleQRScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
          ) : (
            <View style={styles.noPermissionContainer}>
              <MaterialCommunityIcons
                name="camera-off"
                size={48}
                color="#9CA3AF"
              />
              <Text style={styles.noPermissionText}>
                Camera permission required
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={handleRequestPermission}
              >
                <Text style={styles.permissionButtonText}>
                  Grant Permission
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* QR Frame Guide */}
          <View style={styles.scanGuideContainer}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanGuideText}>Align QR code within frame</Text>
          </View>
        </View>
      ) : (
        <View style={styles.manualContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.manualContent}>
              <Text style={styles.manualTitle}>Enter Checkout Code</Text>
              <Text style={styles.manualSubtitle}>
                If customer doesn't have QR, enter their original checkout code
              </Text>

              <TextInput
                style={styles.codeInput}
                placeholder="e.g., CHK-12345678"
                placeholderTextColor="#9CA3AF"
                value={checkoutCode}
                onChangeText={setCheckoutCode}
                autoCapitalize="characters"
                editable={!isValidating}
              />

              <TouchableOpacity
                style={[
                  styles.validateButton,
                  isValidating && styles.buttonDisabled,
                ]}
                onPress={handleManualValidation}
                disabled={isValidating}
              >
                {isValidating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="magnify"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.validateButtonText}>Search Return</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.helpBox}>
                <MaterialCommunityIcons
                  name="information"
                  size={18}
                  color="#3B82F6"
                />
                <Text style={styles.helpText}>
                  Customer can find their checkout code in their order history
                  or receipt
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Loading Overlay */}
      {isValidating && (
        <View style={styles.validatingOverlay}>
          <View style={styles.validatingCard}>
            <ActivityIndicator size="large" color="#00A86B" />
            <Text style={styles.validatingText}>Validating return...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#00A86B",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#00A86B",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  noPermissionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  permissionButton: {
    backgroundColor: "#00A86B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  scanGuideContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderWidth: 3,
    borderColor: "#00A86B",
    borderRadius: 12,
    marginBottom: 16,
  },
  scanGuideText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  manualContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  manualContent: {
    padding: 16,
  },
  manualTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  manualSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
    fontFamily: "monospace",
  },
  validateButton: {
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  validateButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  helpBox: {
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  helpText: {
    fontSize: 13,
    color: "#1E40AF",
    flex: 1,
    fontWeight: "500",
  },
  validatingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  validatingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  validatingText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
});

export default ReturnValidationScreen;
