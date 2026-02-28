import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  completeLoyaltyConversion,
  completeItemSwap,
} from "../../api/return.api";
import axios from "axios";
import { API_URL } from "../../constants/config";
import { getToken } from "../../utils/authUtil";

const ReturnFulfillmentScreen = ({ navigation, route }) => {
  const { returnId, order, item } = route.params;

  const [selectedOption, setSelectedOption] = useState(null); // "loyalty" or "swap"
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replacementProducts, setReplacementProducts] = useState([]);
  const [loadingReplacements, setLoadingReplacements] = useState(false);

  const itemName = item?.productName || item?.name || "Returned Item";
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
  const originalBarcode = item?.barcode || item?.productBarcode || item?.sku;
  const originalItemId =
    item?.productId || item?.originalItemId || item?._id || item?.id;
  const originalCategoryId =
    item?.categoryId ||
    item?.category?._id ||
    item?.category?.id ||
    item?.category;

  // Calculate loyalty points
  const loyaltyPoints = Math.round(safeUnitPrice * safeQuantity * 10);

  const handleSelectOption = async (option) => {
    setSelectedOption(option);
    setSelectedReplacement(null);

    if (option === "swap") {
      // Load available products for swap
      setLoadingReplacements(true);
      try {
        const token = await getToken();
        const response = await axios.get(`${API_URL}api/v1/product`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data) {
          const allProducts = Array.isArray(response.data.result)
            ? response.data.result
            : Array.isArray(response.data)
              ? response.data
              : [];

          const sameProductMatches = allProducts.filter((product) => {
            const productId = product?._id || product?.id;
            if (
              originalItemId &&
              productId &&
              String(productId) === String(originalItemId)
            ) {
              return true;
            }
            if (
              originalBarcode &&
              product?.barcode &&
              String(product.barcode) === String(originalBarcode)
            ) {
              return true;
            }
            return false;
          });

          const priceMin = safeUnitPrice * 0.9;
          const priceMax = safeUnitPrice * 1.1;
          const fallbackMatches = allProducts.filter((product) => {
            const productPrice = Number(
              product?.price ?? product?.unitPrice ?? 0,
            );
            const inPriceRange = Number.isFinite(productPrice)
              ? productPrice >= priceMin && productPrice <= priceMax
              : false;
            const sameCategory = originalCategoryId
              ? String(
                  product?.category?._id ||
                    product?.category?.id ||
                    product?.category,
                ) === String(originalCategoryId)
              : true;
            return sameCategory && inPriceRange;
          });

          const candidates =
            sameProductMatches.length > 0
              ? sameProductMatches
              : fallbackMatches;
          const inStock = candidates.filter(
            (product) => Number(product?.stockQuantity ?? 0) > 0,
          );
          setReplacementProducts(inStock);
        }
      } catch (error) {
        console.error("Failed to load replacement products:", error);
      } finally {
        setLoadingReplacements(false);
      }
    }
  };

  const handleCompleteFulfillment = async () => {
    if (!selectedOption) {
      Alert.alert("Error", "Please select a fulfillment option");
      return;
    }

    if (selectedOption === "swap" && !selectedReplacement) {
      Alert.alert("Error", "Please select a replacement product");
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (selectedOption === "loyalty") {
        if (loyaltyPoints <= 0) {
          Alert.alert(
            "Error",
            "Unable to compute loyalty points for this item",
          );
          setIsSubmitting(false);
          return;
        }
        result = await completeLoyaltyConversion(returnId, {
          loyaltyAmount: loyaltyPoints,
        });
      } else {
        result = await completeItemSwap(returnId, {
          replacementBarcode: selectedReplacement.barcode,
        });
      }

      // Navigate to completion screen
      navigation.navigate("ReturnComplete", {
        returnId: returnId,
        fulfillmentType: selectedOption,
        fulfillmentDetails: result,
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReplacementProduct = ({ item: product }) => (
    <TouchableOpacity
      style={[
        styles.productOption,
        (selectedReplacement?._id || selectedReplacement?.id) ===
          (product._id || product.id) && styles.productOptionSelected,
      ]}
      onPress={() => setSelectedReplacement(product)}
    >
      <View style={styles.productImagePlaceholder}>
        <MaterialCommunityIcons name="package" size={32} color="#9CA3AF" />
      </View>
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productCode}>{product.barcode}</Text>
        <Text style={styles.productPrice}>
          ₱
          {(Number.isFinite(Number(product?.price))
            ? Number(product.price)
            : 0
          ).toFixed(2)}
        </Text>
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>Stock: {product.stockQuantity}</Text>
        </View>
      </View>
      <MaterialCommunityIcons
        name={
          (selectedReplacement?._id || selectedReplacement?.id) ===
          (product._id || product.id)
            ? "radiobox-marked"
            : "radiobox-blank"
        }
        size={24}
        color={
          (selectedReplacement?._id || selectedReplacement?.id) ===
          (product._id || product.id)
            ? "#00A86B"
            : "#D1D5DB"
        }
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return Fulfillment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Item Summary */}
        <View style={styles.section}>
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{itemName}</Text>
              <Text style={styles.itemSubtext}>
                Qty: {safeQuantity} × ₱{safeUnitPrice.toFixed(2)}
              </Text>
              <Text style={styles.itemSubtext}>
                Status: Inspection Passed ✓
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

        {/* Fulfillment Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Fulfillment Method</Text>

          {/* Loyalty Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === "loyalty" && styles.optionCardActive,
            ]}
            onPress={() => handleSelectOption("loyalty")}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons
                name="star-circle"
                size={28}
                color={selectedOption === "loyalty" ? "#FBBF24" : "#9CA3AF"}
              />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Convert to Loyalty Points</Text>
              <Text style={styles.optionDescription}>
                Award customer with points as credit
              </Text>
              <View style={styles.pointsDisplay}>
                <Text style={styles.pointsLabel}>Points Awarded:</Text>
                <Text style={styles.pointsValue}>{loyaltyPoints} pts</Text>
              </View>
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
          </TouchableOpacity>

          {/* Swap Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === "swap" && styles.optionCardActive,
            ]}
            onPress={() => handleSelectOption("swap")}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons
                name="swap-horizontal-circle"
                size={28}
                color={selectedOption === "swap" ? "#3B82F6" : "#9CA3AF"}
              />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Swap for Same Item</Text>
              <Text style={styles.optionDescription}>
                Customer selects replacement product
              </Text>
              <View style={styles.priceRangeDisplay}>
                <Text style={styles.priceLabel}>
                  Same product / price range
                </Text>
                <Text style={styles.priceValue}>
                  ₱{safeUnitPrice.toFixed(2)}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name={
                selectedOption === "swap" ? "radiobox-marked" : "radiobox-blank"
              }
              size={24}
              color={selectedOption === "swap" ? "#3B82F6" : "#D1D5DB"}
            />
          </TouchableOpacity>
        </View>

        {/* Conditional: Replacement Products */}
        {selectedOption === "swap" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Replacement Product</Text>

            {loadingReplacements ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A86B" />
                <Text style={styles.loadingText}>
                  Loading available products...
                </Text>
              </View>
            ) : replacementProducts.length > 0 ? (
              <FlatList
                data={replacementProducts}
                renderItem={renderReplacementProduct}
                keyExtractor={(item) => item._id || item.id || item.barcode}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="package-variant-closed-remove"
                  size={48}
                  color="#D1D5DB"
                />
                <Text style={styles.emptyText}>
                  No replacement products available
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Loyalty Points Summary (if loyalty selected) */}
        {selectedOption === "loyalty" && (
          <View style={styles.section}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Item Price</Text>
                <Text style={styles.summaryValue}>
                  ₱{safeUnitPrice.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowBorder]}>
                <Text style={styles.summaryLabel}>
                  Loyalty Points (10% conversion)
                </Text>
                <Text style={styles.summaryValueHighlight}>
                  {loyaltyPoints} pts
                </Text>
              </View>
              <View style={styles.summaryNote}>
                <MaterialCommunityIcons
                  name="information"
                  size={16}
                  color="#3B82F6"
                />
                <Text style={styles.summaryNoteText}>
                  Points will be credited to customer account immediately
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedOption ||
                (selectedOption === "swap" && !selectedReplacement)) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleCompleteFulfillment}
            disabled={
              !selectedOption ||
              (selectedOption === "swap" && !selectedReplacement) ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="check-all"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.submitButtonText}>Complete Return</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
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
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  itemSubtext: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  optionCardActive: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  optionIconContainer: {
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  pointsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  pointsLabel: {
    fontSize: 11,
    color: "#92400E",
    marginRight: 4,
  },
  pointsValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
  },
  priceRangeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  priceLabel: {
    fontSize: 11,
    color: "#1E40AF",
    marginRight: 4,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E40AF",
  },
  productOption: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  productOptionSelected: {
    borderColor: "#00A86B",
    backgroundColor: "#F0FDF4",
  },
  productImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  productCode: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 4,
  },
  stockBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  stockText: {
    fontSize: 11,
    color: "#1E40AF",
    fontWeight: "600",
  },
  loadingContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  summaryRowBorder: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    marginVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  summaryValueHighlight: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FBBF24",
  },
  summaryNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  summaryNoteText: {
    fontSize: 12,
    color: "#1E40AF",
    flex: 1,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
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

export default ReturnFulfillmentScreen;
