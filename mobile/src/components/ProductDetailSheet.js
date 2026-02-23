import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  addToSaved,
  removeFromSaved,
  checkIsSaved,
} from "../api/savedItems.api";

const ProductDetailSheet = ({ product, onConfirm, onCancel }) => {
  const [quantity, setQuantity] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const imageUrl = product?.images?.[0]?.url;
  const secondaryImage = product?.images?.[1]?.url;

  // Check if product is already saved on mount
  useEffect(() => {
    const checkSavedStatus = async () => {
      try {
        setCheckingStatus(true);
        const result = await checkIsSaved(product?._id);
        setIsSaved(result.isSaved);
      } catch (error) {
        console.error("Error checking saved status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (product?._id) {
      checkSavedStatus();
    }
  }, [product?._id]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSaveProduct = async () => {
    if (!product?._id) {
      Alert.alert("Error", "Product ID is missing");
      return;
    }

    setSavingLoading(true);
    try {
      if (isSaved) {
        // Remove from saved
        await removeFromSaved(product._id);
        setIsSaved(false);
        Alert.alert("Removed", "Item removed from saved");
      } else {
        // Add to saved
        await addToSaved(product._id);
        setIsSaved(true);
        Alert.alert("Saved", "Item added to saved items");
      }
    } catch (error) {
      console.error("Error saving/removing item:", error);
      Alert.alert("Error", "Failed to save/remove item. Please try again.");
    } finally {
      setSavingLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onCancel}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProduct}
          disabled={checkingStatus || savingLoading}
        >
          {savingLoading ? (
            <ActivityIndicator size="small" color="#E11D48" />
          ) : (
            <MaterialCommunityIcons
              name={isSaved ? "heart" : "heart-outline"}
              size={24}
              color={isSaved ? "#E11D48" : "#666"}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product Images Row */}
        <View style={styles.imagesRow}>
          <View style={styles.mainImageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          </View>
          {secondaryImage && (
            <View style={styles.secondaryImageContainer}>
              <Image
                source={{ uri: secondaryImage }}
                style={styles.secondaryImage}
                resizeMode="cover"
              />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.name} numberOfLines={2}>
            {product?.name}
          </Text>
          <Text style={styles.price}>₱{product?.price?.toFixed(2)}</Text>
        </View>

        {/* Product Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="package-variant"
              size={18}
              color="#666"
            />
            <Text style={styles.statLabel}>Stock</Text>
            <Text style={styles.statValue}>{product?.stockQuantity || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="barcode" size={18} color="#666" />
            <Text style={styles.statLabel}>Barcode</Text>
            <Text style={styles.statValue}>{product?.barcode || "N/A"}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="tag" size={18} color="#666" />
            <Text style={styles.statLabel}>SKU</Text>
            <Text style={styles.statValue}>{product?.sku || "N/A"}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.desc}>
            {product?.description || "No description available"}
          </Text>
        </View>

        {/* Product Details
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="calendar" size={16} color="#666" />
            <Text style={styles.detailLabel}>Added</Text>
            <Text style={styles.detailValue}>{formatDate(product?.createdAt)}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="update" size={16} color="#666" />
            <Text style={styles.detailLabel}>Updated</Text>
            <Text style={styles.detailValue}>{formatDate(product?.updatedAt)}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="format-list-bulleted-type" size={16} color="#666" />
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{product?.barcodeType || "N/A"}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="cube" size={16} color="#666" />
            <Text style={styles.detailLabel}>ID</Text>
            <Text style={styles.detailValueSmall}>
              {product?._id?.substring(0, 8) || "N/A"}
            </Text>
          </View>
        </View> */}

        {/* Quantity Selector */}
        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.qtyContainer}>
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={styles.qtyButton}
            >
              <MaterialCommunityIcons name="minus" size={20} color="#000" />
            </TouchableOpacity>
            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyNum}>{quantity}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setQuantity(quantity + 1)}
              style={styles.qtyButton}
              disabled={quantity >= (product?.stockQuantity || 99)}
            >
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={
                  quantity >= (product?.stockQuantity || 99) ? "#ccc" : "#000"
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button (Fixed at bottom) */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>
            ₱{(product?.price * quantity).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => onConfirm(product, quantity)}
        >
          <MaterialCommunityIcons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for bottom bar
  },
  imagesRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  mainImageContainer: {
    flex: 2,
  },
  mainImage: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
  },
  secondaryImageContainer: {
    flex: 1,
  },
  secondaryImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  productInfo: {
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
    lineHeight: 28,
  },
  price: {
    fontSize: 28,
    fontWeight: "800",
    color: "#00A86B",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginBottom: 2,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  desc: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    marginBottom: 2,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  detailValueSmall: {
    fontSize: 10,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  quantitySection: {
    marginBottom: 30,
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 4,
    alignSelf: "flex-start",
  },
  qtyButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyDisplay: {
    width: 60,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 4,
  },
  qtyNum: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#00A86B",
  },
  addBtn: {
    flex: 1,
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProductDetailSheet;
