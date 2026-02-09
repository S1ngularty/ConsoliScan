import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { lockedOrder } from "../../api/checkout.api";

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { checkoutData, checkoutCode } = route.params || {};

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState(checkoutData);
  const [showValidationOptions, setShowValidationOptions] = useState(false);
  const [validationStatus, setValidationStatus] = useState({
    isValidated: false,
    validationMethod: null,
    validationDate: null,
  });

  // Listen for validation result when returning from validation screens
  useFocusEffect(
    React.useCallback(() => {
      // Check if we're returning from validation with a result
      if (route.params?.validationResult) {
        const { validationResult } = route.params;

        if (validationResult.isValidated) {
          setValidationStatus({
            isValidated: true,
            validationMethod: validationResult.validationMethod,
            validationDate: validationResult.validationDate,
          });
          Alert.alert("Success", "Items validated successfully!");
        } else {
          Alert.alert(
            "Validation Incomplete",
            "Some items were not validated. You can re-validate or proceed anyway.",
          );
        }

        // Clear the params to avoid processing again
        navigation.setParams({ validationResult: undefined });
      }
    }, [route.params?.validationResult]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      Alert.alert("Error", "Failed to refresh order details");
    } finally {
      setRefreshing(false);
    }
  };

  const handleValidation = () => {
    setShowValidationOptions(true);
  };

  const handleValidationMethodSelect = (method) => {
    setShowValidationOptions(false);

    // Navigate to validation screens without callback function
    if (method === "object_detection") {
      navigation.navigate("Detection", {
        checkoutCode,
        orderItems: order.items,
        checkoutData: order, // Use checkoutData instead of orderData for consistency
      });
    } else if (method === "qr_scan") {
      navigation.navigate("QRScanValidation", {
        checkoutCode,
        orderItems: order.items,
        checkoutData: order, // Use checkoutData instead of orderData for consistency
      });
    }
  };

  const handleLockOrder = async () => {
    if (!validationStatus.isValidated) {
      Alert.alert(
        "Validation Required",
        "You must validate the items before proceeding.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Validate Now", onPress: handleValidation },
        ],
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await lockedOrder(checkoutCode)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      navigation.navigate("Payment", {
        checkoutCode,
        checkoutData: order,
      });
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to lock order");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            Alert.alert("Order Cancelled", "The order has been cancelled.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          } catch (error) {
            Alert.alert("Error", "Failed to cancel order");
          }
        },
      },
    ]);
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getValidationMethodLabel = (method) => {
    switch (method) {
      case "object_detection":
        return "Object Detection";
      case "qr_scan":
        return "QR Code Scan";
      default:
        return "Not Validated";
    }
  };

  const getEligibilityIcon = () => {
    if (order.userEligibility?.isPWD) {
      return { icon: "account-heart", color: "#2196F3", label: "PWD" };
    }
    if (order.userEligibility?.isSenior) {
      return { icon: "account-star", color: "#FF9800", label: "Senior" };
    }
    return { icon: "account", color: "#666", label: "Regular" };
  };

  const eligibility = getEligibilityIcon();
  const statusColor =
    order.status === "SCANNED"
      ? "#00A86B"
      : order.status === "LOCKED"
        ? "#FF9800"
        : order.status === "PAID"
          ? "#2196F3"
          : "#64748B";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.orderCode}>#{checkoutCode}</Text>
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {order.status}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00A86B"
          />
        }
      >
        {/* Customer & Order Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={22}
              color="#64748B"
            />
            <Text style={styles.cardTitle}>Customer Information</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Customer Type</Text>
              <View style={styles.customerType}>
                <MaterialCommunityIcons
                  name={eligibility.icon}
                  size={16}
                  color={eligibility.color}
                />
                <Text
                  style={[
                    styles.infoValue,
                    { color: eligibility.color, fontWeight: "600" },
                  ]}
                >
                  {eligibility.label}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Items Count</Text>
              <Text style={styles.infoValue}>
                {order.items?.length || 0} items
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Scanned At</Text>
              <Text style={styles.infoValue}>
                {formatTime(order.scannedAt)}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Expires At</Text>
              <Text style={styles.infoValue}>
                {formatTime(order.expiresAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Validation Status */}
        <View
          style={[
            styles.card,
            validationStatus.isValidated
              ? styles.validationSuccessCard
              : styles.validationRequiredCard,
          ]}
        >
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name={
                validationStatus.isValidated ? "shield-check" : "shield-alert"
              }
              size={22}
              color={validationStatus.isValidated ? "#00A86B" : "#EF4444"}
            />
            <Text style={styles.cardTitle}>Item Validation</Text>
            <View
              style={[
                styles.validationStatusBadge,
                validationStatus.isValidated
                  ? styles.validationSuccessBadge
                  : styles.validationRequiredBadge,
              ]}
            >
              <Text
                style={[
                  styles.validationStatusText,
                  validationStatus.isValidated
                    ? styles.validationSuccessText
                    : styles.validationRequiredText,
                ]}
              >
                {validationStatus.isValidated ? "Validated" : "Required"}
              </Text>
            </View>
          </View>

          {validationStatus.isValidated ? (
            <>
              <View style={styles.validationSuccessContent}>
                <View style={styles.validationSuccessRow}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={18}
                    color="#00A86B"
                  />
                  <Text style={styles.validationSuccessLabel}>
                    Validation Complete
                  </Text>
                </View>
                <View style={styles.validationDetails}>
                  <View style={styles.validationDetailRow}>
                    <Text style={styles.validationDetailLabel}>Method:</Text>
                    <Text style={styles.validationDetailValue}>
                      {getValidationMethodLabel(
                        validationStatus.validationMethod,
                      )}
                    </Text>
                  </View>
                  <View style={styles.validationDetailRow}>
                    <Text style={styles.validationDetailLabel}>
                      Validated At:
                    </Text>
                    <Text style={styles.validationDetailValue}>
                      {formatDateTime(validationStatus.validationDate)}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.validateButton, styles.revalidateButton]}
                onPress={handleValidation}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={20}
                  color="#00A86B"
                />
                <Text style={styles.revalidateButtonText}>
                  Re-validate Items
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.validationDescription}>
                You must validate the physical items against the order before
                proceeding. This ensures all items match and are accounted for.
              </Text>

              <TouchableOpacity
                style={styles.validateButton}
                onPress={handleValidation}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={22}
                  color="#FFFFFF"
                />
                <Text style={styles.validateButtonText}>Validate Items</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={22}
              color="#64748B"
            />
            <Text style={styles.cardTitle}>Order Items</Text>
            <Text style={styles.itemsCount}>({order.items?.length || 0})</Text>
          </View>

          <View style={styles.itemsList}>
            {order.items?.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.itemDetails}>
                    {item.isBNPCEligible && (
                      <View style={styles.bnpcBadge}>
                        <MaterialCommunityIcons
                          name="tag"
                          size={10}
                          color="#FFFFFF"
                        />
                        <Text style={styles.bnpcBadgeText}>BNPC</Text>
                      </View>
                    )}
                    <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                  </View>
                </View>

                <View style={styles.itemRight}>
                  <View style={styles.priceRow}>
                    <Text style={styles.itemPrice}>
                      ₱{item.unitPrice.toFixed(2)}
                    </Text>
                    <Text style={styles.itemQuantity}>× {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    ₱{(item.unitPrice * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ₱{(order.totals?.subtotal || 0).toFixed(2)}
            </Text>
          </View>

          {order.discountSnapshot?.discountApplied > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>BNPC Discount</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>
                -₱{(order.discountSnapshot.discountApplied || 0).toFixed(2)}
              </Text>
            </View>
          )}

          {order.voucher?.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Voucher Discount</Text>
              <Text style={[styles.summaryValue, styles.voucherText]}>
                -₱{(order.voucher.discountAmount || 0).toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              ₱{(order.totals?.finalTotal || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={handleCancelOrder}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="close-circle-outline"
            size={20}
            color="#EF4444"
          />
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.lockButton,
            !validationStatus.isValidated && styles.lockButtonDisabled,
          ]}
          onPress={handleLockOrder}
          disabled={
            isLoading ||
            order.status !== "SCANNED" ||
            !validationStatus.isValidated
          }
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="lock-check"
                size={20}
                color={validationStatus.isValidated ? "#FFFFFF" : "#94A3B8"}
              />
              <Text
                style={[
                  styles.lockButtonText,
                  !validationStatus.isValidated &&
                    styles.lockButtonTextDisabled,
                ]}
              >
                Lock & Proceed
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Validation Options Modal */}
      <Modal
        visible={showValidationOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowValidationOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Validation Method</Text>
              <Text style={styles.modalSubtitle}>
                Select how you want to validate items
              </Text>
            </View>

            <TouchableOpacity
              style={styles.validationOption}
              onPress={() => handleValidationMethodSelect("object_detection")}
              activeOpacity={0.7}
            >
              <View style={styles.validationOptionIcon}>
                <MaterialCommunityIcons
                  name="camera"
                  size={32}
                  color="#00A86B"
                />
              </View>
              <View style={styles.validationOptionContent}>
                <Text style={styles.validationOptionTitle}>
                  Object Detection
                </Text>
                <Text style={styles.validationOptionDescription}>
                  Use camera to automatically count items on the counter
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#64748B"
              />
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.validationOption}
              onPress={() => handleValidationMethodSelect("qr_scan")}
              activeOpacity={0.7}
            >
              <View style={styles.validationOptionIcon}>
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={32}
                  color="#00A86B"
                />
              </View>
              <View style={styles.validationOptionContent}>
                <Text style={styles.validationOptionTitle}>QR Code Scan</Text>
                <Text style={styles.validationOptionDescription}>
                  Scan each product's QR code individually
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#64748B"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowValidationOptions(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A86B",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  orderCode: {
    fontSize: 12,
    color: "#E8F5EF",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8F5EF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  validationRequiredCard: {
    borderColor: "#FEE2E2",
  },
  validationSuccessCard: {
    borderColor: "#E8F5EF",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 10,
  },
  validationRequiredBadge: {
    backgroundColor: "#FEF3F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  validationSuccessBadge: {
    backgroundColor: "#F0F9F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  validationRequiredText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
  },
  validationSuccessText: {
    fontSize: 12,
    color: "#00A86B",
    fontWeight: "600",
  },
  validationDescription: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
    lineHeight: 20,
  },
  validationSuccessContent: {
    marginBottom: 20,
  },
  validationSuccessRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  validationSuccessLabel: {
    fontSize: 15,
    color: "#00A86B",
    fontWeight: "600",
    marginLeft: 8,
  },
  validationDetails: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 8,
  },
  validationDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  validationDetailLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  validationDetailValue: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "500",
  },
  validateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  revalidateButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#00A86B",
  },
  revalidateButtonText: {
    color: "#00A86B",
    fontSize: 16,
    fontWeight: "600",
  },
  validateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  itemsCount: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 6,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoItem: {
    width: "48%",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#1E293B",
  },
  customerType: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemsList: {
    gap: 12,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 6,
    lineHeight: 20,
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  bnpcBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF9800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    gap: 4,
  },
  bnpcBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  itemSku: {
    fontSize: 12,
    color: "#94A3B8",
  },
  itemRight: {
    alignItems: "flex-end",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: "#64748B",
    marginRight: 6,
  },
  itemQuantity: {
    fontSize: 12,
    color: "#94A3B8",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  summaryCard: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  discountText: {
    color: "#00A86B",
    fontWeight: "600",
  },
  voucherText: {
    color: "#FF9800",
    fontWeight: "600",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#E8F5EF",
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#00A86B",
  },
  bottomSpacer: {
    height: 20,
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8F5EF",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EF4444",
  },
  cancelButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
  lockButton: {
    backgroundColor: "#00A86B",
  },
  lockButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  lockButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  lockButtonTextDisabled: {
    color: "#94A3B8",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  validationOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  validationOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F0F9F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  validationOptionContent: {
    flex: 1,
  },
  validationOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  validationOptionDescription: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
  },
  modalCancelButton: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  modalCancelText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
  },
});

export default OrderDetailsScreen;
