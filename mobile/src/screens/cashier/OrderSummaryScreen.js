import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { confirmOrder } from "../../api/order.api";

const OrderSummaryScreen = ({ route, navigation }) => {
  const { transactionData, orderDetails } = route.params;

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate item count and total quantity
  const { itemCount, totalQuantity } = useMemo(() => {
    const items = orderDetails?.items || [];
    return {
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    };
  }, [orderDetails]);

  const handleComplete = async () => {
    try {
      // Prepare order data for MongoDB
      const orderData = {
        user: orderDetails.user,
        cashier: orderDetails.cashier?.cashierId || orderDetails.cashier,
        items: orderDetails.items.map((item) => ({
          product: item.product?._id || item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          categoryType: item.categoryType,
          isGroceryDiscountEligible:
            item.isBNPCEligible || item.isGroceryDiscountEligible,
          promoApplied: item.promoApplied || false,
        })),
        baseAmount: transactionData.amounts.subtotal,
        groceryEligibleSubtotal: transactionData.amounts.eligibleSubtotal,
        weeklyCapRemainingAtCheckout: transactionData.caps.remainingDiscountCap,
        seniorPwdDiscountAmount: transactionData.amounts.totalDiscount,
        pointsUsed: orderDetails.voucher?.pointsUsed || 0,
        finalAmountPaid: transactionData.amounts.finalTotal,
        pointsEarned: Math.floor(transactionData.amounts.finalTotal / 100) * 10, // Example: 10 points per ₱100
        status: "CONFIRMED",
        confirmedAt: new Date(),
      };

      // console.log('Submitting order to MongoDB:', JSON.stringify(orderData, null, 2));

      const result = await confirmOrder(orderData);

      Alert.alert(
        "Transaction Complete",
        `Order #${transactionData.checkoutCode} has been processed successfully.`,
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to home or receipt print screen
              navigation.navigate("DrawTabs");
            },
          },
        ],
      );
    } catch (error) {
      console.error("Failed to complete order:", error);
      Alert.alert("Error", "Failed to complete transaction. Please try again.");
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Transaction",
      "Are you sure you want to cancel this transaction?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            // Navigate back or to cancellation screen
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handlePrintReceipt = () => {
    // Implement receipt printing logic here
    Alert.alert("Print Receipt", "Receipt sent to printer.", [{ text: "OK" }]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Ionicons name="receipt" size={24} color="#111827" />
            <Text style={styles.headerTitle}>Order Summary</Text>
          </View>
          <Text style={styles.orderNumber}>
            #{transactionData.checkoutCode}
          </Text>
          <Text style={styles.timestamp}>
            {formatDate(transactionData.timestamp)}
          </Text>
        </View>

        {/* Customer & Cashier Info */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>
                {transactionData.customerType === "senior"
                  ? "Senior Citizen"
                  : transactionData.customerType === "pwd"
                    ? "PWD"
                    : "Regular"}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cashier</Text>
              <Text style={styles.infoValue}>
                {orderDetails.cashier?.name || "Cashier"}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Summary */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basket" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Items</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Items</Text>
              <Text style={styles.statValue}>{itemCount}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Quantity</Text>
              <Text style={styles.statValue}>{totalQuantity}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>BNPC Eligible</Text>
              <Text style={styles.statValue}>
                {orderDetails.items?.filter((i) => i.isBNPCEligible).length ||
                  0}
              </Text>
            </View>
          </View>

          {/* Items List */}
          <View style={styles.itemsList}>
            {orderDetails.items?.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name || item.product?.name || "Product"}
                  </Text>
                  <Text style={styles.itemDetails}>
                    {item.quantity} × ₱{item.unitPrice?.toFixed(2)}
                    {item.isBNPCEligible && (
                      <Text style={styles.bnpcBadge}> • BNPC</Text>
                    )}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ₱{(item.quantity * item.unitPrice).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Amounts Breakdown */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Amounts</Text>
          </View>

          <View style={styles.amountsGrid}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Subtotal</Text>
              <Text style={styles.amountValue}>
                ₱{transactionData.amounts.subtotal.toFixed(2)}
              </Text>
            </View>

            {/* BNPC Discount */}
            {transactionData.amounts.totalDiscount > 0 && (
              <View style={styles.amountRow}>
                <View style={styles.discountRow}>
                  <Ionicons name="pricetag" size={14} color="#059669" />
                  <Text style={styles.amountLabel}>
                    BNPC Discount ({transactionData.customerType.toUpperCase()})
                  </Text>
                </View>
                <Text style={[styles.amountValue, styles.discountValue]}>
                  -₱{transactionData.amounts.totalDiscount.toFixed(2)}
                </Text>
              </View>
            )}

            {/* Voucher Discount */}
            {transactionData.amounts.voucherDiscount > 0 && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Voucher Discount</Text>
                <Text style={[styles.amountValue, styles.discountValue]}>
                  -₱{transactionData.amounts.voucherDiscount.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            {/* Final Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₱{transactionData.amounts.finalTotal.toFixed(2)}
              </Text>
            </View>

            {/* Cash & Change */}
            <View style={styles.cashSection}>
              <View style={styles.cashRow}>
                <Text style={styles.cashLabel}>Cash Received</Text>
                <Text style={styles.cashValue}>
                  ₱{transactionData.amounts.cashReceived.toFixed(2)}
                </Text>
              </View>
              <View style={styles.cashRow}>
                <Text style={styles.cashLabel}>Change Due</Text>
                <Text style={[styles.cashValue, styles.changeValue]}>
                  ₱{transactionData.amounts.changeDue.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* BNPC Caps Summary */}
        {transactionData.amounts.totalDiscount > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={18} color="#374151" />
              <Text style={styles.sectionTitle}>BNPC Booklet Status</Text>
            </View>

            <View style={styles.capsGrid}>
              <View style={styles.capRow}>
                <Text style={styles.capLabel}>Used Before</Text>
                <Text style={styles.capValue}>
                  ₱{transactionData.caps.bookletUsedBefore.toFixed(2)}
                </Text>
              </View>
              <View style={styles.capRow}>
                <Text style={styles.capLabel}>Discount Applied</Text>
                <Text style={styles.capValue}>
                  ₱{transactionData.amounts.totalDiscount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.capDividerFull} />
              <View style={styles.capRow}>
                <Text style={[styles.capLabel, styles.capLabelBold]}>
                  New Booklet Total
                </Text>
                <Text style={[styles.capValue, styles.capValueBold]}>
                  ₱{transactionData.caps.bookletUsedAfter.toFixed(2)}
                </Text>
              </View>
              <View style={styles.capNote}>
                <Ionicons name="information-circle" size={14} color="#6B7280" />
                <Text style={styles.capNoteText}>
                  Update physical booklet with new total
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Points Summary */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Loyalty Points</Text>
          </View>

          <View style={styles.pointsGrid}>
            <View style={styles.pointRow}>
              <Text style={styles.pointLabel}>Points Earned</Text>
              <Text style={styles.pointValue}>
                +{Math.floor(transactionData.amounts.finalTotal / 100) * 10}
              </Text>
            </View>
            {transactionData.amounts.voucherDiscount > 0 && (
              <View style={styles.pointRow}>
                <Text style={styles.pointLabel}>Points Used</Text>
                <Text style={[styles.pointValue, styles.pointsUsed]}>
                  -{orderDetails.voucher?.pointsUsed || 0}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Verification Source */}
        <View style={styles.card}>
          <View style={styles.verificationRow}>
            <Ionicons
              name={
                transactionData.verificationSource === "system"
                  ? "qr-code"
                  : "person"
              }
              size={16}
              color="#6B7280"
            />
            <Text style={styles.verificationText}>
              Verified via{" "}
              {transactionData.verificationSource === "system"
                ? "QR Code"
                : "Manual"}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Ionicons name="close-circle" size={20} color="#DC2626" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.printButton]}
          onPress={handlePrintReceipt}
        >
          <Ionicons name="print" size={20} color="#4B5563" />
          <Text style={styles.printButtonText}>Print</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton]}
          onPress={handleComplete}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 13,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  itemsList: {
    maxHeight: 200,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: "#6B7280",
  },
  bnpcBadge: {
    color: "#059669",
    fontWeight: "600",
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  amountsGrid: {
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    padding: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  amountValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  discountValue: {
    color: "#059669",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  cashSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cashRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cashLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  cashValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  changeValue: {
    color: "#059669",
  },
  capsGrid: {
    backgroundColor: "#F0F9FF",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  capRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  capLabel: {
    fontSize: 14,
    color: "#374151",
  },
  capLabelBold: {
    fontWeight: "600",
  },
  capValue: {
    fontSize: 14,
    color: "#374151",
  },
  capValueBold: {
    fontWeight: "700",
  },
  capDividerFull: {
    height: 1,
    backgroundColor: "#BAE6FD",
    marginVertical: 8,
  },
  capNote: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  capNoteText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
    fontStyle: "italic",
  },
  pointsGrid: {
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    padding: 12,
  },
  pointRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pointLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  pointValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
  },
  pointsUsed: {
    color: "#DC2626",
  },
  verificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  verificationText: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 6,
  },
  actionBar: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelButtonText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 14,
  },
  printButton: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  printButtonText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 14,
  },
  completeButton: {
    backgroundColor: "#111827",
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default OrderSummaryScreen;
