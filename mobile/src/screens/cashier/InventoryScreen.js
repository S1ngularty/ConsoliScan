import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getInventory, updateStock } from "../../api/cashier.api";

const InventoryScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lowStockCount, setLowStockCount] = useState(0);
  const [showLowStock, setShowLowStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAction, setStockAction] = useState("add");
  const [stockQuantity, setStockQuantity] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchInventory();
    }, []),
  );

  const fetchInventory = async (isLoadMore = false) => {
    try {
      console.log("=== fetchInventory called ===");
      console.log("isLoadMore:", isLoadMore);
      console.log("Current page:", page);
      console.log("Current searchQuery:", searchQuery);
      console.log("showLowStock:", showLowStock);

      if (!isLoadMore) {
        setLoading(true);
        setPage(1);
      }

      const params = {
        search: searchQuery,
        lowStock: showLowStock ? "true" : undefined,
        page: isLoadMore ? page : 1,
        limit: 20,
      };

      console.log("Params being sent:", params);

      const data = await getInventory(params);

      console.log("Data received:", data);

      if (isLoadMore) {
        setProducts((prev) => [...prev, ...data.products]);
      } else {
        setProducts(data.products);
      }

      setLowStockCount(data.lowStockCount);
      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      console.error("Error details:", error.message, error.stack);
      Alert.alert("Error", "Failed to load inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchInventory();
  };

  const handleSearch = () => {
    setPage(1);
    fetchInventory();
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      fetchInventory(true);
    }
  };

  const handleStockUpdate = async () => {
    if (!stockQuantity || parseInt(stockQuantity) <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    try {
      setLoading(true);
      await updateStock(selectedProduct._id, {
        quantity: parseInt(stockQuantity),
        action: stockAction,
      });

      Alert.alert("Success", "Stock updated successfully");
      setShowStockModal(false);
      setStockQuantity("");
      setSelectedProduct(null);
      fetchInventory();
    } catch (error) {
      console.error("Error updating stock:", error);
      Alert.alert("Error", error.message || "Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
    setStockAction("add");
    setStockQuantity("");
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productSku}>SKU: {item.sku}</Text>
        </View>
        {item.isLowStock && (
          <View style={styles.lowStockBadge}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={16}
              color="#EF4444"
            />
            <Text style={styles.lowStockText}>Low</Text>
          </View>
        )}
      </View>

      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="package-variant"
            size={18}
            color="#64748B"
          />
          <Text style={styles.detailLabel}>Stock:</Text>
          <Text
            style={[
              styles.detailValue,
              item.isLowStock && styles.lowStockValue,
            ]}
          >
            {item.stockQuantity} units
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="currency-php"
            size={18}
            color="#64748B"
          />
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>
            ₱{item.currentPrice.toFixed(2)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="tag" size={18} color="#64748B" />
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>{item.categoryName}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.updateStockButton}
        onPress={() => openStockModal(item)}
      >
        <MaterialCommunityIcons name="pencil" size={18} color="#FFFFFF" />
        <Text style={styles.updateStockText}>Update Stock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuButton}
        >
          <MaterialCommunityIcons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Inventory</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => {
              setShowLowStock(!showLowStock);
              fetchInventory();
            }}
          >
            <View style={styles.alertBadgeContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={24}
                color="#FFFFFF"
              />
              {lowStockCount > 0 && (
                <View style={styles.alertCount}>
                  <Text style={styles.alertCountText}>{lowStockCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        {showLowStock && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterText}>Low Stock Only</Text>
          </View>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}

      <Modal visible={showStockModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Stock</Text>
            {selectedProduct && (
              <View>
                <Text style={styles.modalProductName}>
                  {selectedProduct.name}
                </Text>
                <View style={styles.actionButtons}>
                  {["add", "subtract", "set"].map((action) => (
                    <TouchableOpacity
                      key={action}
                      style={[
                        styles.actionButton,
                        stockAction === action && styles.actionButtonActive,
                      ]}
                      onPress={() => setStockAction(action)}
                    >
                      <Text style={styles.actionButtonText}>
                        {action.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.quantityInput}
                  placeholder="Quantity"
                  keyboardType="numeric"
                  value={stockQuantity}
                  onChangeText={setStockQuantity}
                />
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleStockUpdate}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowStockModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#00A86B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  menuButton: { padding: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  headerRight: { padding: 8 },
  alertBadgeContainer: { position: "relative" },
  alertCount: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  alertCountText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  searchContainer: { padding: 16, backgroundColor: "#FFFFFF" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8 },
  filterBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  filterText: { color: "#EF4444", fontSize: 12, fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16 },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  productName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  productSku: { fontSize: 12, color: "#64748B" },
  lowStockBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lowStockText: {
    color: "#EF4444",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
  productDetails: { marginBottom: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  detailLabel: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 8,
    marginRight: 8,
  },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  lowStockValue: { color: "#EF4444" },
  updateStockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A86B",
    borderRadius: 8,
    paddingVertical: 10,
  },
  updateStockText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  modalProductName: { fontSize: 16, marginBottom: 16 },
  actionButtons: { flexDirection: "row", gap: 12, marginBottom: 16 },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00A86B",
    alignItems: "center",
  },
  actionButtonActive: { backgroundColor: "#00A86B" },
  actionButtonText: { fontSize: 14, fontWeight: "600", color: "#00A86B" },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: "#00A86B",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  confirmButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  cancelText: { textAlign: "center", color: "#64748B", fontSize: 14 },
});

export default InventoryScreen;
