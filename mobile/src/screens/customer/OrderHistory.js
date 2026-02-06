import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock data based on your Order schema
const mockOrders = [
  {
    id: 1,
    orderNumber: 'ORD-2024-001',
    date: 'Dec 28, 2024 • 10:30 AM',
    items: [
      { name: 'Organic Milk 1L', quantity: 2, price: 120.50 },
      { name: 'Fresh Eggs (Dozen)', quantity: 1, price: 85.00 },
      { name: 'Toothpaste', quantity: 1, price: 65.00 },
    ],
    baseAmount: 391.00,
    groceryEligibleSubtotal: 326.00,
    weeklyCapRemainingAtCheckout: 150.00,
    seniorPwdDiscountAmount: 32.60,
    pointsUsed: 50,
    finalAmountPaid: 308.40,
    pointsEarned: 30,
    status: 'CONFIRMED',
  },
  {
    id: 2,
    orderNumber: 'ORD-2024-002',
    date: 'Dec 25, 2024 • 02:15 PM',
    items: [
      { name: 'Rice 5kg', quantity: 1, price: 250.00 },
      { name: 'Cooking Oil 1L', quantity: 1, price: 120.00 },
    ],
    baseAmount: 370.00,
    groceryEligibleSubtotal: 370.00,
    weeklyCapRemainingAtCheckout: 0,
    seniorPwdDiscountAmount: 37.00,
    pointsUsed: 0,
    finalAmountPaid: 333.00,
    pointsEarned: 33,
    status: 'CONFIRMED',
  },
  {
    id: 3,
    orderNumber: 'ORD-2024-003',
    date: 'Dec 22, 2024 • 08:45 PM',
    items: [
      { name: 'Soap Bar', quantity: 3, price: 35.00 },
    ],
    baseAmount: 105.00,
    groceryEligibleSubtotal: 0,
    weeklyCapRemainingAtCheckout: 150.00,
    seniorPwdDiscountAmount: 0,
    pointsUsed: 0,
    finalAmountPaid: 105.00,
    pointsEarned: 10,
    status: 'CONFIRMED',
  },
];

const OrderHistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'month', label: 'This Month' },
    { id: 'week', label: 'This Week' },
    { id: 'discount', label: 'With Discount' },
  ];

  const fetchOrders = async () => {
    setLoading(true);
    setTimeout(() => {
      let filteredOrders = [...mockOrders];
      
      if (selectedFilter === 'month') {
        filteredOrders = filteredOrders.slice(0, 2);
      } else if (selectedFilter === 'week') {
        filteredOrders = filteredOrders.slice(0, 1);
      } else if (selectedFilter === 'discount') {
        filteredOrders = filteredOrders.filter(order => order.seniorPwdDiscountAmount > 0);
      }
      
      setOrders(filteredOrders);
      setLoading(false);
      setRefreshing(false);
    }, 500);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedFilter]);

  const formatPrice = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  // Local sub-component for Order Cards
  const OrderCard = ({ order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.storeBadge}>
          <MaterialCommunityIcons name="shopping" size={16} color="#0f172a" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.storeName}>{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{order.date}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.amountText}>{formatPrice(order.finalAmountPaid)}</Text>
          {order.pointsEarned > 0 && (
            <Text style={styles.pointsBadge}>+{order.pointsEarned} pts</Text>
          )}
        </View>
      </View>

      {/* Items Summary */}
      <View style={styles.itemsSection}>
        <View style={styles.itemsHeader}>
          <MaterialCommunityIcons name="package-variant" size={14} color="#64748b" />
          <Text style={styles.itemsLabel}>{order.items.length} items</Text>
        </View>
        <View style={styles.itemsList}>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <MaterialCommunityIcons name="circle-small" size={16} color="#64748b" />
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>₱{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.chip}>
          <MaterialCommunityIcons name="tag-percent" size={12} color="#64748b" />
          <Text style={styles.chipText}>
            {order.seniorPwdDiscountAmount > 0 
              ? `Discount: ${formatPrice(order.seniorPwdDiscountAmount)}`
              : 'No discount'
            }
          </Text>
        </View>
        <View style={[styles.chip, styles.statusChip]}>
          <View style={[styles.statusDot, styles.completedDot]} />
          <Text style={styles.chipText}>{order.status.toLowerCase()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => {
            setSelectedOrder(order);
            setShowDetails(true);
          }}
        >
          <Text style={styles.detailsText}>Details</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color="#00A86B" />
        </TouchableOpacity>
      </View>
    </View>
  );

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
    totalSpent: `₱${orders.reduce((sum, order) => sum + order.finalAmountPaid, 0).toFixed(2)}`,
    totalPoints: orders.reduce((sum, order) => sum + order.pointsEarned, 0),
    avgTransaction: `₱${(orders.reduce((sum, order) => sum + order.finalAmountPaid, 0) / (orders.length || 1)).toFixed(2)}`,
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="cart-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptyText}>
        {selectedFilter === 'all' 
          ? 'You haven\'t placed any orders yet'
          : 'No orders match your filter'
        }
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
          <Text style={styles.loadingText}>Loading orders...</Text>
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
          <Text style={styles.headerTitle}>Order History</Text>
          <Text style={styles.headerSubtitle}>Purchase history & receipts</Text>
        </View>
        <TouchableOpacity style={styles.filterIcon}>
          <MaterialCommunityIcons name="filter-variant" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* --- STATS OVERVIEW --- */}
        {/* <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalSpent}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {stats.totalPoints.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.avgTransaction}</Text>
            <Text style={styles.statLabel}>Avg Order</Text>
          </View>
        </View> */}

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

        {/* --- ORDERS LIST --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {orders.length > 0 ? (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        ) : (
          renderEmptyState()
        )}

        {/* --- ORDER TIPS --- */}
        <View style={styles.tipsCard}>
          <MaterialCommunityIcons name="shield-check" size={24} color="#0f172a" />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.tipsTitle}>All orders verified</Text>
            <Text style={styles.tipsText}>
              Discounts and points are automatically calculated
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          visible={showDetails}
          onClose={() => setShowDetails(false)}
        />
      )}
    </SafeAreaView>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, visible, onClose }) => {
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
            <Text style={styles.modalTitle}>Order Details</Text>
            <Text style={styles.modalSubtitle}>{order.orderNumber}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Order Info */}
          <View style={styles.modalSection}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={18} color="#64748b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Date & Time</Text>
                  <Text style={styles.infoValue}>{order.date}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#00A86B" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[styles.infoValue, styles.statusValue]}>Confirmed</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Order Items ({order.items.length})</Text>
            <View style={styles.modalItemsList}>
              {order.items.map((item, index) => (
                <View key={index} style={styles.modalItemCard}>
                  <View style={styles.modalItemIcon}>
                    <MaterialCommunityIcons name="circle-small" size={20} color="#64748b" />
                  </View>
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    <View style={styles.modalItemDetails}>
                      <Text style={styles.modalItemQuantity}>Qty: {item.quantity}</Text>
                      <Text style={styles.modalItemUnitPrice}>₱{item.price.toFixed(2)} each</Text>
                    </View>
                  </View>
                  <Text style={styles.modalItemTotal}>
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pricing Breakdown */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Price Breakdown</Text>
            <View style={styles.pricingCard}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Base Amount</Text>
                <Text style={styles.pricingValue}>{formatPrice(order.baseAmount)}</Text>
              </View>
              
              {order.groceryEligibleSubtotal > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Eligible Grocery</Text>
                  <Text style={styles.pricingValue}>{formatPrice(order.groceryEligibleSubtotal)}</Text>
                </View>
              )}
              
              {order.seniorPwdDiscountAmount > 0 && (
                <View style={styles.pricingRow}>
                  <View style={styles.discountRow}>
                    <MaterialCommunityIcons name="tag-percent" size={14} color="#00A86B" />
                    <Text style={[styles.pricingLabel, styles.discountLabel]}>Senior/PWD Discount</Text>
                  </View>
                  <Text style={[styles.pricingValue, styles.discountValue]}>
                    -{formatPrice(order.seniorPwdDiscountAmount)}
                  </Text>
                </View>
              )}
              
              {order.pointsUsed > 0 && (
                <View style={styles.pricingRow}>
                  <View style={styles.pointsRow}>
                    <MaterialCommunityIcons name="star" size={14} color="#FF9800" />
                    <Text style={[styles.pricingLabel, styles.pointsLabel]}>Points Used</Text>
                  </View>
                  <Text style={[styles.pricingValue, styles.pointsValue]}>
                    -{formatPrice(order.pointsUsed)}
                  </Text>
                </View>
              )}
              
              {order.weeklyCapRemainingAtCheckout !== undefined && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Weekly Cap Remaining</Text>
                  <Text style={styles.pricingValue}>{formatPrice(order.weeklyCapRemainingAtCheckout)}</Text>
                </View>
              )}
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>{formatPrice(order.finalAmountPaid)}</Text>
              </View>
            </View>
          </View>

          {/* Loyalty Points */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Loyalty Points</Text>
            <View style={styles.pointsCard}>
              <View style={styles.pointsRow}>
                <MaterialCommunityIcons name="star-circle" size={20} color="#FF9800" />
                <View style={styles.pointsInfo}>
                  <Text style={styles.pointsLabel}>Points Earned</Text>
                  <Text style={styles.pointsValue}>+{order.pointsEarned} points</Text>
                </View>
              </View>
              {order.pointsUsed > 0 && (
                <View style={styles.pointsRow}>
                  <MaterialCommunityIcons name="star" size={20} color="#00A86B" />
                  <View style={styles.pointsInfo}>
                    <Text style={styles.pointsLabel}>Points Used</Text>
                    <Text style={styles.pointsValue}>-{order.pointsUsed} points</Text>
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
          <TouchableOpacity style={styles.shareButton}>
            <MaterialCommunityIcons name="share" size={18} color="#fff" />
            <Text style={styles.shareButtonText}>Share</Text>
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

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginTop: 10,
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

  // Order Card
  orderCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  storeBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  storeName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  orderDate: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  pointsBadge: {
    fontSize: 11,
    color: "#00A86B",
    fontWeight: "800",
    marginTop: 4,
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  
  // Items Section
  itemsSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  itemsLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
  },
  itemQuantity: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    minWidth: 40,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },

  // Order Footer
  orderFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusChip: {
    backgroundColor: "rgba(0, 168, 107, 0.1)",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginLeft: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#94a3b8",
  },
  completedDot: {
    backgroundColor: "#00A86B",
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
    marginHorizontal: 24,
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
  shopButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#00A86B",
    borderRadius: 12,
  },
  shopButtonText: {
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
  infoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  statusValue: {
    color: "#00A86B",
  },
  modalItemsList: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modalItemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  modalItemIcon: {
    width: 32,
    alignItems: "center",
  },
  modalItemInfo: {
    flex: 1,
    marginLeft: 8,
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  modalItemDetails: {
    flexDirection: "row",
    gap: 12,
  },
  modalItemQuantity: {
    fontSize: 12,
    color: "#64748b",
  },
  modalItemUnitPrice: {
    fontSize: 12,
    color: "#64748b",
  },
  modalItemTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  pricingCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pricingLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  discountLabel: {
    color: "#00A86B",
  },
  discountValue: {
    color: "#00A86B",
  },
  pointsLabel: {
    color: "#FF9800",
  },
  pointsValue: {
    color: "#FF9800",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  pointsCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 2,
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
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
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#00A86B",
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});

export default OrderHistoryScreen;