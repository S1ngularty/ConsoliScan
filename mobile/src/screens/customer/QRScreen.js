import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { io } from "socket.io-client";
import { SOCKET_API } from "../../constants/config";

export default function CheckoutQRScreen({ route, navigation }) {
  const { checkoutCode, expiresAt, token } = route.params;
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState("WAITING"); // WAITING, SCANNED, LOCKED, PAID
  const [totals, setTotals] = useState(null);

  const steps = [
    { key: "WAITING", label: "Waiting" },
    { key: "SCANNED", label: "Scanned" },
    { key: "LOCKED", label: "Locked" },
    { key: "PAID", label: "Paid" },
  ];

  const getStepIndex = () => {
    return steps.findIndex((step) => step.key === status);
  };

  const currentStepIndex = getStepIndex();

  useEffect(() => {
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
      setStatus(data.status || "WAITING");
      setTotals(data.totals);
    });

    socket.on("checkout:scanned", ({ cashier }) => {
      console.log(cashier);
      setStatus("SCANNED");
    });

    socket.on("checkout:locked", ({ finalTotals }) => {
      setTotals(finalTotals);
      setStatus("LOCKED");
    });

    socket.on("checkout:paid", ({ orderId }) => {
      setStatus("PAID");
      setTimeout(() => {
        navigation.replace("OrderComplete", { orderId });
      }, 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, checkoutCode]);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (status !== "WAITING") clearInterval(interval);
      if (diff <= 0) {
        clearInterval(interval);
        Alert.alert(
          "Checkout Expired",
          "Your checkout session expired. Please try again.",
        );
        navigation.goBack();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, status]);

  const renderStep = (step, index) => {
    const isCompleted = index < currentStepIndex;
    const isCurrent = index === currentStepIndex;
    const isUpcoming = index > currentStepIndex;

    return (
      <View key={step.key} style={styles.stepContainer}>
        {/* Step Circle */}
        <View
          style={[
            styles.stepCircle,
            isCompleted && styles.stepCircleCompleted,
            isCurrent && styles.stepCircleCurrent,
            isUpcoming && styles.stepCircleUpcoming,
          ]}
        >
          {isCompleted ? (
            <Text style={styles.stepCheck}>✓</Text>
          ) : (
            <Text
              style={[
                styles.stepNumber,
                isCurrent && styles.stepNumberCurrent,
                isUpcoming && styles.stepNumberUpcoming,
              ]}
            >
              {index + 1}
            </Text>
          )}
        </View>

        {/* Step Label */}
        <Text
          style={[
            styles.stepLabel,
            isCompleted && styles.stepLabelCompleted,
            isCurrent && styles.stepLabelCurrent,
            isUpcoming && styles.stepLabelUpcoming,
          ]}
        >
          {step.label}
        </Text>
      </View>
    );
  };

  const renderStatusMessage = () => {
    switch (status) {
      case "WAITING":
        return "Show QR to cashier";
      case "SCANNED":
        return "Scanning items...";
      case "LOCKED":
        return "Confirm totals";
      case "PAID":
        return "Payment complete!";
      default:
        return "Processing...";
    }
  };

  const renderTotals = () => {
    if (!totals || status === "WAITING") return null;

    return (
      <View style={styles.totalsContainer}>
        <Text style={styles.totalsTitle}>Order Total</Text>
        <View style={styles.totalsRow}>
          <Text style={styles.finalTotalValue}>
            ₱{totals.finalTotal?.toFixed(2) || "0.00"}
          </Text>
        </View>
      </View>
    );
  };

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
              value={checkoutCode}
              size={status === "PAID" ? 180 : 220}
              backgroundColor="white"
              color={status === "PAID" ? "#00A86B" : "#000000"}
            />
          </View>
          <Text style={styles.codeText}>{checkoutCode}</Text>

          {status !== "PAID" && (
            <Text style={styles.timer}>
              Expires in <Text style={styles.bold}>{timeLeft}</Text>
            </Text>
          )}
        </View>

        {/* Totals Display */}
        {renderTotals()}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Status Bar - Fixed at Bottom */}
        <View style={styles.statusBar}>
          {/* Progress Line */}
          <View style={styles.progressLineBackground}>
            <View
              style={[
                styles.progressLineFill,
                {
                  width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                },
              ]}
            />
          </View>

          {/* Steps */}
          <View style={styles.stepsContainer}>{steps.map(renderStep)}</View>
        </View>

        {/* Success Message */}
        {status === "PAID" && (
          <View style={styles.successOverlay}>
            <Text style={styles.successText}>✓ Payment Successful</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

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
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  timer: {
    fontSize: 14,
    color: "#444",
  },
  bold: {
    fontWeight: "700",
    color: "#00A86B",
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
  // Status Bar at Bottom
  statusBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
  },
  progressLineBackground: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressLineFill: {
    height: "100%",
    backgroundColor: "#00A86B",
    borderRadius: 2,
  },
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  stepContainer: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#E2E8F0",
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },
  stepCircleCompleted: {
    backgroundColor: "#00A86B",
    borderColor: "#00A86B",
  },
  stepCircleCurrent: {
    backgroundColor: "#00A86B",
    borderColor: "#00A86B",
  },
  stepCircleUpcoming: {
    backgroundColor: "#fff",
    borderColor: "#CBD5E1",
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  stepNumberCurrent: {
    color: "#FFFFFF",
  },
  stepNumberUpcoming: {
    color: "#94A3B8",
  },
  stepCheck: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  stepLabelCompleted: {
    color: "#00A86B",
  },
  stepLabelCurrent: {
    color: "#00A86B",
  },
  stepLabelUpcoming: {
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
