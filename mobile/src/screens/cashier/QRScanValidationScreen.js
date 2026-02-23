import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const FRAME_SIZE = 240;
const CORNER_LEN = 26;
const CORNER_W = 3;
const SCAN_DELAY_MS = 1200;

// ─── Animated progress bar (JS-driven width) ─────────────────────────────────
const AnimatedBar = ({ pct, color = "#00A86B", height = 6 }) => {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, {
      toValue: Math.min(Math.max(pct, 0), 100),
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [pct]);
  return (
    <View style={[styles.barTrack, { height }]}>
      <Animated.View
        style={[
          styles.barFill,
          {
            height,
            backgroundColor: color,
            width: w.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
};

// ─── Flash feedback (native opacity) ────────────────────────────────────────
const useScanFeedback = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  const colorRef = useRef("#00A86B");

  const flash = useCallback((success) => {
    colorRef.current = success ? "#00A86B" : "#DC2626";
    opacity.setValue(0.85);
    Animated.timing(opacity, {
      toValue: 0,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  return { opacity, colorRef, flash };
};

// ─── Main screen ─────────────────────────────────────────────────────────────
const QRScanValidationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { checkoutCode, orderItems = [] } = route.params || {};

  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState([]);
  const [remainingItems, setRemainingItems] = useState([...orderItems]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null); // { success, message }
  const [cameraFacing, setCameraFacing] = useState("back");
  const [scanComplete, setScanComplete] = useState(false);

  const lastScanTime = useRef(0);
  const scanTimeout = useRef(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const { opacity: flashOpacity, colorRef, flash } = useScanFeedback();

  // Scan line loop
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
    return () => {
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (remainingItems.length === 0 && orderItems.length > 0)
      setScanComplete(true);
  }, [remainingItems.length]);

  // ── THE FIX: always call setIsProcessing(false) regardless of match ─────
  const handleBarCodeScanned = useCallback(
    ({ data }) => {
      const now = Date.now();
      if (now - lastScanTime.current < SCAN_DELAY_MS || isProcessing) return;
      lastScanTime.current = now;

      const scannedCode = data?.trim();
      if (!scannedCode) return;

      setIsProcessing(true);
      setLastResult(null);

      const itemIndex = remainingItems.findIndex(
        (item) => item.product?.barcode === scannedCode,
      );

      if (itemIndex === -1) {
        // ── WRONG BARCODE — immediately reset, show error feedback ──────────
        flash(false);
        setLastResult({ success: false, message: "Barcode not in this order" });
        setIsProcessing(false); // <-- was missing in original
        return;
      }

      // ── VALID SCAN ───────────────────────────────────────────────────────
      const item = remainingItems[itemIndex];
      flash(true);

      setScannedItems((prev) => {
        const idx = prev.findIndex((s) => s.sku === item.sku);
        if (idx !== -1) {
          const updated = [...prev];
          if (updated[idx].scannedQuantity < item.quantity) {
            updated[idx] = {
              ...updated[idx],
              scannedQuantity: updated[idx].scannedQuantity + 1,
            };
            if (updated[idx].scannedQuantity === item.quantity) {
              setRemainingItems((r) => r.filter((_, i) => i !== itemIndex));
            }
            setLastResult({ success: true, message: `${item.name} ✓` });
          } else {
            flash(false);
            setLastResult({ success: false, message: `Already fully scanned` });
          }
          return updated;
        } else {
          if (item.quantity === 1) {
            setRemainingItems((r) => r.filter((_, i) => i !== itemIndex));
          }
          setLastResult({ success: true, message: `${item.name} ✓` });
          return [
            ...prev,
            {
              ...item,
              scannedQuantity: 1,
              scannedAt: new Date().toISOString(),
            },
          ];
        }
      });

      scanTimeout.current = setTimeout(
        () => setIsProcessing(false),
        SCAN_DELAY_MS,
      );
    },
    [remainingItems, isProcessing, flash],
  );

  const handleCompleteValidation = () => {
    const totalScanned = scannedItems.reduce(
      (s, i) => s + i.scannedQuantity,
      0,
    );
    const totalOrder = orderItems.reduce((s, i) => s + i.quantity, 0);
    const result = {
      isValidated: remainingItems.length === 0,
      validationMethod: "qr_scan",
      validationDate: new Date().toISOString(),
      scannedCount: totalScanned,
      totalCount: totalOrder,
      scannedItems,
      remainingItems,
    };

    if (remainingItems.length > 0) {
      Alert.alert(
        "Incomplete Scan",
        `${remainingItems.length} item(s) still unscanned. Complete anyway?`,
        [
          { text: "Keep Scanning", style: "cancel" },
          {
            text: "Complete",
            onPress: () =>
              navigation.navigate("Payment", {
                validationResult: result,
                checkoutCode,
                checkoutData: route.params?.checkoutData,
                appUser: route.params?.checkoutData?.userType === "user",
              }),
          },
        ],
      );
      return;
    }
    navigation.navigate("Payment", {
      validationResult: result,
      checkoutCode,
      checkoutData: route.params?.checkoutData,
      appUser: route.params?.checkoutData?.userType === "user",
    });
  };

  const handleBack = () => {
    if (scannedItems.length > 0) {
      Alert.alert("Exit Validation", "Scan progress will be lost. Exit?", [
        { text: "Stay", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const getItemProgress = (item) => {
    const si = scannedItems.find((s) => s.sku === item.sku);
    const qty = si ? si.scannedQuantity : 0;
    return {
      scannedQuantity: qty,
      pct: (qty / item.quantity) * 100,
      isComplete: qty >= item.quantity,
    };
  };

  const totalScanned = scannedItems.reduce((s, i) => s + i.scannedQuantity, 0);
  const totalOrder = orderItems.reduce((s, i) => s + i.quantity, 0);
  const overallPct = totalOrder > 0 ? (totalScanned / totalOrder) * 100 : 0;

  // ── Permission screens ──────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.loadingFull}>
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionIconWrap}>
          <MaterialCommunityIcons name="camera-off" size={36} color="#94a3b8" />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan product barcodes
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <MaterialCommunityIcons name="camera" size={18} color="#fff" />
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Main UI ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Camera — fills behind everything */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={cameraFacing}
        barcodeScannerSettings={{
          barcodeTypes: ["ean8", "ean13", "upc_a", "upc_e", "code128"],
        }}
        onBarcodeScanned={isProcessing ? undefined : handleBarCodeScanned}
      />

      {/* Overlay — flex layout, no pixel math */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top dim */}
        <View style={styles.dimTop} />

        {/* Middle row */}
        <View style={styles.dimMiddle}>
          <View style={styles.dimSide} />

          {/* Scan frame */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cTL]} />
            <View style={[styles.corner, styles.cTR]} />
            <View style={[styles.corner, styles.cBL]} />
            <View style={[styles.corner, styles.cBR]} />

            {/* Scan line */}
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

            {/* Flash feedback overlay — on the frame itself */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 12,
                  opacity: flashOpacity,
                  backgroundColor:
                    colorRef.current === "#00A86B"
                      ? "rgba(0,168,107,0.18)"
                      : "rgba(220,38,38,0.18)",
                },
              ]}
            />
          </View>

          <View style={styles.dimSide} />
        </View>

        {/* Bottom dim — instructions sit here */}
        <View style={styles.dimBottom}>
          <View style={styles.instructionsWrap}>
            <MaterialCommunityIcons
              name="barcode-scan"
              size={18}
              color="#fff"
            />
            <Text style={styles.instructionsText}>
              Align barcode within the frame
            </Text>

            {/* Last scan result pill */}
            {lastResult && (
              <View
                style={[
                  styles.resultPill,
                  {
                    backgroundColor: lastResult.success
                      ? "rgba(0,168,107,0.25)"
                      : "rgba(220,38,38,0.25)",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={lastResult.success ? "check-circle" : "alert-circle"}
                  size={13}
                  color={lastResult.success ? "#6ee7b7" : "#fca5a5"}
                />
                <Text
                  style={[
                    styles.resultPillText,
                    { color: lastResult.success ? "#6ee7b7" : "#fca5a5" },
                  ]}
                >
                  {lastResult.message}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Header — floating above overlay */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={handleBack}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Barcode Validation</Text>
          <Text style={styles.headerSubtitle}>
            {scanComplete
              ? "All items scanned!"
              : `${remainingItems.length} item${remainingItems.length !== 1 ? "s" : ""} remaining`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() =>
            setCameraFacing((f) => (f === "back" ? "front" : "back"))
          }
        >
          <MaterialCommunityIcons
            name="camera-flip-outline"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Results bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.dragHandle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetContent}
        >
          {/* ── Overall progress card ── */}
          <View style={[styles.card, scanComplete && styles.cardComplete]}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.cardIconWrap,
                  {
                    backgroundColor: scanComplete
                      ? "rgba(0,168,107,0.1)"
                      : "#f8fafc",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={scanComplete ? "check-circle" : "progress-check"}
                  size={18}
                  color={scanComplete ? "#00A86B" : "#64748b"}
                />
              </View>
              <Text style={styles.cardTitle}>
                {scanComplete ? "Scan Complete!" : "Scan Progress"}
              </Text>
              <View style={[styles.badge, scanComplete && styles.badgeGreen]}>
                <Text
                  style={[
                    styles.badgeText,
                    scanComplete && styles.badgeTextGreen,
                  ]}
                >
                  {totalScanned}/{totalOrder}
                </Text>
              </View>
            </View>

            <AnimatedBar
              pct={overallPct}
              color={scanComplete ? "#00A86B" : "#3b82f6"}
              height={7}
            />

            <View style={styles.progressFooter}>
              <Text style={styles.progressFooterText}>
                Scanned: {totalScanned}
              </Text>
              <Text style={styles.progressFooterText}>
                Remaining: {totalOrder - totalScanned}
              </Text>
            </View>
          </View>

          {/* ── Items to scan ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <MaterialCommunityIcons
                  name="format-list-checkbox"
                  size={18}
                  color="#64748b"
                />
              </View>
              <Text style={styles.cardTitle}>Items to Scan</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {remainingItems.length} left
                </Text>
              </View>
            </View>

            {remainingItems.length > 0 ? (
              <View style={styles.itemsList}>
                {remainingItems.map((item, i) => {
                  const prog = getItemProgress(item);
                  return (
                    <View
                      key={`${item.sku}_${i}`}
                      style={[
                        styles.itemRow,
                        i === remainingItems.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <View style={styles.itemMeta}>
                          <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                          {item.product?.barcode && (
                            <Text style={styles.itemBarcode}>
                              {" "}
                              · {item.product.barcode}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.itemProgress}>
                        <Text style={styles.itemQty}>
                          {prog.scannedQuantity}/{item.quantity}
                        </Text>
                        <AnimatedBar
                          pct={prog.pct}
                          color="#00A86B"
                          height={4}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="check-all"
                  size={40}
                  color="#00A86B"
                />
                <Text style={styles.emptyStateText}>All items scanned!</Text>
              </View>
            )}
          </View>

          {/* ── Scanned items chips ── */}
          {scannedItems.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.cardIconWrap,
                    { backgroundColor: "rgba(0,168,107,0.1)" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={18}
                    color="#00A86B"
                  />
                </View>
                <Text style={styles.cardTitle}>Scanned</Text>
                <View style={[styles.badge, styles.badgeGreen]}>
                  <Text style={[styles.badgeText, styles.badgeTextGreen]}>
                    {scannedItems.length}
                  </Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {scannedItems.map((item, i) => (
                  <View key={`chip_${i}`} style={styles.chip}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={13}
                      color="#00A86B"
                    />
                    <Text style={styles.chipName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.chipQty}>
                      {item.scannedQuantity}/{item.quantity}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Actions ── */}
          <TouchableOpacity
            style={[
              styles.completeBtn,
              scanComplete && styles.completeBtnSuccess,
              scannedItems.length === 0 && styles.completeBtnDisabled,
            ]}
            onPress={handleCompleteValidation}
            disabled={scannedItems.length === 0 || isProcessing}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={scanComplete ? "check-circle" : "check-all"}
              size={20}
              color="#fff"
            />
            <Text style={styles.completeBtnText}>
              {scanComplete ? "Complete ✓" : "Complete Validation"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleBack}
            disabled={isProcessing}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Processing indicator — small, non-blocking */}
      {isProcessing && (
        <View style={styles.processingPill}>
          <ActivityIndicator size="small" color="#00A86B" />
          <Text style={styles.processingText}>Processing…</Text>
        </View>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loadingFull: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },

  // Permission
  permissionContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  permissionIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  permissionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#00A86B",
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  permissionBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Camera overlay — flex-based
  dimTop: { height: "18%", backgroundColor: "rgba(0,0,0,0.65)" },
  dimMiddle: { flexDirection: "row", height: FRAME_SIZE },
  dimSide: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  dimBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
  },

  // Scan frame
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  corner: {
    position: "absolute",
    width: CORNER_LEN,
    height: CORNER_LEN,
    borderColor: "#00A86B",
  },
  cTL: {
    top: -1,
    left: -1,
    borderTopWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderTopLeftRadius: 10,
  },
  cTR: {
    top: -1,
    right: -1,
    borderTopWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderTopRightRadius: 10,
  },
  cBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderBottomLeftRadius: 10,
  },
  cBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#00A86B",
    opacity: 0.9,
  },

  // Instructions
  instructionsWrap: { alignItems: "center", gap: 8 },
  instructionsText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  resultPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  resultPillText: { fontSize: 12, fontWeight: "700" },

  // Header
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },

  // Bottom sheet — fixed height, ~55% of screen
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },

  // Cards — matches design system
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: 16,
  },
  cardComplete: { borderColor: "rgba(0,168,107,0.3)" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: "#0f172a" },

  // Badges
  badge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeGreen: { backgroundColor: "rgba(0,168,107,0.1)" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  badgeTextGreen: { color: "#00A86B" },

  // Progress bar
  barTrack: { backgroundColor: "#f1f5f9", borderRadius: 6, overflow: "hidden" },
  barFill: { borderRadius: 6 },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressFooterText: { fontSize: 12, color: "#64748b", fontWeight: "600" },

  // Items list
  itemsList: { gap: 0 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
    gap: 12,
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 3,
    lineHeight: 18,
  },
  itemMeta: { flexDirection: "row" },
  itemSku: { fontSize: 11, color: "#94a3b8" },
  itemBarcode: { fontSize: 11, color: "#64748b" },
  itemProgress: { alignItems: "flex-end", gap: 5, minWidth: 56 },
  itemQty: { fontSize: 12, fontWeight: "700", color: "#0f172a" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyStateText: { fontSize: 14, color: "#00A86B", fontWeight: "700" },

  // Scanned chips
  chipsRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  chip: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
    gap: 4,
    minWidth: 88,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  chipName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    maxWidth: 84,
  },
  chipQty: { fontSize: 10, color: "#00A86B", fontWeight: "700" },

  // Action buttons
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
  },
  completeBtnSuccess: { backgroundColor: "#059669" },
  completeBtnDisabled: { backgroundColor: "#cbd5e1" },
  completeBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cancelBtn: { paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { color: "#64748b", fontSize: 14, fontWeight: "600" },

  // Processing pill — small, non-blocking (replaces full-screen overlay)
  processingPill: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15,23,42,0.85)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  processingText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});

export default QRScanValidationScreen;
