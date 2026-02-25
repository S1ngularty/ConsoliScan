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
  Easing,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getCheckoutDetails } from "../../api/checkout.api";

// ─── Frame size constant — everything is derived from this ───────────────────
const FRAME_SIZE = 260;
const CORNER_LEN = 28;
const CORNER_W = 3;

const QRScannerScreen = () => {
  const navigation = useNavigation();
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);

  // Scan line — native driver only (translateY)
  const scanAnim = useRef(new Animated.Value(0)).current;
  // Success modal scale — native driver
  const modalScale = useRef(new Animated.Value(0.85)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // Animate success modal in
  useEffect(() => {
    if (showSuccessModal) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 5,
          speed: 14,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalScale.setValue(0.85);
      modalOpacity.setValue(0);
    }
  }, [showSuccessModal]);

  // ── Permission screens ──────────────────────────────────────────────────────
  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <View style={styles.permissionIconWrap}>
          <MaterialCommunityIcons name="camera-off" size={40} color="#94a3b8" />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan customer QR codes
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Scan handler ────────────────────────────────────────────────────────────
  const handleBarCodeScanned = async ({ data }) => {
    const now = Date.now();
    if (now - lastScanTime < 2000) return;
    setLastScanTime(now);

    const checkoutCode = data.trim();

    try {
      setIsLoading(true);

      if (!checkoutCode) throw new Error("Invalid QR code");
      if (!/^CHK-[A-Z0-9]{8}$/i.test(checkoutCode))
        throw new Error("Invalid checkout code format. Expected: CHK-XXXXXXXX");

      const response = await getCheckoutDetails(checkoutCode);
      console.log("✅ [QR SCAN] Checkout details retrieved:", response);
      await new Promise((r) => setTimeout(r, 1000));

      if (response.status === "PAID")
        throw new Error("This order has already been paid");
      if (response.status === "CANCELLED")
        throw new Error("This order has been cancelled");
      if (response.status === "EXPIRED")
        throw new Error("This checkout code has expired");

      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);

        // Check validation method and route accordingly
        const validationMethod = response.validation?.validationMethod;

        if (validationMethod === "COUNTING_ONLY") {
          // Low risk - use ML counting
          navigation.navigate("Detection", {
            checkoutData: response,
            checkoutCode,
            orderItems: response.items || response.cartSnapshot?.items || [],
          });
        } else {
          // High risk or default - require full rescan
          navigation.navigate("QRScanValidation", {
            checkoutData: response,
            checkoutCode,
            orderItems: response.items || response.cartSnapshot?.items || [],
          });
        }
      }, 1600);
    } catch (err) {
      Alert.alert("Scan Failed", err.message || "Please try scanning again", [
        { text: "OK", onPress: () => setIsLoading(false) },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Camera overlay — uses flex layout, no hardcoded pixel math ─────────────
  const renderOverlay = () => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top dim */}
      <View style={styles.dimTop} />

      {/* Middle row: left dim | clear frame | right dim */}
      <View style={styles.dimMiddle}>
        <View style={styles.dimSide} />

        {/* Scan frame */}
        <View style={styles.scanFrame}>
          {/* Corners */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Animated scan line — translateY only, native driver ✓ */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, FRAME_SIZE - 2],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        <View style={styles.dimSide} />
      </View>

      {/* Bottom dim — contains instructions */}
      <View style={styles.dimBottom}>
        <View style={styles.instructionsWrap}>
          <View style={styles.instructionsIconWrap}>
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#fff" />
          </View>
          <Text style={styles.instructionsText}>
            Align QR code within the frame
          </Text>
          <Text style={styles.instructionsSubtext}>
            Ensure the code is well-lit and fully visible
          </Text>
          <View style={styles.examplePill}>
            <Text style={styles.exampleText}>e.g. CHK-206B0097</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <Text style={styles.headerSubtitle}>Position within the frame</Text>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
        >
          <MaterialCommunityIcons
            name="camera-flip-outline"
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Camera */}
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={isLoading ? undefined : handleBarCodeScanned}
        />
        {renderOverlay()}
      </View>

      {/* Footer */}
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <TouchableOpacity
          style={styles.manualBtn}
          onPress={() => navigation.navigate("ManualEntry")}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name="keyboard-outline"
            size={20}
            color="#fff"
          />
          <Text style={styles.manualBtnText}>Enter Code Manually</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Scan the QR code shown on the customer's device after checkout
        </Text>
      </SafeAreaView>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Validating order…</Text>
        </View>
      )}

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="none">
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.successCard,
              { opacity: modalOpacity, transform: [{ scale: modalScale }] },
            ]}
          >
            {/* Icon */}
            <View style={styles.successIconWrap}>
              <MaterialCommunityIcons
                name="check-circle"
                size={52}
                color="#00A86B"
              />
            </View>

            <Text style={styles.successTitle}>Order Retrieved!</Text>
            <Text style={styles.successSubtitle}>
              Redirecting to order details…
            </Text>

            <View style={styles.successSpinnerRow}>
              <ActivityIndicator color="#00A86B" size="small" />
              <Text style={styles.successSpinnerText}>Loading…</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // ── Permission screen — matches card / #F8F9FA system ──────────────────────
  permissionContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  permissionIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionBtn: {
    backgroundColor: "#00A86B",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  // ── Camera area ────────────────────────────────────────────────────────────
  cameraWrap: { flex: 1 },

  // ── Overlay — flex-based, no hardcoded pixel math ──────────────────────────
  dimTop: { backgroundColor: "rgba(0,0,0,0.65)", height: "20%" },
  dimMiddle: { flexDirection: "row", height: FRAME_SIZE },
  dimSide: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  dimBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 28,
  },

  // ── Scan frame ─────────────────────────────────────────────────────────────
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 12,
    backgroundColor: "rgba(0,168,107,0.04)",
    overflow: "hidden",
  },

  // Corners — positioned on the frame itself
  corner: {
    position: "absolute",
    width: CORNER_LEN,
    height: CORNER_LEN,
    borderColor: "#00A86B",
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderBottomRightRadius: 10,
  },

  // Scan line — full width of the frame, native translateY
  scanLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#00A86B",
    opacity: 0.85,
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },

  // ── Instructions (inside dimBottom) ────────────────────────────────────────
  instructionsWrap: { alignItems: "center", paddingHorizontal: 32 },
  instructionsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 6,
  },
  instructionsSubtext: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 16,
  },
  examplePill: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  exampleText: { fontSize: 12, color: "#94a3b8", fontStyle: "italic" },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  manualBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
    marginBottom: 14,
  },
  manualBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  footerNote: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },

  // ── Loading overlay ─────────────────────────────────────────────────────────
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.88)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 16,
  },

  // ── Success modal — matches card design system ──────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  successCard: {
    backgroundColor: "#fff",
    borderRadius: 24, // matches card borderRadius
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#f1f5f9", // matches card borderColor
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(0,168,107,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  successSpinnerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  successSpinnerText: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },
});

export default QRScannerScreen;
