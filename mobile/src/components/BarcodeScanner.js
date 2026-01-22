import { View, Text, StyleSheet, Button } from "react-native";
import React, { useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";

const BarcodeScanner = ({ onDetect }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false); // 👈 controls handler
  const isProcessingRef = useRef(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const handleScan = async ({ data, type }) => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setScanning(true); // ❌ disable scanner

    try {
      await onDetect(data, type);
    } catch (err) {
      console.log(err);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
        setScanning(false); // ✅ re-enable scanner
      }, 1500);
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
        onBarcodeScanned={scanning ? undefined : handleScan} // ⭐ THIS IS THE FIX
      />

      <View style={styles.overlay}>
        <Text style={styles.instructionText}>
          {scanning ? "Processing..." : "Align barcode within frame"}
        </Text>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
        </View>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
  },

  instructionText: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.85,
  },

  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#00FF88",
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  message: {
    textAlign: "center",
    paddingBottom: 12,
    fontSize: 16,
  },
});

export default BarcodeScanner;
