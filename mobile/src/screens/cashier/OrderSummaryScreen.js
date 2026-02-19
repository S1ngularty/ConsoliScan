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
  console.log("OrderSummary - transactionData:", transactionData);
  console.log("OrderSummary - orderDetails:", orderDetails);
  
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
  const { itemCount, totalQuantity, bnpcEligibleCount, bnpcEligibleQuantity } = useMemo(() => {
    const items = orderDetails?.items || transactionData?.items || [];
    const bnpcEligible = items.filter((item) => item.isBNPCEligible || false);
    
    return {
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
      bnpcEligibleCount: bnpcEligible.length,
      bnpcEligibleQuantity: bnpcEligible.reduce((sum, item) => sum + (item.quantity || 0), 0),
    };
  }, [orderDetails, transactionData]);

  // Get customer display name
  const getCustomerDisplay = () => {
    const type = transactionData.customerType;
    if (type === "senior") return "Senior Citizen";
    if (type === "pwd") return "PWD";
    if (type === "regular") return "Regular";
    return transactionData.customerScope || "Regular";
  };

  // Get verification badge color
  const getVerificationColor = () => {
    if (transactionData.verificationSource === "system") return "#3B82F6";
    if (transactionData.verificationSource === "manual") return "#F59E0B";
    return "#6B7280";
  };

  const handleComplete = async () => {
    try {
      // Prepare order data for MongoDB with all transaction log details
      const orderData = {
        // Core relationships
        user: orderDetails?.user || transactionData?.user || null,
        cashier: transactionData.cashier?.cashierId || orderDetails?.cashier?.cashierId || null,
        appUser: transactionData.appUser || false,
        
        // Order metadata
        checkoutCode: transactionData.checkoutCode,
        customerType: transactionData.customerType || 'regular',
        customerScope: transactionData.customerScope || null,
        verificationSource: transactionData.verificationSource || 'manual',
        systemVerified: transactionData.systemVerified || false,
        systemVerificationType: (transactionData.systemVerificationType && typeof transactionData.systemVerificationType === 'string') ? transactionData.systemVerificationType.toLowerCase() : null,
        manualOverride: transactionData.manualOverride || false,

        // Items with full details
        items: (orderDetails?.items || transactionData?.items || []).map((item) => ({
          product: item.product?._id || item.product || null,
          name: item.name || item.product?.name || "Product",
          sku: item.sku || item.product?.sku || `PROD-${item.product?._id?.slice(-6)}`,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.price || 0,
          salePrice: item.salePrice || null,
          saleActive: item.saleActive || false,
          categoryType: item.categoryType || item.bnpcCategory || null,
          isBNPCEligible: item.isBNPCEligible || false,
          isBNPCProduct: item.isBNPCProduct || false,
          excludedFromDiscount: item.excludedFromDiscount || false,
          category: item.category || null,
          unit: item.unit || "pc",
          itemTotal: item.itemTotal || (item.quantity * (item.unitPrice || item.price || 0)),
        })),

        // Amounts & discounts
        baseAmount: transactionData.amounts?.subtotal || 0,
        bnpcEligibleSubtotal: transactionData.amounts?.bnpcEligibleSubtotal || 0,

        // BNPC discount breakdown
        bnpcDiscount: {
          autoCalculated: transactionData.amounts?.bnpcDiscount || 0,
          serverCalculated: transactionData.amounts?.serverBnpcDiscount || 0,
          additionalApplied: 0,
          total: transactionData.amounts?.bnpcDiscount || 0,
        },

        // Promo discount
        promoDiscount: {
          code: transactionData.promo?.code || null,
          amount: transactionData.amounts?.promoDiscount || 0,
          serverValidated: true,
        },

        // Loyalty points discount
        loyaltyDiscount: {
          pointsUsed: transactionData.loyalty?.pointsUsed || 0,
          amount: transactionData.amounts?.loyaltyDiscount || 0,
          pointsEarned: transactionData.loyalty?.pointsEarned || 0,
        },

        // Legacy field (for backward compatibility)
        seniorPwdDiscountAmount: transactionData.amounts?.bnpcDiscount || 0,

        // Voucher discount
        voucherDiscount: transactionData.amounts?.voucherDiscount || 0,

        // Total discount breakdown
        discountBreakdown: {
          bnpc: transactionData.amounts?.bnpcDiscount || 0,
          promo: transactionData.amounts?.promoDiscount || 0,
          loyalty: transactionData.amounts?.loyaltyDiscount || 0,
          voucher: transactionData.amounts?.voucherDiscount || 0,
          total: transactionData.amounts?.totalDiscount || 0,
        },

        finalAmountPaid: transactionData.amounts?.finalTotal || 0,
        pointsEarned: transactionData.loyalty?.pointsEarned || 
          Math.floor((transactionData.amounts?.finalTotal || 0) / 10),

        // Cash transaction
        cashTransaction: {
          cashReceived: transactionData.amounts?.cashReceived || 0,
          changeDue: transactionData.amounts?.changeDue || 0,
        },

        // BNPC caps & compliance
        bnpcCaps: {
          discountCap: {
            weeklyCap: 125,
            usedBefore: transactionData.caps?.bookletUsedBefore || 0,
            remainingAtCheckout: transactionData.caps?.remainingDiscountCap || 125,
            usedAfter: transactionData.caps?.bookletUsedAfter || 
                      (transactionData.caps?.bookletUsedBefore || 0) + 
                      (transactionData.amounts?.bnpcDiscount || 0),
          },
          purchaseCap: {
            weeklyCap: 2500,
            usedBefore: transactionData.caps?.purchaseUsedBefore || 0,
            remainingAtCheckout: transactionData.caps?.remainingPurchaseCap || 2500,
            usedAfter: transactionData.caps?.purchaseUsedAfter || 
                      (transactionData.caps?.purchaseUsedBefore || 0) + 
                      (transactionData.amounts?.bnpcEligibleSubtotal || 0),
          },
          weekStart: transactionData.caps?.weekStart,
          weekEnd: transactionData.caps?.weekEnd,
          weeklyCapRemainingAtCheckout: transactionData.caps?.remainingDiscountCap || 125,
        },

        // Server calculations snapshot
        serverCalculations: transactionData.serverCalculations || null,

        // BNPC products
        bnpcProducts: (transactionData.bnpcProducts || []).map(p => ({
          productId: p.productId,
          name: p.name,
          quantity: p.quantity,
          price: p.price,
          itemTotal: p.itemTotal,
        })),

        // Item statistics
        itemStats: {
          totalItems: itemCount,
          totalQuantity: totalQuantity,
          bnpcEligibleItems: bnpcEligibleCount,
          bnpcEligibleQuantity: bnpcEligibleQuantity,
        },

        // Order state
        status: "CONFIRMED",
        confirmedAt: new Date().toISOString(),

        // Booklet compliance
        bookletUpdated: true,
        bookletUpdateReminder: "Physical booklet must be updated with new total",
      };

      console.log("Submitting complete order data:", JSON.stringify(orderData, null, 2));

      const result = await confirmOrder(orderData);

      Alert.alert(
        "Transaction Complete",
        `Order #${transactionData.checkoutCode} has been processed successfully.`,
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("DrawTabs");
            },
          },
        ],
      );
    } catch (error) {
      console.error("Failed to complete order:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to complete transaction. Please try again.",
      );
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
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handlePrintReceipt = () => {
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
              <View style={styles.customerTypeRow}>
                <Text style={styles.infoValue}>
                  {getCustomerDisplay()}
                </Text>
                {transactionData.systemVerified && !transactionData.manualOverride && (
                  <View style={styles.appVerifiedChip}>
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text style={styles.appVerifiedChipText}>App</Text>
                  </View>
                )}
                {transactionData.manualOverride && (
                  <View style={styles.manualChip}>
                    <Ionicons name="person" size={12} color="#F59E0B" />
                    <Text style={styles.manualChipText}>Manual</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cashier</Text>
              <Text style={styles.infoValue}>
                {transactionData.cashier?.name || orderDetails?.cashier?.name || "Cashier"}
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
              <Text style={styles.statValue}>{bnpcEligibleCount}</Text>
            </View>
          </View>

          {/* Items List */}
          <View style={styles.itemsList}>
            {(orderDetails?.items || transactionData?.items || []).map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name || item.product?.name || "Product"}
                  </Text>
                  <Text style={styles.itemDetails}>
                    {item.quantity} × ₱{(item.unitPrice || item.price || 0).toFixed(2)}
                    {item.isBNPCEligible && (
                      <Text style={styles.bnpcBadge}> • BNPC</Text>
                    )}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ₱{(item.itemTotal || (item.quantity * (item.unitPrice || item.price || 0))).toFixed(2)}
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

            {/* BNPC Eligible Subtotal (if different from regular) */}
            {transactionData.amounts.bnpcEligibleSubtotal > 0 && 
             transactionData.amounts.bnpcEligibleSubtotal !== transactionData.amounts.subtotal && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>BNPC Eligible</Text>
                <Text style={styles.amountValue}>
                  ₱{transactionData.amounts.bnpcEligibleSubtotal.toFixed(2)}
                </Text>
              </View>
            )}

            {/* BNPC Discount */}
            {transactionData.amounts.bnpcDiscount > 0 && (
              <View style={styles.amountRow}>
                <View style={styles.discountRow}>
                  <Ionicons name="pricetag" size={14} color="#059669" />
                  <Text style={styles.amountLabel}>
                    BNPC Discount (5%)
                  </Text>
                </View>
                <Text style={[styles.amountValue, styles.discountValue]}>
                  -₱{transactionData.amounts.bnpcDiscount.toFixed(2)}
                </Text>
              </View>
            )}

            {/* Promo Discount */}
            {transactionData.amounts.promoDiscount > 0 && (
              <View style={styles.amountRow}>
                <View style={styles.discountRow}>
                  <Ionicons name="pricetag" size={14} color="#FF9800" />
                  <Text style={styles.amountLabel}>
                    Promo {transactionData.promo?.code || ''}
                  </Text>
                </View>
                <Text style={[styles.amountValue, styles.promoValue]}>
                  -₱{transactionData.amounts.promoDiscount.toFixed(2)}
                </Text>
              </View>
            )}

            {/* Loyalty Discount */}
            {transactionData.amounts.loyaltyDiscount > 0 && (
              <View style={styles.amountRow}>
                <View style={styles.discountRow}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.amountLabel}>
                    Loyalty Points ({transactionData.loyalty?.pointsUsed || 0} pts)
                  </Text>
                </View>
                <Text style={[styles.amountValue, styles.loyaltyValue]}>
                  -₱{transactionData.amounts.loyaltyDiscount.toFixed(2)}
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

            {/* Server Calculated Reference (if different) */}
            {transactionData.amounts.serverBnpcDiscount > 0 && 
             transactionData.amounts.serverBnpcDiscount !== transactionData.amounts.bnpcDiscount && (
              <View style={styles.referenceRow}>
                <Text style={styles.referenceText}>
                  System calculated: ₱{transactionData.amounts.serverBnpcDiscount.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            {/* Total Discount */}
            {transactionData.amounts.totalDiscount > 0 && (
              <View style={styles.totalDiscountRow}>
                <Text style={styles.totalDiscountLabel}>Total Discount</Text>
                <Text style={styles.totalDiscountValue}>
                  -₱{transactionData.amounts.totalDiscount.toFixed(2)}
                </Text>
              </View>
            )}

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
        {transactionData.amounts.bnpcDiscount > 0 && (
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
                  ₱{transactionData.amounts.bnpcDiscount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.capDividerFull} />
              <View style={styles.capRow}>
                <Text style={[styles.capLabel, styles.capLabelBold]}>
                  New Booklet Total
                </Text>
                <Text style={[styles.capValue, styles.capValueBold]}>
                  ₱{(transactionData.caps.bookletUsedAfter || 
                     (transactionData.caps.bookletUsedBefore + transactionData.amounts.bnpcDiscount)).toFixed(2)}
                </Text>
              </View>
              <View style={styles.capNote}>
                <Ionicons name="information-circle" size={14} color="#6B7280" />
                <Text style={styles.capNoteText}>
                  Update physical booklet with new total
                </Text>
              </View>
              
              {/* Week Range */}
              {(transactionData.caps.weekStart || transactionData.caps.weekEnd) && (
                <View style={styles.weekRangeContainer}>
                  <Ionicons name="calendar" size={12} color="#6B7280" />
                  <Text style={styles.weekRangeText}>
                    Week: {transactionData.caps.weekStart ? new Date(transactionData.caps.weekStart).toLocaleDateString() : ''} - 
                    {transactionData.caps.weekEnd ? new Date(transactionData.caps.weekEnd).toLocaleDateString() : ''}
                  </Text>
                </View>
              )}
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
            {transactionData.loyalty?.pointsUsed > 0 && (
              <View style={styles.pointRow}>
                <Text style={styles.pointLabel}>Points Used</Text>
                <Text style={[styles.pointValue, styles.pointsUsed]}>
                  -{transactionData.loyalty.pointsUsed}
                </Text>
              </View>
            )}
            <View style={styles.pointRow}>
              <Text style={styles.pointLabel}>Points Earned</Text>
              <Text style={styles.pointValue}>
                +{transactionData.loyalty?.pointsEarned || 
                   Math.floor(transactionData.amounts.finalTotal / 10)}
              </Text>
            </View>
          </View>
        </View>

        {/* BNPC Products List (if any) */}
        {transactionData.bnpcProducts && transactionData.bnpcProducts.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cube" size={18} color="#374151" />
              <Text style={styles.sectionTitle}>BNPC Products</Text>
            </View>

            <View style={styles.bnpcList}>
              {transactionData.bnpcProducts.map((product, index) => (
                <View key={index} style={styles.bnpcItem}>
                  <Text style={styles.bnpcItemName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.bnpcItemDetails}>
                    {product.quantity} × ₱{product.price?.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
              color={getVerificationColor()}
            />
            <Text style={styles.verificationText}>
              Verified via{" "}
              {transactionData.verificationSource === "system"
                ? "System"
                : transactionData.verificationSource === "manual"
                ? "Manual"
                : "System"}
            </Text>
            {transactionData.systemVerified && (
              <View style={[styles.verificationBadge, { backgroundColor: getVerificationColor() + '20' }]}>
                <Text style={[styles.verificationBadgeText, { color: getVerificationColor() }]}>
                  {transactionData.systemVerificationType?.toUpperCase() || 'VERIFIED'}
                </Text>
              </View>
            )}
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
  customerTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  appVerifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  appVerifiedChipText: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "600",
  },
  manualChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  manualChipText: {
    fontSize: 10,
    color: "#F59E0B",
    fontWeight: "600",
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
  promoValue: {
    color: "#FF9800",
    fontWeight: "600",
  },
  loyaltyValue: {
    color: "#FFD700",
    fontWeight: "600",
  },
  referenceRow: {
    marginBottom: 8,
    paddingLeft: 18,
  },
  referenceText: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  totalDiscountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalDiscountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  totalDiscountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
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
  weekRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  weekRangeText: {
    fontSize: 11,
    color: "#6B7280",
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
  bnpcList: {
    maxHeight: 150,
  },
  bnpcItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  bnpcItemName: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  bnpcItemDetails: {
    fontSize: 12,
    color: "#6B7280",
  },
  verificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  verificationText: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 6,
  },
  verificationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verificationBadgeText: {
    fontSize: 10,
    fontWeight: "600",
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