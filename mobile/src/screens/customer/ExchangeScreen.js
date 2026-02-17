/**
 * ExchangeScreen.js
 * screens/ExchangeScreen.js
 *
 * Receives full order object from OrderHistoryScreen
 * Items have both _id (cart item id) and product (actual product id)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { LinearGradient } from "expo-linear-gradient";
import { io } from "socket.io-client";

// Import API functions
import { initiateExchange, cancelExchange } from "../../api/exchange.api";

// Import config
import { SOCKET_API } from "../../constants/config";
import { getToken } from "../../utils/authUtil";

const { width: SCREEN_W } = Dimensions.get("window");
const QR_SIZE = Math.min(SCREEN_W * 0.65, 260);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtPrice = (n) => `₱${(n || 0).toFixed(2)}`;
const fmtDate = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

// ─── Progress Indicator ──────────────────────────────────────────────
const ProgressStep = ({ number, label, isActive, isComplete }) => (
  <View style={styles.progressStep}>
    <View
      style={[
        styles.stepCircle,
        isComplete && styles.stepCircleComplete,
        isActive && styles.stepCircleActive,
      ]}
    >
      {isComplete ? (
        <MaterialCommunityIcons name="check" size={14} color="#fff" />
      ) : (
        <Text style={styles.stepNumber}>{number}</Text>
      )}
    </View>
    <Text
      style={[
        styles.stepLabel,
        (isActive || isComplete) && styles.stepLabelActive,
      ]}
    >
      {label}
    </Text>
  </View>
);

const ProgressBar = ({ currentStep }) => {
  const steps = [
    { key: "SELECT", label: "Select" },
    { key: "QR", label: "QR Code" },
    { key: "WAIT", label: "Validate" },
    { key: "SWAP", label: "Complete" },
  ];

  return (
    <View style={styles.progressBar}>
      {steps.map((step, index) => {
        const stepIndex = Object.keys({ SELECT: 0, QR: 1, WAIT: 2, SWAP: 3 })[
          step.key
        ];
        const isActive = steps.findIndex((s) => s.key === currentStep) >= index;
        const isComplete =
          steps.findIndex((s) => s.key === currentStep) > index;

        return (
          <View key={step.key} style={{ flex: 1 }}>
            <ProgressStep
              number={index + 1}
              label={step.label}
              isActive={isActive}
              isComplete={isComplete}
            />
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.progressLine,
                  isComplete && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────
const StatusBadge = ({ status, size = "medium" }) => {
  const config = {
    PENDING: {
      color: "#F59E0B",
      bg: "#FEF3C7",
      icon: "clock-outline",
      label: "Pending",
    },
    VALIDATED: {
      color: "#3B82F6",
      bg: "#DBEAFE",
      icon: "check-circle-outline",
      label: "Verified",
    },
    COMPLETED: {
      color: "#10B981",
      bg: "#D1FAE5",
      icon: "check-decagram",
      label: "Completed",
    },
    EXPIRED: {
      color: "#EF4444",
      bg: "#FEE2E2",
      icon: "clock-alert-outline",
      label: "Expired",
    },
    CANCELLED: {
      color: "#6B7280",
      bg: "#F3F4F6",
      icon: "close-circle-outline",
      label: "Cancelled",
    },
  };

  const cfg = config[status] || config.PENDING;
  const isSmall = size === "small";

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: cfg.bg },
        isSmall && styles.statusBadgeSmall,
      ]}
    >
      <MaterialCommunityIcons
        name={cfg.icon}
        size={isSmall ? 12 : 14}
        color={cfg.color}
      />
      <Text
        style={[
          styles.statusBadgeText,
          { color: cfg.color },
          isSmall && styles.statusBadgeTextSmall,
        ]}
      >
        {cfg.label}
      </Text>
    </View>
  );
};

// ─── Countdown Timer ────────────────────────────────────────────────────────
const CountdownTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    if (!expiresAt) return;

    const expiryDate = new Date(expiresAt).getTime();
    const totalDuration = 10 * 60 * 1000; // 15 minutes
    const startDate = expiryDate - totalDuration;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, expiryDate - now);

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);

      const totalElapsed = now - startDate;
      const progressValue = Math.max(0, 1 - totalElapsed / totalDuration);
      setProgress(progressValue);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const isLow = timeLeft && parseInt(timeLeft.split(":")[0]) < 2;

  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerHeader}>
        <MaterialCommunityIcons
          name="timer-sand"
          size={16}
          color={isLow ? "#EF4444" : "#64748B"}
        />
        <Text style={[styles.timerLabel, isLow && styles.timerLabelLow]}>
          {timeLeft ? `${timeLeft} remaining` : "Calculating..."}
        </Text>
      </View>
      <View style={styles.timerProgressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` },
            isLow && styles.progressFillLow,
          ]}
        />
      </View>
    </View>
  );
};

// ─── Item Card ────────────────────────────────────────────────────────
const ItemCard = ({ item, onPress, disabled, isSelected }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isExchanged = item.status === "EXCHANGED";

  const getIcon = () => {
    if (item.name?.toLowerCase().includes("bear brand")) return "cup";
    if (item.name?.toLowerCase().includes("piattos")) return "food";
    if (item.name?.toLowerCase().includes("coffee")) return "coffee";
    if (item.name?.toLowerCase().includes("milk")) return "cup";
    return "package-variant";
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 60,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.itemCard,
          isExchanged && styles.itemCardExchanged,
          isSelected && styles.itemCardSelected,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => !isExchanged && !disabled && onPress(item)}
        disabled={isExchanged || disabled}
        activeOpacity={1}
      >
        <LinearGradient
          colors={isExchanged ? ["#F8FAFC", "#F1F5F9"] : ["#F0FDF4", "#E6F7E6"]}
          style={styles.itemIcon}
        >
          <MaterialCommunityIcons
            name={isExchanged ? "check-circle" : getIcon()}
            size={24}
            color={isExchanged ? "#94A3B8" : "#10B981"}
          />
        </LinearGradient>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
          </View>
        </View>

        <View style={styles.itemRight}>
          <Text style={styles.itemPrice}>{fmtPrice(item.unitPrice)}</Text>
          {isExchanged ? (
            <View style={styles.exchangedTag}>
              <Text style={styles.exchangedTagText}>Exchanged</Text>
            </View>
          ) : (
            <View style={styles.selectIndicator}>
              <MaterialCommunityIcons
                name="arrow-right-circle"
                size={20}
                color="#10B981"
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Order Header ─────────────────────────────────────────────────────
const OrderHeader = ({ order }) => (
  <View style={styles.orderHeader}>
    <View style={styles.orderHeaderLeft}>
      <View style={styles.orderIcon}>
        <MaterialCommunityIcons name="receipt" size={18} color="#10B981" />
      </View>
      <View>
        <Text style={styles.orderCode}>Order {order.checkoutCode}</Text>
        <Text style={styles.orderDate}>
          {fmtDate(order.confirmedAt)} · {fmtPrice(order.finalAmountPaid)}
        </Text>
      </View>
    </View>
  </View>
);

// ─── QR View ──────────────────────────────────────────────────────────
const QRView = ({
  exchange,
  selectedItem,
  selectedOrder,
  onCancel,
  onReset,
  onComplete,
}) => {
  const status = exchange.status || "PENDING";
  const isComplete = status === "COMPLETED";
  const isExpired = status === "EXPIRED";
  const isPending = status === "PENDING";

  return (
    <View style={styles.qrContainer}>
      {/* Header with item info */}
      <View style={styles.qrHeader}>
        <View style={styles.qrHeaderLeft}>
          <Text style={styles.qrHeaderLabel}>Exchanging</Text>
          <Text style={styles.qrHeaderTitle} numberOfLines={1}>
            {exchange.itemName || selectedItem?.name}
          </Text>
        </View>
        <View style={styles.qrHeaderPrice}>
          <Text style={styles.qrHeaderPriceLabel}>Amount</Text>
          <Text style={styles.qrHeaderPriceValue}>
            {fmtPrice(exchange.price || selectedItem?.unitPrice)}
          </Text>
        </View>
      </View>

      {/* QR Code Section */}
      <View style={styles.qrSection}>
        <View style={styles.qrWrapper}>
          {isComplete ? (
            <LinearGradient
              colors={["#D1FAE5", "#A7F3D0"]}
              style={styles.qrCompleteBox}
            >
              <MaterialCommunityIcons
                name="check-decagram"
                size={80}
                color="#10B981"
              />
              <Text style={styles.qrCompleteTitle}>Exchange Complete!</Text>
              <Text style={styles.qrCompleteText}>
                Collect your replacement from the cashier
              </Text>
            </LinearGradient>
          ) : isExpired ? (
            <LinearGradient
              colors={["#FEE2E2", "#FECACA"]}
              style={styles.qrExpiredBox}
            >
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={80}
                color="#EF4444"
              />
              <Text style={[styles.qrCompleteTitle, { color: "#EF4444" }]}>
                QR Expired
              </Text>
              <Text style={styles.qrCompleteText}>
                Generate a new exchange request
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.qrActiveBox}>
              <QRCode
                value={exchange.qrToken}
                size={QR_SIZE}
                color="#0F172A"
                backgroundColor="transparent"
                ecl="M"
              />
            </View>
          )}
        </View>

        {isPending && (
          <View style={styles.scanHint}>
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={16}
              color="#64748B"
            />
            <Text style={styles.scanHintText}>Cashier will scan this QR</Text>
          </View>
        )}
      </View>

      {/* Status & Timer */}
      <View style={styles.qrStatusArea}>
        <StatusBadge status={status} />
        {!isComplete && !isExpired && (
          <CountdownTimer expiresAt={exchange.expiresAt} />
        )}
      </View>

      {/* Steps Timeline */}
      {!isComplete && !isExpired && (
        <View style={styles.stepsTimeline}>
          <Text style={styles.stepsTitle}>Exchange Process</Text>

          <View style={styles.stepItem}>
            <View style={[styles.stepDot, styles.stepDotActive]}>
              <Text style={styles.stepDotText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Show QR to cashier</Text>
              <Text style={styles.stepDesc}>
                Present your item and this QR code
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                status === "VALIDATED" || status === "COMPLETED"
                  ? styles.stepDotActive
                  : styles.stepDotInactive,
              ]}
            >
              <Text
                style={[
                  styles.stepDotText,
                  status !== "VALIDATED" &&
                    status !== "COMPLETED" && { color: "#94A3B8" },
                ]}
              >
                2
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text
                style={[
                  styles.stepTitle,
                  status !== "VALIDATED" &&
                    status !== "COMPLETED" &&
                    styles.stepTitleInactive,
                ]}
              >
                Cashier verifies item
              </Text>
              <Text style={styles.stepDesc}>
                Item condition will be checked
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                status === "COMPLETED"
                  ? styles.stepDotActive
                  : styles.stepDotInactive,
              ]}
            >
              <Text
                style={[
                  styles.stepDotText,
                  status !== "COMPLETED" && { color: "#94A3B8" },
                ]}
              >
                3
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text
                style={[
                  styles.stepTitle,
                  status !== "COMPLETED" && styles.stepTitleInactive,
                ]}
              >
                Pick replacement
              </Text>
              <Text style={styles.stepDesc}>
                Choose a same-price item from the shelf
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Button */}
      <View style={styles.qrActionArea}>
        {isComplete ? (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={onComplete}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.gradientButton}
            >
              <MaterialCommunityIcons name="history" size={20} color="#fff" />
              <Text style={styles.buttonText}>View Order History</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : isExpired ? (
          <TouchableOpacity
            style={styles.expiredButton}
            onPress={onReset}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#10B981" />
            <Text style={[styles.buttonText, { color: "#10B981" }]}>
              Generate New QR
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
            <Text style={[styles.buttonText, { color: "#EF4444" }]}>
              Cancel Exchange
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
const ExchangeScreen = ({ navigation, route }) => {
  // ── Receive full order object and itemId (product ID) from OrderHistoryScreen ──
  const { order, itemId } = route.params || {};

  // console.log("ExchangeScreen received order:", order);
  // console.log("ExchangeScreen itemId:", itemId);

  const [step, setStep] = useState("SELECT");
  const [initiating, setInitiating] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [exchange, setExchange] = useState(null);

  const socketRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Auto-select item if itemId (product ID) is provided
  useEffect(() => {
    if (!order || !itemId || exchange) return;

    // Match by product field since itemId is the product ID
    const item = order.items?.find((i) => i.product === itemId);

    if (item && item.status !== "EXCHANGED") {
      handleSelectItem(item);
    }
  }, [order, itemId]);

  // WebSocket listener for real-time status updates
  useEffect(() => {
    console.log("[Socket Effect] Exchange changed:", exchange);
    if (!exchange?.exchangeId) {
      console.log(
        "[Socket Effect] No exchange.exchangeId, skipping socket setup",
      );
      return;
    }

    console.log(
      "[Socket Effect] Setting up socket for exchange:",
      exchange.exchangeId,
    );

    (async () => {
      const token = await getToken();
      console.log(
        "[Exchange Client] Connecting socket for exchange:",
        exchange.exchangeId,
      );

      const socket = io(SOCKET_API, {
        auth: { token },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log(
          "[Exchange Client] Socket connected, emitting exchange:join with exchangeId:",
          exchange.exchangeId,
        );
        socket.emit("exchange:join", { exchangeId: exchange.exchangeId });
      });

      socket.on("connected", ({ success }) => {
        console.log("[Exchange Client] Received connected event:", success);
      });

      socket.on("exchange:state", (data) => {
        console.log("[Exchange Client] Received exchange:state:", data);
        setExchange((prev) => ({
          ...prev,
          ...data,
        }));
      });

      socket.on("exchange:validated", (data) => {
        console.log("[Exchange Client] Received exchange:validated:", data);
        setExchange((prev) => ({
          ...prev,
          status: "VALIDATED",
          ...data,
        }));

        // Navigate to scanner for customer to scan replacement
        navigation.navigate("ExchangeScanner", {
          exchangeId: exchange.exchangeId,
          originalPrice: exchange.price,
        });
      });

      socket.on("exchange:completed", (data) => {
        console.log("[Exchange Client] Received exchange:completed:", data);
        setExchange((prev) => ({
          ...prev,
          status: "COMPLETED",
          ...data,
        }));
      });

      socket.on("exchange:expired", (data) => {
        console.log("[Exchange Client] Received exchange:expired:", data);
        setExchange((prev) => ({
          ...prev,
          status: "EXPIRED",
          ...data,
        }));
      });

      socket.on("exchange:cancelled", (data) => {
        console.log("[Exchange Client] Received exchange:cancelled:", data);
        setExchange((prev) => ({
          ...prev,
          status: "CANCELLED",
          ...data,
        }));
      });
    })();

    return () => {
      console.log("[Socket Effect] Cleanup - disconnecting socket");
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [exchange?.exchangeId]);

  const handleSelectItem = useCallback(
    async (item) => {
      setSelectedItem(item);
      setInitiating(true);
      try {
        console.log("Selected item:", item);
        // Use the product ID for exchange API
        const result = await initiateExchange(order._id, item.product);
        setExchange(result);
        setStep("QR");
      } catch (e) {
        const errorMsg =
          e.response?.status === 400 &&
          e.response?.data?.message?.includes("already been exchanged")
            ? `This item has already been exchanged. Refreshing your order...`
            : e.message || "Failed to initiate exchange";

        Alert.alert("Exchange Error", errorMsg, [
          {
            text: "OK",
            onPress: async () => {
              // If item was already exchanged, mark it as exchanged in local state
              if (
                e.response?.status === 400 &&
                e.response?.data?.message?.includes("already been exchanged")
              ) {
                setOrder((prev) => ({
                  ...prev,
                  items: prev.items.map((i) =>
                    i._id === item._id ? { ...i, status: "EXCHANGED" } : i,
                  ),
                }));
              }
              setSelectedItem(null);
            },
          },
        ]);
      } finally {
        setInitiating(false);
      }
    },
    [order],
  );

  const handleCancel = useCallback(() => {
    Alert.alert("Cancel Exchange", "Cancel this exchange request?", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          if (socketRef.current) {
            socketRef.current.disconnect();
          }
          try {
            if (exchange?._id) await cancelExchange(exchange._id);
          } catch {}
          setStep("SELECT");
          setExchange(null);
          setSelectedItem(null);
        },
      },
    ]);
  }, [exchange]);

  const handleReset = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setStep("SELECT");
    setExchange(null);
    setSelectedItem(null);
  };

  // Filter only exchangeable items (those not already exchanged)
  const exchangeableItems = useCallback(() => {
    return order?.items?.filter((item) => item.status !== "EXCHANGED") || [];
  }, [order]);

  // QR Step
  if (step === "QR" && exchange) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Custom Header */}
        <View style={styles.modernHeader}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={
              exchange.status === "COMPLETED" ? handleReset : handleCancel
            }
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#0F172A"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exchange QR</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.qrContentContainer}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <QRView
              exchange={exchange}
              selectedItem={selectedItem}
              selectedOrder={order}
              onCancel={handleCancel}
              onReset={handleReset}
              onComplete={() => navigation.navigate("OrderHistory")}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // SELECT Step
  const items = exchangeableItems();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.modernHeader}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exchange Item</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Info Banner */}
          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="information"
              size={20}
              color="#3B82F6"
            />
            <Text style={styles.infoCardText}>
              Exchange within 7 days. Replacement must be same price.
            </Text>
          </View>

          {/* Order Header */}
          {order && <OrderHeader order={order} />}

          {/* Items */}
          <View style={styles.itemsContainer}>
            {items.length > 0 ? (
              items.map((item, idx) => (
                <ItemCard
                  key={item._id || `item-${idx}`}
                  item={item}
                  onPress={handleSelectItem}
                  disabled={initiating || item.status === "EXCHANGED"}
                  isSelected={selectedItem?._id === item._id}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={48}
                    color="#CBD5E1"
                  />
                </View>
                <Text style={styles.emptyTitle}>No items to exchange</Text>
                <Text style={styles.emptyText}>
                  All items in this order have already been exchanged.
                </Text>
                <TouchableOpacity
                  style={styles.shopButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.shopButtonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer Hint */}
          {items.length > 0 && (
            <View style={styles.footerCard}>
              <MaterialCommunityIcons
                name="help-circle"
                size={20}
                color="#64748B"
              />
              <Text style={styles.footerText}>
                Tap any item above to start the exchange process
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Loading Overlay */}
      {initiating && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.overlayText}>Generating your QR code...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Header Styles
  modernHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  // Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  qrContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: "#1E40AF",
    lineHeight: 20,
  },

  // Order Header
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  orderHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  orderCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 13,
    color: "#64748B",
  },

  // Items Container
  itemsContainer: {
    gap: 12,
    marginBottom: 16,
  },

  // Item Card
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  itemCardSelected: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  itemCardExchanged: {
    opacity: 0.6,
    backgroundColor: "#F8FAFC",
  },
  itemIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 14,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemQty: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  exchangedTag: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  exchangedTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  selectIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  shopButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#10B981",
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Footer
  footerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },

  // Progress Bar Styles
  progressBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    alignItems: "center",
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  stepCircleActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#10B981",
  },
  stepCircleComplete: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94A3B8",
  },
  stepLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
    textAlign: "center",
  },
  stepLabelActive: {
    color: "#10B981",
    fontWeight: "600",
  },
  progressLine: {
    position: "absolute",
    left: "50%",
    top: 18,
    width: "100%",
    height: 2,
    backgroundColor: "#E2E8F0",
    marginLeft: -8,
    zIndex: -1,
  },
  progressLineActive: {
    backgroundColor: "#10B981",
  },

  // QR Step Styles
  qrContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  qrHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  qrHeaderLeft: {
    flex: 1,
  },
  qrHeaderLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "500",
  },
  qrHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginRight: 12,
  },
  qrHeaderPrice: {
    alignItems: "flex-end",
  },
  qrHeaderPriceLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "500",
  },
  qrHeaderPriceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
  },
  qrSection: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  qrWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrActiveBox: {
    width: QR_SIZE + 36,
    height: QR_SIZE + 36,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  qrCompleteBox: {
    width: QR_SIZE + 60,
    height: QR_SIZE + 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  qrExpiredBox: {
    width: QR_SIZE + 60,
    height: QR_SIZE + 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  qrCompleteTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 8,
  },
  qrCompleteText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  scanHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
  },
  scanHintText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  qrStatusArea: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: "center",
    gap: 10,
  },

  // Status Badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadgeTextSmall: {
    fontSize: 11,
  },

  // Timer
  timerContainer: {
    width: "100%",
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  timerLabelLow: {
    color: "#EF4444",
  },
  timerProgressBar: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 2,
  },
  progressFillLow: {
    backgroundColor: "#EF4444",
  },

  // Steps Timeline
  stepsTimeline: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepDotActive: {
    backgroundColor: "#10B981",
  },
  stepDotInactive: {
    backgroundColor: "#E2E8F0",
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 2,
  },
  stepTitleInactive: {
    color: "#94A3B8",
  },
  stepDesc: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },

  // Action Area
  qrActionArea: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  completeButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  expiredButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    gap: 8,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    gap: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Overlay
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  overlayText: {
    fontSize: 14,
    color: "#0F172A",
    marginTop: 12,
    fontWeight: "500",
  },
});

export default ExchangeScreen;
