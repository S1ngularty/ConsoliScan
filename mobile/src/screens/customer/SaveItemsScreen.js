import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { debounce } from "lodash";
import { getSavedItems, removeFromSaved } from "../../api/savedItems.api";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SavedItemsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [expandedItems, setExpandedItems] = useState({});

  const filters = [
    { id: "all", label: "All", icon: "view-grid" },
    { id: "bnpc", label: "BNPC", icon: "shield-check" },
    { id: "available", label: "In Stock", icon: "package-variant" },
    { id: "price", label: "Price", icon: "currency-php" },
  ];

  const fetchSavedItems = async () => {
    setLoading(true);
    try {
      const response = await getSavedItems();
      // console.log("Fetched saved items:", response.items);
      setSavedItems(response.items || []);
      setFilteredItems(response.items || []);
    } catch (error) {
      console.error("Error fetching saved items:", error);
      Alert.alert("Error", "Failed to load saved items");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedItems();
  };

  const handleRemoveFromSaved = async (productId, productName) => {
    Alert.alert(
      "Remove Item",
      `Remove "${productName}" from saved items?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromSaved(productId);
              const updatedItems = savedItems.filter((item) => item._id !== productId);
              setSavedItems(updatedItems);
              applyFilters(updatedItems, selectedFilter);
              // Animate removal
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            } catch (error) {
              console.error("Error removing item:", error);
              Alert.alert("Error", "Failed to remove item");
            }
          },
        },
      ],
    );
  };

  const toggleItemExpansion = (itemId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const performSearch = useCallback(
    debounce((query) => {
      if (!query.trim()) {
        applyFilters(savedItems, selectedFilter);
        setSearchLoading(false);
        return;
      }

      const lowerQuery = query.toLowerCase();
      const results = savedItems.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.sku?.toLowerCase().includes(lowerQuery) ||
          item.barcode?.includes(query),
      );

      setFilteredItems(results);
      setSearchLoading(false);
    }, 500),
    [savedItems, selectedFilter],
  );

  const applyFilters = (items, filter) => {
    let filtered = [...items];

    if (filter === "bnpc") {
      filtered = filtered.filter((item) => item.category.isBNPC);
    } else if (filter === "available") {
      filtered = filtered.filter((item) => item.stockQuantity > 0);
    } else if (filter === "price") {
      filtered = filtered.sort((a, b) => a.price - b.price);
    }

    setFilteredItems(filtered);
  };

  useEffect(() => {
    fetchSavedItems();
  }, []);

  useEffect(() => {
    if (searchQuery !== "") {
      setSearchLoading(true);
    }
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  useEffect(() => {
    applyFilters(savedItems, selectedFilter);
  }, [selectedFilter, savedItems]);

  const formatPrice = (amount) => {
    return `₱${amount?.toFixed(2) || '0.00'}`;
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: '#EF4444', icon: 'alert-circle' };
    if (quantity < 10) return { label: 'Low Stock', color: '#F59E0B', icon: 'alert' };
    return { label: 'In Stock', color: '#10B981', icon: 'check-circle' };
  };

  const FilterChip = ({ label, icon, isActive, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      onPress();
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          style={[styles.filterChip, isActive && styles.activeFilterChip]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={icon}
            size={16}
            color={isActive ? "#fff" : "#64748b"}
          />
          <Text
            style={[styles.filterChipText, isActive && styles.activeFilterChipText]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Move animated values to state for items
  const [itemFadeAnims, setItemFadeAnims] = useState({});

  // Initialize fade animations when items change
  useEffect(() => {
    const newAnims = {};
    filteredItems.forEach(item => {
      if (!itemFadeAnims[item._id]) {
        newAnims[item._id] = new Animated.Value(1);
      }
    });
    setItemFadeAnims(prev => ({ ...prev, ...newAnims }));
  }, [filteredItems]);

  const handleRemovePress = (itemId, itemName) => {
    const fadeAnim = itemFadeAnims[itemId];
    if (fadeAnim) {
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        handleRemoveFromSaved(itemId, itemName);
        fadeAnim.setValue(1);
      });
    } else {
      handleRemoveFromSaved(itemId, itemName);
    }
  };

  const stats = {
    totalItems: savedItems.length,
    bnpcItems: savedItems.filter((item) => item.category.isBNPC).length,
    totalValue: savedItems.reduce((sum, item) => sum + (item.price || 0), 0),
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedItems[item._id];
    const stockStatus = getStockStatus(item.stockQuantity);
    const fadeAnim = itemFadeAnims[item._id] || new Animated.Value(1);

    return (
      <Animated.View style={[styles.productCard, { opacity: fadeAnim }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => toggleItemExpansion(item._id)}
          style={styles.productCardTouchable}
        >
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.productMeta}>
                <View style={styles.skuBadge}>
                  <MaterialCommunityIcons name="tag-outline" size={12} color="#64748b" />
                  <Text style={styles.productSku}>{item.sku || 'N/A'}</Text>
                </View>
                {item.isBNPC && (
                  <View style={[styles.badge, styles.bnpcBadge]}>
                    <MaterialCommunityIcons name="shield-check" size={12} color="#00A86B" />
                    <Text style={styles.bnpcBadgeText}>BNPC</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
              <View style={[styles.stockIndicator, { backgroundColor: stockStatus.color + '20' }]}>
                <MaterialCommunityIcons 
                  name={stockStatus.icon} 
                  size={10} 
                  color={stockStatus.color} 
                />
                <Text style={[styles.stockIndicatorText, { color: stockStatus.color }]}>
                  {item.stockQuantity} {item.unit}
                </Text>
              </View>
            </View>
          </View>

          {/* Collapsible Details */}
          {isExpanded && (
            <Animated.View style={styles.expandedDetails}>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="barcode" size={16} color="#64748b" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Barcode</Text>
                    <Text style={styles.detailValue}>{item.barcode || 'N/A'}</Text>
                  </View>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="folder" size={16} color="#64748b" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Category</Text>
                    <Text style={styles.detailValue}>{item.category?.categoryName || 'Uncategorized'}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="currency-php" size={16} color="#64748b" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>SRP</Text>
                    <Text style={styles.detailValue}>{formatPrice(item.srp)}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="package-variant" size={16} color="#64748b" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Unit</Text>
                    <Text style={styles.detailValue}>{item.unit || 'pc'}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
        </TouchableOpacity>

        {/* Action Buttons - Only Remove */}
        <View style={styles.productFooter}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemovePress(item._id, item.name)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="heart-off-outline" size={20} color="#EF4444" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons name="heart-outline" size={48} color="#CBD5E1" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery.trim() ? "No items found" : "No saved items yet"}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery.trim()
          ? "Try different search terms"
          : "Items you save will appear here"}
      </Text>
      {searchQuery.trim() && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setSearchQuery("")}
        >
          <MaterialCommunityIcons name="close" size={16} color="#fff" />
          <Text style={styles.clearButtonText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
          <Text style={styles.loadingText}>Loading your saved items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Saved Items</Text>
          <Text style={styles.headerSubtitle}>
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <TouchableOpacity style={styles.statsButton}>
          <MaterialCommunityIcons name="heart" size={20} color="#EF4444" />
          <Text style={styles.statsButtonText}>{stats.totalItems}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search saved items..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
        {searchLoading && (
          <View style={styles.searchLoading}>
            <ActivityIndicator size="small" color="#00A86B" />
            <Text style={styles.searchLoadingText}>Searching...</Text>
          </View>
        )}
      </View>

      {/* Stats Overview - Simplified */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalItems}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.bnpcItems}</Text>
          <Text style={styles.statLabel}>BNPC Items</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₱{stats.totalValue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filter) => (
          <FilterChip
            key={filter.id}
            label={filter.label}
            icon={filter.icon}
            isActive={selectedFilter === filter.id}
            onPress={() => setSelectedFilter(filter.id)}
          />
        ))}
      </ScrollView>

      {/* Products List */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#00A86B"]}
            tintColor="#00A86B"
          />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  statsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    padding: 0,
  },
  searchLoading: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
    paddingLeft: 4,
  },
  searchLoadingText: {
    fontSize: 13,
    color: "#64748B",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 8,
  },
  filterScroll: {
    maxHeight: 50,
    marginBottom: 20,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilterChip: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  activeFilterChipText: {
    color: "#FFF",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemSeparator: {
    height: 12,
  },
  productCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productCardTouchable: {
    padding: 16,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 8,
    lineHeight: 22,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  skuBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  productSku: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  bnpcBadge: {
    backgroundColor: "rgba(0, 168, 107, 0.1)",
  },
  bnpcBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#00A86B",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  stockIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stockIndicatorText: {
    fontSize: 11,
    fontWeight: "600",
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },
  productFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    padding: 12,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: "#64748B",
  },
});

export default SavedItemsScreen;