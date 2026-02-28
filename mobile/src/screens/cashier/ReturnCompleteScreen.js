import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ReturnCompleteScreen = ({ navigation, route }) => {
  const { returnId, fulfillmentType, fulfillmentDetails } = route.params;
  const rawPoints =
    fulfillmentDetails?.loyaltyPointsAwarded ??
    fulfillmentDetails?.loyaltyAmount ??
    fulfillmentDetails?.points ??
    0;
  const safePoints = Number.isFinite(Number(rawPoints)) ? Number(rawPoints) : 0;
  const replacementPrice = Number(fulfillmentDetails?.replacementItemPrice);
  const safeReplacementPrice = Number.isFinite(replacementPrice)
    ? replacementPrice
    : 0;

  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate checkmark entrance
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const isLoyalty = fulfillmentType === "loyalty";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Success Animation */}
        <Animated.View
          style={[
            styles.checkmarkContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View
            style={[
              styles.checkmarkCircle,
              isLoyalty
                ? styles.checkmarkCircleLoyalty
                : styles.checkmarkCircleSwap,
            ]}
          >
            <MaterialCommunityIcons
              name={isLoyalty ? "star-circle" : "check-circle"}
              size={64}
              color="#fff"
            />
          </View>
        </Animated.View>

        {/* Success Title */}
        <Text style={styles.successTitle}>Return Completed Successfully!</Text>
        <Text style={styles.successSubtitle}>
          {isLoyalty
            ? "Loyalty points have been awarded"
            : "Replacement item has been prepared"}
        </Text>

        {/* Return Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons
                name="identifier"
                size={20}
                color="#6B7280"
              />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Return ID</Text>
              <Text style={styles.detailValue}>
                {returnId.substring(0, 12)}...
              </Text>
            </View>
          </View>

          <View style={[styles.detailRow, styles.detailBorder]}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={20}
                color="#6B7280"
              />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Completed</Text>
              <Text style={styles.detailValue}>
                {new Date().toLocaleDateString()} at{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>

          <View style={[styles.detailRow, styles.detailBorder]}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons
                name={isLoyalty ? "star" : "swap-horizontal"}
                size={20}
                color={isLoyalty ? "#FBBF24" : "#3B82F6"}
              />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Fulfillment Type</Text>
              <Text style={styles.detailValue}>
                {isLoyalty ? "Loyalty Points Conversion" : "Swap for Same Item"}
              </Text>
            </View>
          </View>
        </View>

        {/* Fulfillment Specific Info */}
        {isLoyalty ? (
          <View style={styles.fulfillmentCard}>
            <View style={styles.fulfillmentHeader}>
              <MaterialCommunityIcons
                name="star-circle"
                size={28}
                color="#FBBF24"
              />
              <Text style={styles.fulfillmentTitle}>
                Loyalty Points Awarded
              </Text>
            </View>

            <View style={styles.pointsBox}>
              <Text style={styles.pointsAmount}>{safePoints}</Text>
              <Text style={styles.pointsLabel}>points added to account</Text>
            </View>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color="#1E40AF"
              />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.infoText}>
                  Customer can use these points in their next purchase
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.fulfillmentCard}>
            <View style={styles.fulfillmentHeader}>
              <MaterialCommunityIcons
                name="swap-horizontal-circle"
                size={28}
                color="#3B82F6"
              />
              <Text style={styles.fulfillmentTitle}>
                Replacement Item Ready
              </Text>
            </View>

            <View style={styles.replacementBox}>
              <Text style={styles.replacementName}>
                {fulfillmentDetails.replacementItemName}
              </Text>
              <View style={styles.replacementDetails}>
                <View style={styles.replaceDetailItem}>
                  <Text style={styles.replaceDetailLabel}>Barcode</Text>
                  <Text style={styles.replaceDetailValue}>
                    {fulfillmentDetails.replacementBarcode ||
                      fulfillmentDetails.replacementProductBarcode ||
                      "N/A"}
                  </Text>
                </View>
                <View style={styles.replaceDetailItem}>
                  <Text style={styles.replaceDetailLabel}>Price</Text>
                  <Text style={styles.replaceDetailValue}>
                    ₱{safeReplacementPrice.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color="#1E40AF"
              />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.infoText}>
                  Item is ready for customer pickup at customer service counter
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              // Navigate to cashier dashboard or returns list
              navigation.popToTop();
            }}
          >
            <MaterialCommunityIcons name="home" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              // Open receipt preview or print
              // For now, just show a toast
            }}
          >
            <MaterialCommunityIcons name="receipt" size={18} color="#6B7280" />
            <Text style={styles.secondaryButtonText}>Print Receipt</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  checkmarkContainer: {
    marginBottom: 24,
  },
  checkmarkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkCircleLoyalty: {
    backgroundColor: "#FBBF24",
  },
  checkmarkCircleSwap: {
    backgroundColor: "#10B981",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "500",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    width: "100%",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  detailBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  detailIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  fulfillmentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
    width: "100%",
  },
  fulfillmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  fulfillmentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
  },
  pointsBox: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FBBF24",
  },
  pointsAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#92400E",
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "600",
  },
  replacementBox: {
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  replacementName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 12,
  },
  replacementDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  replaceDetailItem: {
    flex: 1,
  },
  replaceDetailLabel: {
    fontSize: 11,
    color: "#1E40AF",
    marginBottom: 2,
    fontWeight: "600",
    opacity: 0.8,
  },
  replaceDetailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E40AF",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 8,
    alignItems: "flex-start",
  },
  infoText: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "500",
  },
  actionContainer: {
    width: "100%",
    gap: 12,
    marginTop: 12,
  },
  primaryButton: {
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
    color: "#6B7280",
  },
});

export default ReturnCompleteScreen;
