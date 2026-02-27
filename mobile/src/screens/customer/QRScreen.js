import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Alert, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { io } from "socket.io-client";
import { SOCKET_API } from "../../constants/config";
import { useSelector } from "react-redux";

export default function CheckoutQRScreen({ route, navigation }) {
  const {
    checkoutCode,
    token,
    appUser = false,
    offlineMode = false,
    checkoutData = null,
  } = route.params;
  const [status, setStatus] = useState("PROCESSING");
  const [totals, setTotals] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [orderData, setOrderData] = useState({});
  const [cashier, setCashier] = useState("");
  const userState = useSelector((state) => state.auth);
  const offlineQrValue = offlineMode
    ? JSON.stringify({
        checkoutCode,
        user: {
          userId: checkoutData?.user || userState.user?.userId || null,
          userName: checkoutData?.userName || userState.user?.name || null,
          userEmail: checkoutData?.userEmail || userState.user?.email || null,
        },
        cartSnapshot: {
          items: checkoutData?.cartSnapshot?.items || [],
        },
        totals: checkoutData?.totals || null,
      })
    : null;
  const qrValue = offlineMode && offlineQrValue ? offlineQrValue : checkoutCode;

  // Animation for smooth progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Steps progress visual
  const steps = [
    { key: "PROCESSING", label: "Processing" },
    { key: "SCANNED", label: "Scanned" },
    { key: "LOCKED", label: "Validating" },
    { key: "PAID", label: "Payment" },
    { key: "COMPLETE", label: "Complete" },
  ];

  // Calculate progress percentage based on status
  const getProgressPercentage = () => {
    switch (status) {
      case "PROCESSING":
        return 20; // 1 out of 5 steps (20%)
      case "SCANNED":
        return 40; // 2 out of 5 steps (40%)
      case "LOCKED":
        return 60; // 3 out of 5 steps (60%)
      case "PAID":
        return 80; // 4 out of 5 steps (80%)
      case "COMPLETE":
        return 100; // 5 out of 5 steps (100%)
      default:
        return 20;
    }
  };

  // Animate progress bar when status changes
  useEffect(() => {
    const targetProgress = getProgressPercentage();

    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [status]);

  // Get step index for visual indicators
  const getCompletedSteps = () => {
    switch (status) {
      case "PROCESSING":
        return 1;
      case "SCANNED":
        return 2;
      case "LOCKED":
        return 3;
      case "PAID":
        return 4;
      case "COMPLETE":
        return 5;
      default:
        return 1;
    }
  };

  const completedSteps = getCompletedSteps();

  useEffect(() => {
    // Skip socket connection for offline mode
    if (offlineMode) {
      console.log("🔌 [QR SCREEN] Offline mode - skipping socket connection");
      return;
    }

    const socket = io(SOCKET_API, {
      auth: {
        token,
      },
    });

    socket.on("connected", ({ success }) => {
      if (!success) navigation.goBack();
      socket.emit(`checkout:join`, { checkoutCode });
    });

    socket.on("checkout:state", (data) => {
      // console.log("checkout:state", data);
      setStatus(data.status || "PROCESSING");
      setTotals(data.totals);
    });

    socket.on("checkout:scanned", ({ cashier, status, totals }) => {
      // console.log("checkout:scanned", cashier, status, totals);
      setStatus("SCANNED");
      setCashier(cashier);
      if (totals) setTotals(totals);
    });

    socket.on("checkout:locked", ({ checkoutData }) => {
      // console.log("checkout:locked", checkoutData);
      setStatus("LOCKED");
      if (checkoutData?.totals) setTotals(checkoutData.totals);
    });

    socket.on("checkout:paid", ({}) => {
      setStatus("PAID");
    });

    socket.on("checkout:complete", ({ orderId, orderData }) => {
      setOrderId(orderId);
      setStatus("COMPLETE");

      setTimeout(() => {
        navigation.navigate("Shared", {
          screen: "Reciept",
          params: { orderId, checkoutCode, orderData, cashier },
        });
      }, 1500);
    });

    socket.on("checkout:cancelled", ({ reason }) => {
      Alert.alert(
        "Checkout Cancelled",
        reason || "The checkout was cancelled by the cashier.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [token, checkoutCode, offlineMode]);

  const renderStatusMessage = () => {
    switch (status) {
      case "PROCESSING":
        return "Show QR code to cashier";
      case "SCANNED":
        return "QR code scanned";
      case "LOCKED":
        return "Cashier is validating items";
      case "PAID":
        return "Processing payment";
      case "COMPLETE":
        return "Payment successful!";
      default:
        return "Processing...";
    }
  };

  const renderTotals = () => {
    if (!totals) return null;

    return (
      <View style={styles.totalsContainer}>
        <Text style={styles.totalsTitle}>Order Total</Text>
        <View style={styles.totalsRow}>
          <Text style={styles.finalTotalValue}>
            ₱
            {totals.finalTotal?.toFixed(2) ||
              totals.subtotal?.toFixed(2) ||
              "0.00"}
          </Text>
        </View>
      </View>
    );
  };

  // Interpolate the animated value for width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Checkout</Text>
          <Text style={styles.statusMessage}>{renderStatusMessage()}</Text>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <View style={styles.qrWrapper}>
            <QRCode
              value={qrValue}
              size={220}
              backgroundColor="white"
              color="#000000"
            />
          </View>
          <Text style={styles.codeText}>{checkoutCode}</Text>
        </View>

        {/* Totals Display */}
        {renderTotals()}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Offline Mode Note */}
        {offlineMode && (
          <View style={styles.offlineNoteContainer}>
            <MaterialCommunityIcons
              name="wifi-off"
              size={20}
              color="#F59E0B"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.offlineNoteTitle}>Offline Checkout</Text>
            <Text style={styles.offlineNoteText}>
              Show this QR code to the cashier. They will verify items and
              process payment.
            </Text>
          </View>
        )}

        {/* Progress Bar - Only show when online */}
        {!offlineMode && (
          <View style={styles.progressContainer}>
            {/* Smooth Animated Progress Bar */}
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[styles.progressBarFill, { width: progressWidth }]}
              />
            </View>

            {/* Step Indicators */}
            <View style={styles.stepsContainer}>
              {steps.map((step, index) => (
                <View key={step.key} style={styles.stepIndicator}>
                  <View
                    style={[
                      styles.stepDot,
                      index < completedSteps
                        ? styles.stepDotCompleted
                        : styles.stepDotPending,
                    ]}
                  />
                  <Text
                    style={[
                      styles.stepLabel,
                      index < completedSteps
                        ? styles.stepLabelCompleted
                        : styles.stepLabelPending,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Success Message */}
        {status === "COMPLETE" && (
          <View style={styles.successOverlay}>
            <Text style={styles.successText}>✓ Payment Successful</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

import { MaterialCommunityIcons } from "@expo/vector-icons";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
  qrSection: {
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },
  qrWrapper: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  codeText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  totalsContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  totalsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  finalTotalValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#00A86B",
  },
  offlineNoteContainer: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FCD34D",
    alignItems: "center",
  },
  offlineNoteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  offlineNoteText: {
    fontSize: 12,
    color: "#B45309",
    textAlign: "center",
    lineHeight: 18,
  },
  // Progress Container
  progressContainer: {
    marginBottom: 30,
    width: "100%",
    alignItems: "center",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    width: "100%",
    marginBottom: 20,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#00A86B",
    borderRadius: 4,
  },
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  stepIndicator: {
    alignItems: "center",
    flex: 1,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  stepDotCompleted: {
    backgroundColor: "#00A86B",
  },
  stepDotPending: {
    backgroundColor: "#E2E8F0",
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  stepLabelCompleted: {
    color: "#00A86B",
  },
  stepLabelPending: {
    color: "#94A3B8",
  },
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  successText: {
    fontSize: 24,
    color: "#00A86B",
    fontWeight: "700",
  },
});
