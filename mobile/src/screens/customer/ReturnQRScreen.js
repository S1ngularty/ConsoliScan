import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  Animated,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { getToken } from "../../utils/authUtil";
import { io } from "socket.io-client";
import { SOCKET_API } from "../../constants/config";

const ReturnQRScreen = ({ navigation, route }) => {
  const { returnId, qrToken, itemName, itemPrice } = route.params || {};
  const [returnStatus, setReturnStatus] = useState("PENDING");
  const [inspectionStatus, setInspectionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  /* ── Setup WebSocket ── */
  useEffect(() => {
    if (!returnId) return;

    const setupSocket = async () => {
      try {
        const token = await getToken();

        console.log("[Return QR] Connecting to socket at:", SOCKET_API);

        const socket = io(SOCKET_API, {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("[Return QR] Socket connected, joining room:", returnId);
          socket.emit("return:join", { returnId });
        });

        socket.on("disconnect", () => {
          console.log("[Return QR] Socket disconnected");
        });

        socket.on("connect_error", (error) => {
          console.error("[Return QR] Connection error:", error.message);
          console.error("[Return QR] Socket URL:", SOCKET_API);
          console.error("[Return QR] Has token:", !!token);
        });

        socket.on("connect_timeout", () => {
          console.error("[Return QR] Connection timeout");
        });

        socket.on("reconnect_attempt", (attemptNumber) => {
          console.log(`[Return QR] Reconnection attempt ${attemptNumber}`);
        });

        socket.on("reconnect_failed", () => {
          console.error("[Return QR] Reconnection failed");
          Alert.alert(
            "Connection Failed",
            "Unable to connect to the server. Please check your internet connection.",
            [{ text: "OK" }],
          );
        });

        // ── Initial state when joining room ──
        socket.on("return:state", (data) => {
          console.log("[Return QR] Received state:", data);
          if (data.status) {
            setReturnStatus(data.status);
          }
          if (data.inspectionStatus) {
            setInspectionStatus(data.inspectionStatus);
          }
        });

        // ── Error handling ──
        socket.on("return:error", (data) => {
          console.error("[Return QR] Error from server:", data);
          Alert.alert("Error", data.message || "Something went wrong");
        });

        // ── Return validated by cashier ──
        socket.on("return:validated", (data) => {
          console.log("[Return QR] Validated:", data);
          setReturnStatus("VALIDATED");
        });

        // ── Inspection in progress ──
        socket.on("return:inspecting", () => {
          console.log("[Return QR] Inspecting");
          setReturnStatus("INSPECTING");
        });

        // ── Inspection passed ──
        socket.on("return:inspection-passed", (data) => {
          console.log("[Return QR] Inspection passed:", data);
          setReturnStatus("INSPECTED");
          setInspectionStatus("PASSED");
        });

        // ── Inspection failed ──
        socket.on("return:inspection-failed", (data) => {
          console.log("[Return QR] Inspection failed:", data);
          setReturnStatus("REJECTED");
          setInspectionStatus("REJECTED");
          setTimeout(() => {
            navigation.navigate("HomeTabs", { screen: "OrderHistory" });
          }, 2000);
        });

        // ── Return completed ──
        socket.on("return:completed", (data) => {
          console.log("[Return QR] Completed:", data);
          setReturnStatus("COMPLETED");
          setTimeout(() => {
            navigation.navigate("HomeTabs", { screen: "OrderHistory" });
          }, 2000);
        });

        // ── Return rejected ──
        socket.on("return:rejected", (data) => {
          console.log("[Return QR] Rejected:", data);
          setReturnStatus("REJECTED");
          setTimeout(() => {
            navigation.navigate("HomeTabs", { screen: "OrderHistory" });
          }, 2000);
        });
      } catch (error) {
        console.error("[Return QR] Socket setup error:", error);
      }
    };

    setupSocket();

    return () => {
      if (socketRef.current) {
        console.log("[Return QR] Cleaning up socket");
        socketRef.current.emit("return:leave", { returnId });
        socketRef.current.disconnect();
      }
    };
  }, [returnId, navigation]);

  const handleCopyQR = () => {
    Clipboard.setString(qrToken);
    Alert.alert("Copied", "QR token copied to clipboard");
  };

  const handleShareQR = async () => {
    try {
      await Share.share({
        message: `Return ID: ${returnId}\n\nShow this QR code to the cashier to proceed with your return.`,
        title: "Return QR Code",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share QR code");
    }
  };

  const getStatusColor = () => {
    switch (returnStatus) {
      case "VALIDATED":
        return "#3B82F6";
      case "INSPECTED":
        return "#10B981";
      case "REJECTED":
        return "#EF4444";
      case "COMPLETED":
        return "#10B981";
      default:
        return "#F59E0B";
    }
  };

  const getStatusText = () => {
    switch (returnStatus) {
      case "PENDING":
        return "Ready - Show QR to cashier";
      case "VALIDATED":
        return "Item received - Inspection in progress";
      case "INSPECTING":
        return "Inspecting...";
      case "INSPECTED":
        return "Inspection passed - Choose your option";
      case "REJECTED":
        return "Inspection failed";
      case "COMPLETED":
        return "Return complete!";
      default:
        return returnStatus;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#1E293B"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Return QR Code</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Status Bar */}
        <View
          style={[
            styles.statusBar,
            {
              backgroundColor: getStatusColor() + "15",
              borderColor: getStatusColor(),
            },
          ]}
        >
          <MaterialCommunityIcons
            name={
              returnStatus === "COMPLETED"
                ? "check-circle"
                : returnStatus === "REJECTED"
                  ? "alert-circle"
                  : "information"
            }
            size={18}
            color={getStatusColor()}
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.centerContent}>
          {returnStatus === "PENDING" && (
            <>
              <Text style={styles.instruction}>
                Show this QR code to the cashier
              </Text>

              {/* QR Code */}
              <View style={styles.qrContainer}>
                <View style={styles.qrBackground}>
                  <QRCode
                    value={qrToken}
                    size={220}
                    color="#1E293B"
                    backgroundColor="#fff"
                  />
                </View>
              </View>

              {/* Item Info */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{itemName}</Text>
                <Text style={styles.itemPrice}>₱{itemPrice?.toFixed(2)}</Text>
              </View>

              {/* Return ID */}
              <View style={styles.idCard}>
                <Text style={styles.idLabel}>Return ID</Text>
                <Text style={styles.idValue}>
                  {returnId?.slice(-8).toUpperCase()}
                </Text>
              </View>
            </>
          )}

          {returnStatus !== "PENDING" && (
            <View style={styles.statusContainer}>
              <MaterialCommunityIcons
                name={
                  returnStatus === "COMPLETED"
                    ? "check-circle"
                    : returnStatus === "REJECTED"
                      ? "close-circle"
                      : "clock-outline"
                }
                size={64}
                color={getStatusColor()}
              />
              <Text style={[styles.statusMessage, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
              {returnStatus === "INSPECTING" && (
                <ActivityIndicator
                  color={getStatusColor()}
                  size="large"
                  style={{ marginTop: 16 }}
                />
              )}
            </View>
          )}
        </View>

        {/* Actions */}
        {returnStatus === "PENDING" && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleCopyQR}
            >
              <MaterialCommunityIcons
                name="content-copy"
                size={18}
                color="#00A86B"
              />
              <Text style={styles.secondaryButtonText}>Copy ID</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleShareQR}
            >
              <MaterialCommunityIcons
                name="share-variant"
                size={18}
                color="#fff"
              />
              <Text style={styles.primaryButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}

        {returnStatus === "COMPLETED" && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                navigation.navigate("HomeTabs", { screen: "OrderHistory" })
              }
            >
              <MaterialCommunityIcons name="check" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>View Order History</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
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
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  instruction: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 24,
    textAlign: "center",
  },
  qrContainer: {
    marginBottom: 28,
  },
  qrBackground: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  itemInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#00A86B",
  },
  idCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  idLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  idValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    fontFamily: "monospace",
  },
  statusContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#00A86B",
  },
});

export default ReturnQRScreen;
