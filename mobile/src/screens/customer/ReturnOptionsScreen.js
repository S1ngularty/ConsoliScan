import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  completeLoyaltyConversion,
  completeItemSwap,
} from "../../api/return.api";

const ReturnOptionsScreen = ({ navigation, route }) => {
  const { returnId, order, item } = route.params;

  const [selectedOption, setSelectedOption] = useState(null); // "loyalty" or "swap"
  const [isProcessing, setIsProcessing] = useState(false);

  const rawUnitPrice =
    item?.price ??
    item?.originalPrice ??
    item?.unitPrice ??
    item?.amount ??
    item?.originalAmount ??
    0;
  const parsedPrice = Number(rawUnitPrice);
  const safeUnitPrice = Number.isFinite(parsedPrice) ? parsedPrice : 0;
  const rawQuantity = item?.quantity ?? item?.qty ?? 1;
  const parsedQuantity = Number(rawQuantity);
  const safeQuantity =
    Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
  const itemName = item?.productName || item?.name || "Returned Item";
  const replacementBarcode = item?.barcode || item?.productBarcode || item?.sku;

  // Calculate loyalty points (10% of price)
  const loyaltyPoints = Math.round(safeUnitPrice * safeQuantity * 10);

  const handleSelectOption = (option) => {
    setSelectedOption(option);
  };

  const handleProceed = async () => {
    if (!selectedOption) {
      Alert.alert("Error", "Please select an option");
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedOption === "loyalty") {
        if (loyaltyPoints <= 0) {
          throw new Error("Unable to compute loyalty points for this item");
        }
        await completeLoyaltyConversion(returnId, {
          loyaltyAmount: loyaltyPoints,
        });
      } else {
        if (!replacementBarcode) {
          throw new Error(
            "Replacement barcode is missing for this return item",
          );
        }
        await completeItemSwap(returnId, { replacementBarcode });
      }

      // Navigate to completion screen
      Alert.alert(
        "Success",
        selectedOption === "loyalty"
          ? `${loyaltyPoints} loyalty points have been added to your account!`
          : "Your replacement item is ready for pickup!",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("OrderHistory"),
          },
        ],
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Option</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Message */}
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color="#10B981"
            />
            <Text style={styles.statusText}>Inspection Passed ✓</Text>
          </View>
          <Text style={styles.statusMessage}>
            Your item has passed inspection. Choose how you'd like to proceed:
          </Text>
        </View>

        {/* Item Info Card */}
        <View style={styles.section}>
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{itemName}</Text>
              <Text style={styles.itemSubtext}>
                Qty: {safeQuantity} × ₱{safeUnitPrice.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: "#D1FAE5" }]}>
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color="#10B981"
              />
            </View>
          </View>
        </View>

        {/* Option 1: Loyalty Points */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === "loyalty" && styles.optionCardSelected,
            ]}
            onPress={() => handleSelectOption("loyalty")}
          >
            <View style={styles.optionHeader}>
              <MaterialCommunityIcons
                name="star-circle"
                size={32}
                color={selectedOption === "loyalty" ? "#FBBF24" : "#9CA3AF"}
              />
              <View style={styles.optionHeaderText}>
                <Text style={styles.optionTitle}>Get Loyalty Points</Text>
                <Text style={styles.optionDescription}>
                  Credit to your account
                </Text>
              </View>
              <MaterialCommunityIcons
                name={
                  selectedOption === "loyalty"
                    ? "radiobox-marked"
                    : "radiobox-blank"
                }
                size={24}
                color={selectedOption === "loyalty" ? "#FBBF24" : "#D1D5DB"}
              />
            </View>

            <View style={styles.optionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Return Amount</Text>
                <Text style={styles.detailValue}>
                  ₱{safeUnitPrice.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.detailRow, styles.detailRowHighlight]}>
                <Text style={styles.detailLabel}>Loyalty Points (10%)</Text>
                <Text style={styles.detailValueHighlight}>
                  {loyaltyPoints} pts
                </Text>
              </View>
              <Text style={styles.optionNote}>
                Use points towards your next purchase
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Option 2: Swap for Same Item */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === "swap" && styles.optionCardSelected,
            ]}
            onPress={() => handleSelectOption("swap")}
          >
            <View style={styles.optionHeader}>
              <MaterialCommunityIcons
                name="swap-horizontal-circle"
                size={32}
                color={selectedOption === "swap" ? "#3B82F6" : "#9CA3AF"}
              />
              <View style={styles.optionHeaderText}>
                <Text style={styles.optionTitle}>Swap for Same Item</Text>
                <Text style={styles.optionDescription}>Get a new unit</Text>
              </View>
              <MaterialCommunityIcons
                name={
                  selectedOption === "swap"
                    ? "radiobox-marked"
                    : "radiobox-blank"
                }
                size={24}
                color={selectedOption === "swap" ? "#3B82F6" : "#D1D5DB"}
              />
            </View>

            <View style={styles.optionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Product</Text>
                <Text style={styles.detailValue}>{itemName}</Text>
              </View>
              <View style={[styles.detailRow, styles.detailRowHighlight]}>
                <Text style={styles.detailLabel}>Item Price</Text>
                <Text style={styles.detailValueHighlight}>
                  ₱{safeUnitPrice.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.optionNote}>
                Item is ready for pickup at customer service
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Comparison Table */}
        <View style={styles.section}>
          <Text style={styles.comparisonTitle}>Comparison</Text>
          <View style={styles.comparisonTable}>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel} />
              <Text style={[styles.comparisonHeader, styles.column1]}>
                Loyalty Points
              </Text>
              <Text style={[styles.comparisonHeader, styles.column2]}>
                Swap
              </Text>
            </View>

            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>What you get</Text>
              <Text style={[styles.comparisonCell, styles.column1]}>
                {loyaltyPoints} pts
              </Text>
              <Text style={[styles.comparisonCell, styles.column2]}>
                New item
              </Text>
            </View>

            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Use anytime</Text>
              <Text style={[styles.comparisonCell, styles.column1]}>
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color="#10B981"
                />
              </Text>
              <Text style={[styles.comparisonCell, styles.column2]}>
                Immediate
              </Text>
            </View>

            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Expires</Text>
              <Text style={[styles.comparisonCell, styles.column1]}>
                1 year
              </Text>
              <Text style={[styles.comparisonCell, styles.column2]}>N/A</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.proceedButton,
              !selectedOption && styles.proceedButtonDisabled,
            ]}
            onPress={handleProceed}
            disabled={!selectedOption || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={18} color="#fff" />
                <Text style={styles.proceedButtonText}>Confirm Selection</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isProcessing}
          >
            <Text style={styles.cancelButtonText}>Go Back</Text>
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
  statusContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#047857",
  },
  statusMessage: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  itemSubtext: {
    fontSize: 12,
    color: "#6B7280",
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  optionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  optionCardSelected: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: "#6B7280",
  },
  optionDetails: {
    padding: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailRowHighlight: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  detailValueHighlight: {
    fontSize: 14,
    fontWeight: "800",
    color: "#10B981",
  },
  optionNote: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  comparisonTable: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  comparisonRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    minHeight: 44,
    alignItems: "center",
  },
  comparisonLabel: {
    flex: 1,
    paddingLeft: 12,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  comparisonHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    paddingHorizontal: 8,
    textAlign: "center",
  },
  comparisonCell: {
    fontSize: 12,
    color: "#1E293B",
    paddingHorizontal: 8,
    textAlign: "center",
  },
  column1: {
    flex: 1,
  },
  column2: {
    flex: 1,
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  proceedButton: {
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  proceedButtonDisabled: {
    opacity: 0.5,
  },
  proceedButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
    textAlign: "center",
  },
});

export default ReturnOptionsScreen;
