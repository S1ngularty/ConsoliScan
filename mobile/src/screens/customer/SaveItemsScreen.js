import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { debounce } from 'lodash';

// Mock data based on your Product schema
const mockSavedProducts = [
  {
    _id: '1',
    sku: 'PROD-001',
    name: 'Organic Milk 1L',
    barcode: '123456789012',
    price: 120.50,
    srp: 130.00,
    stockQuantity: 45,
    unit: 'pc',
    category: { name: 'Dairy' },
    isBNPC: false,
    bnpcCategory: null,
    images: [{ url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b' }],
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    _id: '2',
    sku: 'PROD-002',
    name: 'Fresh Eggs (Dozen)',
    barcode: '234567890123',
    price: 85.00,
    srp: 90.00,
    stockQuantity: 120,
    unit: 'pc',
    category: { name: 'Dairy' },
    isBNPC: false,
    bnpcCategory: null,
    images: [{ url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f' }],
    createdAt: '2024-01-10T14:45:00Z',
  },
  {
    _id: '3',
    sku: 'PROD-003',
    name: 'Premium Rice 5kg',
    barcode: '345678901234',
    price: 250.00,
    srp: 270.00,
    stockQuantity: 30,
    unit: 'pc',
    category: { name: 'Grains' },
    isBNPC: true,
    bnpcCategory: 'RICE',
    images: [{ url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c' }],
    createdAt: '2024-01-05T09:15:00Z',
  },
  {
    _id: '4',
    sku: 'PROD-004',
    name: 'Cooking Oil 1L',
    barcode: '456789012345',
    price: 120.00,
    srp: 135.00,
    stockQuantity: 80,
    unit: 'pc',
    category: { name: 'Cooking Essentials' },
    isBNPC: true,
    bnpcCategory: 'COOKING_OIL',
    images: [{ url: 'https://images.unsplash.com/photo-1533050487297-09b450131914' }],
    createdAt: '2023-12-28T16:20:00Z',
  },
  {
    _id: '5',
    sku: 'PROD-005',
    name: 'Chicken Breast 500g',
    barcode: '567890123456',
    price: 180.00,
    srp: 200.00,
    stockQuantity: 25,
    unit: 'pc',
    category: { name: 'Meat' },
    isBNPC: true,
    bnpcCategory: 'FRESH_POULTRY',
    images: [{ url: 'https://images.unsplash.com/photo-1604503468505-6ff3c5c5335b' }],
    createdAt: '2023-12-20T11:30:00Z',
  },
  {
    _id: '6',
    sku: 'PROD-006',
    name: 'Vegetable Pack Mix',
    barcode: '678901234567',
    price: 150.00,
    srp: 165.00,
    stockQuantity: 60,
    unit: 'pack',
    category: { name: 'Vegetables' },
    isBNPC: true,
    bnpcCategory: 'VEGETABLES',
    images: [{ url: 'https://images.unsplash.com/photo-1518843875459-f738682238a6' }],
    createdAt: '2023-12-15T14:00:00Z',
  },
];

const SavedItemsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'bnpc', label: 'BNPC Items' },
    { id: 'available', label: 'In Stock' },
    { id: 'price', label: 'Price Low-High' },
  ];

  const fetchSavedItems = async () => {
    setLoading(true);
    setTimeout(() => {
      setSavedItems(mockSavedProducts);
      setFilteredItems(mockSavedProducts);
      setLoading(false);
      setRefreshing(false);
    }, 500);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedItems();
  };

  const performSearch = useCallback(
    debounce((query) => {
      if (!query.trim()) {
        applyFilters(savedItems, selectedFilter);
        setSearchLoading(false);
        return;
      }

      const lowerQuery = query.toLowerCase();
      const results = savedItems.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.sku.toLowerCase().includes(lowerQuery) ||
        item.barcode.includes(query)
      );
      
      setFilteredItems(results);
      setSearchLoading(false);
    }, 500),
    [savedItems, selectedFilter]
  );

  const applyFilters = (items, filter) => {
    let filtered = [...items];
    
    if (filter === 'bnpc') {
      filtered = filtered.filter(item => item.isBNPC);
    } else if (filter === 'available') {
      filtered = filtered.filter(item => item.stockQuantity > 0);
    } else if (filter === 'price') {
      filtered = filtered.sort((a, b) => a.price - b.price);
    }
    
    setFilteredItems(filtered);
  };

  useEffect(() => {
    fetchSavedItems();
  }, []);

  useEffect(() => {
    if (searchQuery !== '') {
      setSearchLoading(true);
    }
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  useEffect(() => {
    applyFilters(savedItems, selectedFilter);
  }, [selectedFilter, savedItems]);

  const formatPrice = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  // Local sub-component for Filter Chips
  const FilterChip = ({ label, isActive, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterChip, isActive && styles.activeFilterChip]}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterChipText, isActive && styles.activeFilterChipText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const stats = {
    totalItems: savedItems.length,
    bnpcItems: savedItems.filter(item => item.isBNPC).length,
    outOfStock: savedItems.filter(item => item.stockQuantity === 0).length,
  };

  const renderItem = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productSku}>{item.sku}</Text>
        </View>
        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
      </View>

      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="barcode" size={14} color="#64748b" />
          <Text style={styles.barcodeText}>{item.barcode}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="package-variant" size={14} color="#64748b" />
          <Text style={styles.stockText}>
            Stock: {item.stockQuantity} {item.unit}
          </Text>
        </View>
      </View>

      <View style={styles.productFooter}>
        <View style={styles.tagsContainer}>
          {item.isBNPC && (
            <View style={[styles.tag, styles.bnpcTag]}>
              <MaterialCommunityIcons name="shield-check" size={12} color="#00A86B" />
              <Text style={styles.bnpcTagText}>BNPC</Text>
            </View>
          )}
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.category.name}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => {
            setSelectedItem(item);
            setShowDetails(true);
          }}
        >
          <Text style={styles.detailsText}>Details</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color="#00A86B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="heart-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>
        {searchQuery.trim() ? 'No Items Found' : 'No Saved Items'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery.trim()
          ? 'Try adjusting your search terms'
          : 'Save items to see them here'
        }
      </Text>
      {searchQuery.trim() && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setSearchQuery('')}
        >
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
          <Text style={styles.loadingText}>Loading saved items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Saved Items</Text>
          <Text style={styles.headerSubtitle}>Your favorite products</Text>
        </View>
        <TouchableOpacity style={styles.filterIcon}>
          <MaterialCommunityIcons name="sort" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* --- SEARCH BAR --- */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, SKU or barcode..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94a3b8" />
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* --- STATS OVERVIEW --- */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.bnpcItems}</Text>
            <Text style={styles.statLabel}>BNPC Items</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.outOfStock}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
        </View>

        {/* --- FILTER CHIPS --- */}
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
              isActive={selectedFilter === filter.id}
              onPress={() => setSelectedFilter(filter.id)}
            />
          ))}
        </ScrollView>

        {/* --- PRODUCTS LIST CONTAINER --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Products</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {filteredItems.length > 0 ? (
            <FlatList
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false} // Since it's inside a ScrollView
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            renderEmptyState()
          )}
        </View>

        {/* --- SAVING TIPS --- */}
        <View style={styles.tipsCard}>
          <MaterialCommunityIcons name="heart-plus" size={24} color="#0f172a" />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.tipsTitle}>Quick access to favorites</Text>
            <Text style={styles.tipsText}>
              Tap the heart icon on any product to save it here
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Product Details Modal */}
      {showDetails && selectedItem && (
        <ProductDetailsModal
          product={selectedItem}
          visible={showDetails}
          onClose={() => setShowDetails(false)}
        />
      )}
    </SafeAreaView>
  );
};

// Product Details Modal Component
const ProductDetailsModal = ({ product, visible, onClose }) => {
  if (!visible) return null;

  const formatPrice = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Product Details</Text>
            <Text style={styles.modalSubtitle}>{product.name}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Basic Info */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>SKU</Text>
                  <Text style={styles.infoValue}>{product.sku}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Barcode</Text>
                  <Text style={styles.infoValue}>{product.barcode}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Price</Text>
                  <Text style={styles.infoValue}>{formatPrice(product.price)}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>SRP</Text>
                  <Text style={styles.infoValue}>{formatPrice(product.srp)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Inventory Info */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Inventory</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Stock Quantity</Text>
                  <Text style={styles.infoValue}>
                    {product.stockQuantity} {product.unit}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[
                    styles.infoValue,
                    product.stockQuantity === 0 && styles.outOfStock,
                    product.stockQuantity < 10 && styles.lowStock,
                  ]}>
                    {product.stockQuantity === 0 ? 'Out of Stock' : 
                     product.stockQuantity < 10 ? 'Low Stock' : 'In Stock'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Category</Text>
                  <Text style={styles.infoValue}>{product.category.name}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>BNPC</Text>
                  <Text style={[
                    styles.infoValue,
                    product.isBNPC ? styles.bnpcYes : styles.bnpcNo
                  ]}>
                    {product.isBNPC ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Additional Info */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={18} color="#64748b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Added Date</Text>
                  <Text style={styles.infoValue}>
                    {new Date(product.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
              {product.isBNPC && product.bnpcCategory && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="shield-check" size={18} color="#00A86B" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>BNPC Category</Text>
                    <Text style={styles.infoValue}>{product.bnpcCategory.replace('_', ' ')}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={18} color="#64748b" />
            <Text style={styles.closeModalText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeButton}>
            <MaterialCommunityIcons name="heart-off" size={18} color="#ef4444" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    color: "#0f172a",
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
    fontWeight: "500",
  },
  filterIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 12,
  },

  // Search Bar
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "500",
  },
  searchLoading: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
    paddingLeft: 4,
  },
  searchLoadingText: {
    fontSize: 12,
    color: "#64748b",
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 25,
  },
  statBox: {
    flexGrow: 1,
    backgroundColor: "#fff",
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Filter Chips
  filterScroll: {
    marginBottom: 25,
  },
  filterContainer: {
    paddingHorizontal: 24,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  activeFilterChip: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  activeFilterChipText: {
    color: "#fff",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  seeAll: {
    color: "#00A86B",
    fontWeight: "700",
    fontSize: 13,
  },

  // List Container
  listContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  separator: {
    height: 12,
  },

  // Product Card
  productCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
    lineHeight: 22,
  },
  productSku: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  productDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barcodeText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  stockText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  bnpcTag: {
    backgroundColor: "rgba(0, 168, 107, 0.1)",
  },
  bnpcTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#00A86B",
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00A86B",
    marginRight: 2,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  clearButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#0f172a",
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  // Tips Card
  tipsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  tipsText: {
    fontSize: 12,
    color: "#64748b",
  },

  // Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoColumn: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  outOfStock: {
    color: "#ef4444",
  },
  lowStock: {
    color: "#f59e0b",
  },
  bnpcYes: {
    color: "#00A86B",
  },
  bnpcNo: {
    color: "#64748b",
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  closeModalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    gap: 8,
  },
  closeModalText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  removeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#fee2e2",
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    gap: 8,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
  },
});

export default SavedItemsScreen;