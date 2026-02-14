import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";

const ReceiptScreen = ({ route, navigation }) => {
  const { orderId, checkoutCode, orderData, cashier } = route.params || {};
  
  // Use the provided data or fallback
  const receiptData = orderData || {};
  console.log(receiptData)
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Extract data from your structure
  const customerType = receiptData.customerType || "regular";
  const cashierName = receiptData.cashier?.name || cashier || "Cashier";
  const items = receiptData.items || [];
  const bnpcData = receiptData.bnpcCaps;

  // Calculate amounts from your data structure
  const amounts = {
    subtotal: receiptData.baseAmount || 0,
    totalDiscount:
      receiptData.bnpcDiscount?.total ||
      receiptData.seniorPwdDiscountAmount ||
      0,
    voucherDiscount: receiptData.voucherDiscount || 0,
    finalTotal: receiptData.finalAmountPaid || 0,
    cashReceived: receiptData.cashTransaction?.cashReceived || 0,
    changeDue: receiptData.cashTransaction?.changeDue || 0,
  };

  // Calculate item count and total quantity
  const itemCount = items.length;
  const totalQuantity = items.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );

  const handlePrint = () => {
    Alert.alert("Print Receipt", "Receipt sent to printer.", [{ text: "OK" }]);
  };

  const handleShare = async () => {
    try {
      const receiptText = `
      GROCERY STORE RECEIPT
      Order #${checkoutCode || receiptData.checkoutCode || "N/A"}
      Date: ${formatDate(receiptData.confirmedAt || receiptData.createdAt)}
      Cashier: ${cashierName}
      ${customerType !== "regular" ? `Customer: ${customerType === "senior" ? "Senior Citizen" : "PWD"}` : ""}
      
      Items:
      ${items
        .map(
          (item) =>
            `${item.quantity || 1}x ${item.name || "Item"}: ₱${((item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}`,
        )
        .join("\n")}
      
      Subtotal: ₱${amounts.subtotal.toFixed(2)}
      ${
        amounts.totalDiscount > 0
          ? `BNPC Discount: -₱${amounts.totalDiscount.toFixed(2)}`
          : ""
      }
      ${
        amounts.voucherDiscount > 0
          ? `Voucher: -₱${amounts.voucherDiscount.toFixed(2)}`
          : ""
      }
      
      TOTAL: ₱${amounts.finalTotal.toFixed(2)}
      Cash: ₱${amounts.cashReceived.toFixed(2)}
      Change: ₱${amounts.changeDue.toFixed(2)}
      
      ${bnpcData ? `Booklet Total: ₱${bnpcData.discountCap?.usedAfter?.toFixed(2) || "N/A"}` : ""}
      
      Thank you for shopping with us!
      `;

      await Share.share({
        message: receiptText,
        title: "Receipt",
      });
    } catch (error) {
      Alert.alert("Error", "Could not share receipt");
    }
  };

  const handleDone = () => {
    if(receiptData.user){
      navigation.navigate("HomeTabs",{
      screen:"Home"
    })
    }
    else{
      navigation.navigate("Home");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Receipt</Text>
        <Text style={styles.orderNumber}>
          #{checkoutCode || receiptData.checkoutCode || "N/A"}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Store Header */}
        <View style={styles.storeHeader}>
          <Text style={styles.storeName}>GROCERY STORE</Text>
          <Text style={styles.storeAddress}>123 Main Street, City</Text>
          <Text style={styles.storeContact}>Tel: (02) 1234-5678</Text>
        </View>

        {/* Order Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue}>
                {orderId?.slice(-8) ||
                  receiptData._id?.slice(-8) ||
                  checkoutCode}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(receiptData.confirmedAt || receiptData.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>
                {formatTime(receiptData.confirmedAt || receiptData.createdAt)}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cashier</Text>
              <Text style={styles.infoValue}>{cashierName}</Text>
            </View>
          </View>

          {customerType !== "regular" && (
            <View style={styles.customerTypeBadge}>
              <Ionicons
                name={customerType === "senior" ? "person" : "accessibility"}
                size={14}
                color="#059669"
              />
              <Text style={styles.customerTypeText}>
                {customerType === "senior" ? "Senior Citizen" : "PWD"}
              </Text>
              <Text style={styles.verificationText}>
                •{" "}
                {receiptData.verificationSource === "system"
                  ? "QR Verified"
                  : "Manual"}
              </Text>
            </View>
          )}
        </View>

        {/* Items List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ITEMS</Text>
            <Text style={styles.itemsCount}>
              {itemCount} items • {totalQuantity} pcs
            </Text>
          </View>

          <View style={styles.itemsTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>ITEM</Text>
              <Text style={styles.tableHeaderText}>QTY</Text>
              <Text style={styles.tableHeaderText}>PRICE</Text>
              <Text style={[styles.tableHeaderText, styles.tableHeaderRight]}>
                TOTAL
              </Text>
            </View>

            {items.map((item, index) => (
              <View key={item._id || index} style={styles.itemRow}>
                <View style={[styles.itemNameCol, { flex: 3 }]}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name || `Item ${index + 1}`}
                  </Text>
                  {item.isGroceryDiscountEligible && (
                    <Text style={styles.bnpcTag}>BNPC</Text>
                  )}
                </View>
                <Text style={styles.itemQty}>{item.quantity || 1}</Text>
                <Text style={styles.itemPrice}>
                  ₱{item.unitPrice?.toFixed(2) || "0.00"}
                </Text>
                <Text style={[styles.itemTotal, styles.textRight]}>
                  ₱{((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TOTALS</Text>
          </View>

          <View style={styles.totalsGrid}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                ₱{amounts.subtotal.toFixed(2)}
              </Text>
            </View>

            {amounts.totalDiscount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  BNPC Discount ({customerType.toUpperCase()})
                </Text>
                <Text style={[styles.totalValue, styles.discountValue]}>
                  -₱{amounts.totalDiscount.toFixed(2)}
                </Text>
              </View>
            )}

            {amounts.voucherDiscount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Voucher Discount</Text>
                <Text style={[styles.totalValue, styles.discountValue]}>
                  -₱{amounts.voucherDiscount.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.finalTotalValue}>
                ₱{amounts.finalTotal.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Cash Transaction */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CASH TRANSACTION</Text>
          </View>

          <View style={styles.cashGrid}>
            <View style={styles.cashRow}>
              <Text style={styles.cashLabel}>Cash Received</Text>
              <Text style={styles.cashValue}>
                ₱{amounts.cashReceived.toFixed(2)}
              </Text>
            </View>
            <View style={styles.cashRow}>
              <Text style={styles.cashLabel}>Change Due</Text>
              <Text style={[styles.cashValue, styles.changeValue]}>
                ₱{amounts.changeDue.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* BNPC Information */}
        {bnpcData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={16} color="#374151" />
              <Text style={styles.sectionTitle}>BNPC BOOKLET UPDATE</Text>
            </View>

            <View style={styles.bnpcBox}>
              <View style={styles.bnpcRow}>
                <Text style={styles.bnpcLabel}>Used Before Transaction</Text>
                <Text style={styles.bnpcValue}>
                  ₱{bnpcData.discountCap?.usedBefore?.toFixed(2) || "0.00"}
                </Text>
              </View>
              <View style={styles.bnpcRow}>
                <Text style={styles.bnpcLabel}>Discount Applied</Text>
                <Text style={styles.bnpcValue}>
                  ₱{amounts.totalDiscount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.bnpcDivider} />
              <View style={styles.bnpcRow}>
                <Text style={[styles.bnpcLabel, styles.bnpcBold]}>
                  New Booklet Total
                </Text>
                <Text style={[styles.bnpcValue, styles.bnpcBold]}>
                  ₱{bnpcData.discountCap?.usedAfter?.toFixed(2) || "0.00"}
                </Text>
              </View>

              {/* Caps Summary */}
              <View style={styles.capsSummary}>
                <View style={styles.capItem}>
                  <Text style={styles.capLabel}>Remaining Weekly Cap</Text>
                  <Text style={styles.capValue}>
                    ₱
                    {bnpcData.discountCap?.remainingAtCheckout?.toFixed(2) ||
                      "0.00"}
                  </Text>
                </View>
                <View style={styles.capDivider} />
                <View style={styles.capItem}>
                  <Text style={styles.capLabel}>Weekly Purchase Cap</Text>
                  <Text style={styles.capValue}>
                    ₱
                    {bnpcData.purchaseCap?.remainingAtCheckout?.toFixed(2) ||
                      "0.00"}
                  </Text>
                </View>
              </View>

              <View style={styles.bnpcNote}>
                <Ionicons name="information-circle" size={14} color="#6B7280" />
                <Text style={styles.bnpcNoteText}>
                  Update physical BNPC booklet with new total
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Points Earned */}
        {receiptData.pointsEarned > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={16} color="#374151" />
              <Text style={styles.sectionTitle}>LOYALTY POINTS</Text>
            </View>

            <View style={styles.pointsBox}>
              <View style={styles.pointsRow}>
                <Text style={styles.pointsLabel}>Points Earned</Text>
                <Text style={styles.pointsValue}>
                  +{receiptData.pointsEarned}
                </Text>
              </View>
              {receiptData.pointsUsed > 0 && (
                <View style={styles.pointsRow}>
                  <Text style={styles.pointsLabel}>Points Used</Text>
                  <Text style={[styles.pointsValue, styles.pointsUsed]}>
                    -{receiptData.pointsUsed}
                  </Text>
                </View>
              )}
              <Text style={styles.pointsNote}>Thank you for your loyalty!</Text>
            </View>
          </View>
        )}

        {/* Blockchain Verification */}
        {(receiptData.blockchainTxId || receiptData.blockchainHash) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={16} color="#374151" />
              <Text style={styles.sectionTitle}>TRANSACTION VERIFICATION</Text>
            </View>

            <View style={styles.blockchainBox}>
              <Text style={styles.blockchainText}>
                ✓ Transaction verified on blockchain
              </Text>
              {receiptData.blockchainTxId && (
                <Text style={styles.blockchainId}>
                  TX: {receiptData.blockchainTxId.slice(0, 16)}...
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.thankYou}>Thank you for shopping with us!</Text>
          <Text style={styles.footerNote}>
            Please keep this receipt for your records
          </Text>
          <Text style={styles.footerInfo}>
            Transaction ID:{" "}
            {orderId?.slice(-12) || receiptData._id?.slice(-12) || "N/A"}
          </Text>
          <Text style={styles.footerInfo}>
            {formatDate(receiptData.confirmedAt || receiptData.createdAt)}
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePrint}>
          <Ionicons name="print" size={20} color="#4B5563" />
          <Text style={styles.actionButtonText}>Print</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share" size={20} color="#4B5563" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.doneButton]}
          onPress={handleDone}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, styles.doneButtonText]}>
            Done
          </Text>
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
  header: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    color: "#6B7280",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  storeHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  storeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  storeContact: {
    fontSize: 12,
    color: "#6B7280",
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 2,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  infoDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  customerTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignSelf: "flex-start",
    marginTop: 8,
  },
  customerTypeText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    marginLeft: 6,
  },
  verificationText: {
    fontSize: 10,
    color: "#6B7280",
    marginLeft: 6,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemsCount: {
    fontSize: 12,
    color: "#6B7280",
  },
  itemsTable: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    flex: 1,
  },
  tableHeaderRight: {
    textAlign: "right",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemNameCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    marginBottom: 2,
  },
  bnpcTag: {
    fontSize: 9,
    color: "#059669",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: "flex-start",
    fontWeight: "600",
  },
  itemQty: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    textAlign: "center",
    flex: 1,
  },
  itemPrice: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  itemTotal: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
    flex: 1,
  },
  textRight: {
    textAlign: "right",
  },
  totalsGrid: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  discountValue: {
    color: "#059669",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  finalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  finalTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  finalTotalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#00A86B",
  },
  cashGrid: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cashRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cashLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  cashValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  changeValue: {
    color: "#059669",
  },
  bnpcBox: {
    padding: 12,
    backgroundColor: "#F0F9FF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  bnpcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bnpcLabel: {
    fontSize: 13,
    color: "#374151",
  },
  bnpcValue: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  bnpcBold: {
    fontWeight: "700",
  },
  bnpcDivider: {
    height: 1,
    backgroundColor: "#BAE6FD",
    marginVertical: 8,
  },
  capsSummary: {
    flexDirection: "row",
    backgroundColor: "#E0F2FE",
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  capItem: {
    flex: 1,
    alignItems: "center",
  },
  capLabel: {
    fontSize: 10,
    color: "#0369A1",
    marginBottom: 2,
  },
  capValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0369A1",
  },
  capDivider: {
    width: 1,
    backgroundColor: "#BAE6FD",
  },
  bnpcNote: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bnpcNoteText: {
    fontSize: 11,
    color: "#6B7280",
    marginLeft: 6,
    fontStyle: "italic",
  },
  pointsBox: {
    padding: 12,
    backgroundColor: "#FFFBEB",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  pointsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pointsLabel: {
    fontSize: 13,
    color: "#92400E",
  },
  pointsValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#D97706",
  },
  pointsUsed: {
    color: "#DC2626",
  },
  pointsNote: {
    fontSize: 11,
    color: "#92400E",
    fontStyle: "italic",
    marginTop: 8,
  },
  blockchainBox: {
    padding: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignItems: "center",
  },
  blockchainText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
    marginBottom: 4,
  },
  blockchainId: {
    fontSize: 10,
    color: "#059669",
    fontFamily: "monospace",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
  },
  thankYou: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  footerNote: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  footerInfo: {
    fontSize: 11,
    color: "#9CA3AF",
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
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    gap: 6,
  },
  doneButton: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  doneButtonText: {
    color: "#FFFFFF",
  },
});

export default ReceiptScreen;
