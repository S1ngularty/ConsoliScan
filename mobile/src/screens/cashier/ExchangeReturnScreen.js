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
  StatusBar,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { io } from "socket.io-client";

// API functions
import {
  validateExchangeQR,
  validateReplacementItem,
  completeExchange,
} from "../../api/exchange.api";
import { SOCKET_API } from "../../constants/config";
import { getToken } from "../../utils/authUtil";

const FRAME_SIZE = 260;
const CORNER_LEN = 28;
const CORNER_W = 3;

// ─── Animated progress indicator ─────────────────────────────────────────────
const AnimatedProgressBar = ({ percent, color = "#10B981" }) => {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: percent,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [percent]);

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: color,
            width: width.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
};

// ─── Flash feedback ─────────────────────────────────────────────────────────
const useScanFeedback = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  const colorRef = useRef("#10B981");

  const flash = useCallback((success, color = null) => {
    colorRef.current = color || (success ? "#10B981" : "#EF4444");
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

// ─── Step Indicator ──────────────────────────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { key: "SCAN_QR", label: "Scan QR", icon: "qrcode" },
    { key: "VALIDATE", label: "Verify", icon: "check-circle" },
    { key: "SCAN_BARCODE", label: "Scan Item", icon: "barcode" },
    { key: "VALIDATE_REPLACEMENT", label: "Validate", icon: "check-circle" },
    { key: "COMPLETE", label: "Done", icon: "check-decagram" },
  ];

  return (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => {
        const currentIndex = steps.findIndex((s) => s.key === currentStep);
        const isActive = index <= currentIndex;
        const isComplete = index < currentIndex;

        return (
          <View key={step.key} style={{ flex: 1, alignItems: "center" }}>
            <View
              style={[
                styles.stepDotIndicator,
                isComplete && styles.stepDotComplete,
                isActive && !isComplete && styles.stepDotActive,
              ]}
            >
              <MaterialCommunityIcons
                name={isComplete ? "check" : step.icon}
                size={16}
                color={isActive ? "#fff" : "#94A3B8"}
              />
            </View>
            <Text
              style={[
                styles.stepLabelIndicator,
                isActive && styles.stepLabelIndicatorActive,
              ]}
            >
              {step.label}
            </Text>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepLineIndicator,
                  isComplete && styles.stepLineComplete,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const ExchangeReturnScreen = ({ route, navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState("SCAN_QR"); // SCAN_QR, VALIDATE, SCAN_BARCODE, VALIDATE_REPLACEMENT, COMPLETE
  const [scanMode, setScanMode] = useState("qr"); // qr or barcode
  const [cameraFacing, setCameraFacing] = useState("back");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);

  // Exchange data
  const [exchange, setExchange] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [itemInfo, setItemInfo] = useState(null);
  const [validatedReplacement, setValidatedReplacement] = useState(null);
  const [replacement, setReplacement] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Socket reference
  const socketRef = useRef(null);

  // Animations
  const scanAnim = useRef(new Animated.Value(0)).current;
  const { opacity: flashOpacity, colorRef, flash } = useScanFeedback();
  const lastScanRef = useRef(0);

  // Scan line animation
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

  // Setup WebSocket for real-time updates
  useFocusEffect(
    useCallback(() => {
      const setupSocket = async () => {
        try {
          const token = await getToken();
          const socket = io(SOCKET_API, {
            auth: { token },
          });

          socketRef.current = socket;

          socket.on("connected", () => {
            console.log("Cashier socket connected for exchange");
          });

          socket.on("exchange:error", (data) => {
            console.error("Exchange error:", data.message);
            setErrorMessage(data.message);
            flash(false, "#EF4444");
          });
        } catch (error) {
          console.error("Socket setup error:", error);
        }
      };

      setupSocket();

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }, []),
  );

  // Handle QR scan (validate exchange)
  const handleQRScanned = useCallback(
    ({ data }) => {
      const now = Date.now();
      if (now - lastScanTime < 1200 || isProcessing) return;
      setLastScanTime(now);

      const qrToken = data?.trim();
      if (!qrToken) return;

      setIsProcessing(true);
      setErrorMessage("");

      (async () => {
        try {
          const result = await validateExchangeQR(qrToken);

          if (!result.success) {
            flash(false);
            setErrorMessage(result.message || "Validation failed");
            setIsProcessing(false);
            return;
          }

          // Success: store exchange details
          flash(true);
          setExchange({
            _id: result.exchangeId,
            status: result.status,
            price: result.price,
          });
          setOrderInfo(result.order);
          setItemInfo(result.item);
          setStep("VALIDATE");
          setIsProcessing(false);
        } catch (error) {
          flash(false);
          setErrorMessage(error.message || "QR validation failed");
          setIsProcessing(false);
        }
      })();
    },
    [isProcessing],
  );

  // Handle barcode scan (validate replacement)
  const handleBarcodeScanned = useCallback(
    ({ data }) => {
      const now = Date.now();
      if (now - lastScanTime < 1200 || isProcessing) return;
      setLastScanTime(now);

      const barcodeValue = data?.trim();
      if (!barcodeValue) return;

      setIsProcessing(true);
      setErrorMessage("");

      (async () => {
        try {
          console.log(
            `Validating replacement ${exchange._id} with barcode ${barcodeValue}`,
          );
          const result = await validateReplacementItem(
            exchange._id,
            barcodeValue,
          );

          if (!result.success) {
            flash(false);
            setErrorMessage(result.message || "Replacement validation failed");
            setIsProcessing(false);
            return;
          }

          // Success: store validated replacement and move to confirmation step
          flash(true);
          setValidatedReplacement(result.product);
          setStep("VALIDATE_REPLACEMENT");
          setIsProcessing(false);
        } catch (error) {
          flash(false);
          setErrorMessage(error.message || "Barcode scan failed");
          setIsProcessing(false);
        }
      })();
    },
    [exchange, isProcessing],
  );

  // Permission screen
  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="camera-off" size={48} color="#94A3B8" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan exchange QR codes and barcodes
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── SCAN QR STEP ───────────────────────────────────────────────────────────
  if (step === "SCAN_QR") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBackBtn}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#0F172A"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exchange Returns</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step Indicator */}
        <StepIndicator currentStep="SCAN_QR" />

        {/* Camera */}
        <CameraView
          style={styles.camera}
          facing={cameraFacing}
          onBarcodeScanned={handleQRScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />

        {/* Overlay with scan frame - absolute positioning */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Scan frame */}
          <View style={styles.frameContainer}>
            <View style={styles.scanFrame}>
              {/* Corners */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Scan line */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-FRAME_SIZE / 2, FRAME_SIZE / 2],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </View>

          {/* Flash feedback */}
          <Animated.View
            style={[
              styles.flashFeedback,
              {
                opacity: flashOpacity,
                backgroundColor: colorRef.current,
              },
            ]}
          />
        </View>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <View style={styles.instructionCard}>
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={24}
              color="#10B981"
            />
            <Text style={styles.instructionText}>
              Scan customer's exchange QR code
            </Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorMessage}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={18}
                color="#EF4444"
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {isProcessing ? (
            <ActivityIndicator
              size="large"
              color="#10B981"
              style={{ marginTop: 16 }}
            />
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  // ── VALIDATE STEP ──────────────────────────────────────────────────────────
  if (step === "VALIDATE") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setStep("SCAN_QR");
              setExchange(null);
              setOrderInfo(null);
              setItemInfo(null);
              setValidatedReplacement(null);
            }}
            style={styles.headerBackBtn}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#0F172A"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exchange Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step Indicator */}
        <StepIndicator currentStep="VALIDATE" />

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Order info card */}
          {orderInfo && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="receipt"
                  size={20}
                  color="#10B981"
                />
                <Text style={styles.cardTitle}>Order Information</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Order Code</Text>
                  <Text style={styles.infoValue}>{orderInfo.checkoutCode}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>
                    {new Date(orderInfo.confirmedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Item info card */}
          {itemInfo && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={20}
                  color="#3B82F6"
                />
                <Text style={styles.cardTitle}>Item Being Returned</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>
                    {itemInfo.name}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>SKU</Text>
                  <Text style={styles.infoValue}>{itemInfo.sku}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Price</Text>
                  <Text style={styles.infoValue}>
                    ₱{itemInfo.unitPrice?.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Exchange status card */}
          {exchange && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="information"
                  size={20}
                  color="#F59E0B"
                />
                <Text style={styles.cardTitle}>Exchange Status</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.statusBadge}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color="#10B981"
                  />
                  <Text style={styles.statusText}>Item verified and ready</Text>
                </View>
              </View>
            </View>
          )}

          {/* Next step instruction */}
          <View style={styles.instructionBox}>
            <MaterialCommunityIcons
              name="barcode-scan"
              size={32}
              color="#10B981"
            />
            <Text style={styles.instructionTitle}>Next Step</Text>
            <Text style={styles.instructionDesc}>
              Ask customer to select a replacement item with the same price
            </Text>
          </View>
        </ScrollView>

        {/* Action button */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={() => {
              setScanMode("barcode");
              setStep("SCAN_BARCODE");
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.gradientButton}
            >
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="#fff"
              />
              <Text style={styles.buttonText}>Scan Replacement Item</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── SCAN BARCODE STEP ──────────────────────────────────────────────────────
  if (step === "SCAN_BARCODE") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setStep("VALIDATE");
              setValidatedReplacement(null);
              setErrorMessage("");
            }}
            style={styles.headerBackBtn}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#0F172A"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Replacement</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step Indicator */}
        <StepIndicator currentStep="SCAN_BARCODE" />

        {/* Camera */}
        <CameraView
          style={styles.camera}
          facing={cameraFacing}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["ean8", "ean13", "upc_a", "upc_e", "code128"],
          }}
        />

        {/* Overlay with scan frame - absolute positioning */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Scan frame */}
          <View style={styles.frameContainer}>
            <View style={styles.scanFrame}>
              {/* Corners */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Scan line */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-FRAME_SIZE / 2, FRAME_SIZE / 2],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </View>

          {/* Flash feedback */}
          <Animated.View
            style={[
              styles.flashFeedback,
              {
                opacity: flashOpacity,
                backgroundColor: colorRef.current,
              },
            ]}
          />
        </View>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <View style={styles.instructionCard}>
            <MaterialCommunityIcons name="barcode" size={24} color="#3B82F6" />
            <Text style={styles.instructionText}>
              Scan replacement item barcode
            </Text>
            <Text style={styles.instructionSubtext}>
              Must be same price as original (₱{itemInfo?.unitPrice?.toFixed(2)}
              )
            </Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorMessage}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={18}
                color="#EF4444"
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {isProcessing ? (
            <ActivityIndicator
              size="large"
              color="#3B82F6"
              style={{ marginTop: 16 }}
            />
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  // ── VALIDATE REPLACEMENT STEP ────────────────────────────────────────────
  if (step === "VALIDATE_REPLACEMENT" && validatedReplacement) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setStep("SCAN_BARCODE");
              setValidatedReplacement(null);
              setErrorMessage("");
            }}
            style={styles.headerBackBtn}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#0F172A"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Replacement</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step Indicator */}
        <StepIndicator currentStep="VALIDATE_REPLACEMENT" />

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Original item card */}
          {itemInfo && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="package-remove"
                  size={20}
                  color="#EF4444"
                />
                <Text style={styles.cardTitle}>Original Item</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>
                    {itemInfo.name}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Price</Text>
                  <Text style={styles.infoValue}>
                    ₱{itemInfo.unitPrice?.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Validated replacement item card */}
          {validatedReplacement && (
            <View
              style={[styles.card, { borderColor: "#10B981", borderWidth: 2 }]}
            >
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#10B981"
                />
                <Text style={[styles.cardTitle, { color: "#10B981" }]}>
                  Replacement Item (Validated)
                </Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>
                    {validatedReplacement.name}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>SKU</Text>
                  <Text style={styles.infoValue}>
                    {validatedReplacement.sku}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Price</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: "#10B981", fontWeight: "700" },
                    ]}
                  >
                    ₱{validatedReplacement.price?.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Stock Available</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: "#10B981", fontWeight: "600" },
                    ]}
                  >
                    {validatedReplacement.stockQuantity} units
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Validation success message */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: "#F0FDF4",
                borderColor: "#10B981",
                borderWidth: 1,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#10B981",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={24}
                  color="#ffffff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#10B981",
                  }}
                >
                  Product Validation Successful
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#059669",
                    marginTop: 2,
                  }}
                >
                  Item is in stock and price matches
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={async () => {
              setIsProcessing(true);
              setErrorMessage("");
              try {
                const result = await completeExchange(
                  exchange._id,
                  validatedReplacement.barcode,
                );
                if (!result.success) {
                  flash(false);
                  setErrorMessage(
                    result.message || "Exchange completion failed",
                  );
                  setIsProcessing(false);
                  return;
                }
                flash(true);
                setReplacement(result.replacement);
                setStep("COMPLETE");
                setIsProcessing(false);
              } catch (error) {
                flash(false);
                setErrorMessage(error.message || "Failed to complete exchange");
                setIsProcessing(false);
              }
            }}
            activeOpacity={0.8}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.gradientButton}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#fff"
              />
              <Text style={styles.buttonText}>Complete Exchange</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {isProcessing && (
          <View
            style={{
              position: "absolute",
              bottom: 80,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── COMPLETE STEP ──────────────────────────────────────────────────────────
  if (step === "COMPLETE" && replacement) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#F0FDF4" }]}>
        <StatusBar backgroundColor="#F0FDF4" barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Exchange Complete</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step Indicator */}
        <StepIndicator currentStep="COMPLETE" />

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success animation */}
          <View style={styles.successContainer}>
            <View style={styles.successIconBox}>
              <MaterialCommunityIcons
                name="check-circle"
                size={80}
                color="#10B981"
              />
            </View>
            <Text style={styles.successTitle}>Exchange Completed!</Text>
            <Text style={styles.successSubtitle}>
              Replacement item has been recorded
            </Text>
          </View>

          {/* Replacement details */}
          {replacement && (
            <View style={[styles.card, { marginTop: 24 }]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={20}
                  color="#10B981"
                />
                <Text style={styles.cardTitle}>Replacement Item</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>
                    {replacement.name}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>SKU</Text>
                  <Text style={styles.infoValue}>{replacement.sku}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Barcode</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {replacement.barcode}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Price</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: "#10B981", fontWeight: "700" },
                    ]}
                  >
                    ₱{replacement.price?.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Receipt note */}
          <View style={styles.receiptCard}>
            <MaterialCommunityIcons name="printer" size={20} color="#3B82F6" />
            <Text style={styles.receiptText}>Print receipt for customer</Text>
          </View>
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={() => {
              setStep("SCAN_QR");
              setExchange(null);
              setOrderInfo(null);
              setItemInfo(null);
              setValidatedReplacement(null);
              setReplacement(null);
              setErrorMessage("");
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.gradientButton}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.buttonText}>Next Exchange</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Permission screen
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
  },
  permissionText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  stepDotIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  stepDotActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  stepDotComplete: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  stepLabelIndicator: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  stepLabelIndicatorActive: {
    color: "#10B981",
    fontWeight: "600",
  },
  stepLineIndicator: {
    position: "absolute",
    width: "100%",
    height: 2,
    backgroundColor: "#E2E8F0",
    top: 16,
    left: "50%",
    zIndex: -1,
  },
  stepLineComplete: {
    backgroundColor: "#10B981",
  },

  // Camera
  camera: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Frame for scan area
  frameContainer: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 8,
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: CORNER_LEN,
    height: CORNER_LEN,
    borderColor: "#10B981",
    borderWidth: CORNER_W,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: "absolute",
    width: "100%",
    height: 2,
    backgroundColor: "#10B981",
    opacity: 0.8,
  },

  // Flash feedback
  flashFeedback: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },

  // Bottom section
  bottomSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  instructionCard: {
    alignItems: "center",
    paddingVertical: 10,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 8,
  },
  instructionSubtext: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  errorMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    marginLeft: 8,
    fontWeight: "500",
  },

  // Scroll content
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Cards
  card: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F1F5F9",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginLeft: 8,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "600",
    marginLeft: 8,
  },

  // Step Indicator Styles
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  indicatorStep: {
    alignItems: "center",
    flex: 1,
  },
  indicatorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  indicatorCircleActive: {
    backgroundColor: "#10B981",
  },
  indicatorCircleCurrent: {
    borderWidth: 2,
    borderColor: "#10B981",
  },
  indicatorNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  stepLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
    textAlign: "center",
  },
  stepLabelActive: {
    color: "#10B981",
    fontWeight: "600",
  },

  // Instruction box
  instructionBox: {
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 10,
    marginBottom: 20,
  },

  instructionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#10B981",
    marginTop: 10,
  },
  instructionDesc: {
    fontSize: 12,
    color: "#059669",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 16,
  },

  // Success container
  successContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  successIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10B981",
    marginTop: 16,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
  },

  // Receipt card
  receiptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 32,
  },
  receiptText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
    marginLeft: 8,
  },

  // Buttons
  actionButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  proceedButton: {
    overflow: "hidden",
    borderRadius: 8,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Progress
  progressTrack: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
});

export default ExchangeReturnScreen;
