import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const BarcodeScanner = ({ onDetect }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const isProcessingRef = useRef(false);
  const processingTimeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons name="camera-off" size={60} color="#999" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            Camera is needed to scan barcode
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleScan = async ({ data, type }) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setScanning(true);

    try {
      await onDetect(type, data);
    } catch (err) {
      console.log(err);
    } finally {
      // Clear any existing timeout before setting new one
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      // Reduced timeout for faster scanning
      processingTimeoutRef.current = setTimeout(() => {
        isProcessingRef.current = false;
        setScanning(false);
      }, 150);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean8", "ean13", "upc_a", "upc_e", "code128"],
        }}
        onBarcodeScanned={scanning ? undefined : handleScan}
      />

      <View style={styles.overlay}>
        <View style={[styles.mask, styles.topMask]} />

        <View style={styles.scannerFrameContainer}>
          <View style={styles.sideMask} />
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {scanning ? (
              <View style={styles.scanningIndicator}>
                <MaterialCommunityIcons
                  name="magnify-scan"
                  size={24}
                  color="#00A86B"
                />
              </View>
            ) : (
              <View style={styles.scanLine} />
            )}
          </View>
          <View style={styles.sideMask} />
        </View>

        <View style={[styles.mask, styles.bottomMask]}>
          <View style={styles.instructionContainer}>
            <MaterialCommunityIcons
              name="barcode-scan"
              size={22}
              color="#fff"
            />
            <Text style={styles.instruction}>
              {scanning ? "Scanning..." : "Align barcode"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionCard: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#333",
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  permissionMessage: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#00A86B",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  mask: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  topMask: {
    flex: 1,
  },
  bottomMask: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrameContainer: {
    flexDirection: "row",
    height: 200,
  },
  sideMask: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  scannerFrame: {
    width: 280,
    backgroundColor: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#00A86B",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderBottomRightRadius: 6,
  },
  scanLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#00A86B",
  },
  scanningIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  instructionContainer: {
    alignItems: "center",
    gap: 10,
  },
  instruction: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default BarcodeScanner;
