import { View, Text, StyleSheet, Button } from "react-native";
import React from "react";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";

const BarcodeScanner = ({onDetect}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const facing = "back";

  if (!permission) {
    return <View></View>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
  <CameraView
    style={StyleSheet.absoluteFillObject}
    facing="back"
    barcodeScannerSettings={{
      barcodeTypes: ["ean8", "ean13", "upc_a", "upc_e", "code128"],
    }}
    onBarcodeScanned={({ data, type }) => {
      onDetect(data, type);
    }}
  />

  {/* Overlay */}
  <View style={styles.overlay}>
    <Text style={styles.instructionText}>Align barcode within frame</Text>

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
