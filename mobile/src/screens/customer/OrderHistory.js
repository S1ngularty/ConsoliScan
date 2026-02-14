import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fetchOrders, downloadReceipt } from "../../api/order.api";

const OrderHistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const filters = [
    { id: "all", label: "All" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "discount", label: "With Discount" },
  ];

  const fetchOrderList = async () => {
    setLoading(true);
    try {
      const ordersData = await fetchOrders();
      console.log('Fetched orders:', ordersData);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderList();
  };

  useEffect(() => {
    fetchOrderList();
  }, []);

  // Handle receipt download
 const handleDownloadReceipt = async (orderId, checkoutCode) => {
  setDownloadingId(orderId);
  try {
    const result = await downloadReceipt(orderId, checkoutCode);
    if (result.success) {
      Alert.alert(
        "Success",
        "Receipt downloaded successfully",
        [{ text: "OK" }]
      );
    }
  } catch (error) {
    console.error('Download error:', error);
    Alert.alert(
      "Error",
      error.message || "Failed to download receipt. Please try again.",
      [{ text: "OK" }]
    );
  } finally {
    setDownloadingId(null);
  }
};

  // Filter orders based on selected filter
  const getFilteredOrders = () => {
    if (!orders.length) return [];
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    switch (selectedFilter) {
      case "week":
        return orders.filter(order => new Date(order.confirmedAt) >= startOfWeek);
      case "month":
        return orders.filter(order => new Date(order.confirmedAt) >= startOfMonth);
      case "discount":
        return orders.filter(order => 
          (order.discountBreakdown?.total || 0) > 0 || 
          order.seniorPwdDiscountAmount > 0
        );
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  const formatPrice = (amount) => {
    return `₱${(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Order Card Component
  const OrderCard = ({ order }) => {
    const totalDiscount = order.discountBreakdown?.total || 
      order.seniorPwdDiscountAmount || 0;
    
    const itemCount = order.items?.length || 0;
    const pointsEarned = order.loyaltyDiscount?.pointsEarned || order.pointsEarned || 0;
    const isDownloading = downloadingId === order._id;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.storeBadge}>
            <MaterialCommunityIcons name="shopping" size={16} color="#0f172a" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.storeName}>Order #{order.checkoutCode}</Text>
            <Text style={styles.orderDate}>{formatDate(order.confirmedAt)}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.amountText}>
              {formatPrice(order.finalAmountPaid)}
            </Text>
            {pointsEarned > 0 && (
              <Text style={styles.pointsBadge}>+{pointsEarned} pts</Text>
            )}
          </View>
        </View>

        {/* Items Summary */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <MaterialCommunityIcons
              name="package-variant"
              size={14}
              color="#64748b"
            />
            <Text style={styles.itemsLabel}>{itemCount} items</Text>
          </View>
          <View style={styles.itemsList}>
            {(order.items || []).slice(0, 3).map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <MaterialCommunityIcons
                  name="circle-small"
                  size={16}
                  color="#64748b"
                />
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  ₱{(item.unitPrice * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            {(order.items || []).length > 3 && (
              <Text style={styles.moreItems}>+{order.items.length - 3} more items</Text>
            )}
          </View>
        </View>

        <View style={styles.orderFooter}>
          {totalDiscount > 0 ? (
            <View style={styles.chip}>
              <MaterialCommunityIcons
                name="tag"
                size={12}
                color="#00A86B"
              />
              <Text style={[styles.chipText, styles.discountChipText]}>
                Discount: {formatPrice(totalDiscount)}
              </Text>
            </View>
          ) : (
            <View style={styles.chip}>
              <MaterialCommunityIcons
                name="tag"
                size={12}
                color="#64748b"
              />
              <Text style={styles.chipText}>No discount</Text>
            </View>
          )}
          
          <View style={[styles.chip, styles.statusChip]}>
            <View style={[styles.statusDot, styles.completedDot]} />
            <Text style={styles.chipText}>{order.status?.toLowerCase() || 'confirmed'}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              setSelectedOrder(order);
              setShowDetails(true);
            }}
          >
            <Text style={styles.detailsText}>Details</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={14}
              color="#00A86B"
            />
          </TouchableOpacity>
        </View>

        {/* Receipt Download Button */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => handleDownloadReceipt(order._id, order.checkoutCode)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <ActivityIndicator size="small" color="#00A86B" />
              <Text style={styles.downloadButtonText}>Downloading...</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="file-pdf-box" size={18} color="#00A86B" />
              <Text style={styles.downloadButtonText}>Download Receipt</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Filter Chip Component
  const FilterChip = ({ label, isActive, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterChip, isActive && styles.activeFilterChip]}
      activeOpacity={0.7}
    >
      <Text
        style={[styles.filterChipText, isActive && styles.activeFilterChipText]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Calculate stats from filtered orders
  const stats = {
    totalSpent: formatPrice(filteredOrders.reduce((sum, order) => sum + (order.finalAmountPaid || 0), 0)),
    totalPoints: filteredOrders.reduce((sum, order) => 
      sum + (order.loyaltyDiscount?.pointsEarned || order.pointsEarned || 0), 0),
    avgTransaction: filteredOrders.length > 0 
      ? formatPrice(filteredOrders.reduce((sum, order) => sum + (order.finalAmountPaid || 0), 0) / filteredOrders.length)
      : '₱0.00',
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="cart-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptyText}>
        {selectedFilter === "all"
          ? "You haven't placed any orders yet"
          : `No orders found for ${filters.find(f => f.id === selectedFilter)?.label.toLowerCase()} filter`}
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate("Home")}
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

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Order History</Text>
          <Text style={styles.headerSubtitle}>Purchase history & receipts</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsGrid}>
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
              isActive={selectedFilter === filter.id}
              onPress={() => setSelectedFilter(filter.id)}
            />
          ))}
        </ScrollView>

        {/* Orders List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <Text style={styles.orderCount}>{filteredOrders.length} orders</Text>
        </View>

        {filteredOrders.length > 0
          ? filteredOrders.map((order) => (
              <OrderCard key={order._id || order.checkoutCode} order={order} />
            ))
          : renderEmptyState()}

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <MaterialCommunityIcons
            name="shield-check"
            size={24}
            color="#0f172a"
          />
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
          onDownload={handleDownloadReceipt}
          downloadingId={downloadingId}
        />
      )}
    </SafeAreaView>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, visible, onClose, onDownload, downloadingId }) => {
  if (!visible) return null;

  const formatPrice = (amount) => {
    return `₱${(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalDiscount = order.discountBreakdown?.total || order.seniorPwdDiscountAmount || 0;
  const bnpcDiscount = order.discountBreakdown?.bnpc || order.bnpcDiscount?.total || 0;
  const promoDiscount = order.discountBreakdown?.promo || order.promoDiscount?.amount || 0;
  const loyaltyDiscount = order.discountBreakdown?.loyalty || order.loyaltyDiscount?.amount || 0;
  const pointsUsed = order.loyaltyDiscount?.pointsUsed || 0;
  const pointsEarned = order.loyaltyDiscount?.pointsEarned || order.pointsEarned || 0;
  const isDownloading = downloadingId === order._id;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Order Details</Text>
            <Text style={styles.modalSubtitle}>#{order.checkoutCode}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Info */}
          <View style={styles.modalSection}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={18}
                  color="#64748b"
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Date & Time</Text>
                  <Text style={styles.infoValue}>{formatDate(order.confirmedAt)}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color="#00A86B"
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[styles.infoValue, styles.statusValue]}>
                    {order.status || 'Confirmed'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>
              Order Items ({(order.items || []).length})
            </Text>
            <View style={styles.modalItemsList}>
              {(order.items || []).map((item, index) => (
                <View key={index} style={styles.modalItemCard}>
                  <View style={styles.modalItemIcon}>
                    <MaterialCommunityIcons
                      name="circle-small"
                      size={20}
                      color="#64748b"
                    />
                  </View>
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    <View style={styles.modalItemDetails}>
                      <Text style={styles.modalItemQuantity}>
                        Qty: {item.quantity}
                      </Text>
                      <Text style={styles.modalItemUnitPrice}>
                        ₱{(item.unitPrice || 0).toFixed(2)} each
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalItemTotal}>
                    ₱{((item.unitPrice || 0) * item.quantity).toFixed(2)}
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
                <Text style={styles.pricingValue}>
                  {formatPrice(order.baseAmount)}
                </Text>
              </View>

              {order.bnpcEligibleSubtotal > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>BNPC Eligible</Text>
                  <Text style={styles.pricingValue}>
                    {formatPrice(order.bnpcEligibleSubtotal)}
                  </Text>
                </View>
              )}

              {bnpcDiscount > 0 && (
                <View style={styles.pricingRow}>
                  <View style={styles.discountRow}>
                    <MaterialCommunityIcons
                      name="tag"
                      size={14}
                      color="#00A86B"
                    />
                    <Text style={[styles.pricingLabel, styles.discountLabel]}>
                      BNPC Discount (5%)
                    </Text>
                  </View>
                  <Text style={[styles.pricingValue, styles.discountValue]}>
                    -{formatPrice(bnpcDiscount)}
                  </Text>
                </View>
              )}

              {promoDiscount > 0 && (
                <View style={styles.pricingRow}>
                  <View style={styles.discountRow}>
                    <MaterialCommunityIcons
                      name="sale"
                      size={14}
                      color="#FF9800"
                    />
                    <Text style={[styles.pricingLabel, styles.promoLabel]}>
                      Promo {order.promoDiscount?.code || ''}
                    </Text>
                  </View>
                  <Text style={[styles.pricingValue, styles.promoValue]}>
                    -{formatPrice(promoDiscount)}
                  </Text>
                </View>
              )}

              {loyaltyDiscount > 0 && (
                <View style={styles.pricingRow}>
                  <View style={styles.pointsRow}>
                    <MaterialCommunityIcons
                      name="star"
                      size={14}
                      color="#FFD700"
                    />
                    <Text style={[styles.pricingLabel, styles.loyaltyLabel]}>
                      Loyalty Points
                    </Text>
                  </View>
                  <Text style={[styles.pricingValue, styles.loyaltyValue]}>
                    -{formatPrice(loyaltyDiscount)}
                  </Text>
                </View>
              )}

              {totalDiscount > 0 && (
                <View style={styles.totalDiscountRow}>
                  <Text style={styles.totalDiscountLabel}>Total Discount</Text>
                  <Text style={styles.totalDiscountValue}>
                    -{formatPrice(totalDiscount)}
                  </Text>
                </View>
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(order.finalAmountPaid)}
                </Text>
              </View>
            </View>
          </View>

          {/* BNPC Caps (if applicable) */}
          {order.bnpcCaps && order.bnpcCaps.discountCap?.usedAfter > 0 && (
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>BNPC Weekly Caps</Text>
              <View style={styles.capsCard}>
                <View style={styles.capRow}>
                  <Text style={styles.capLabel}>Discount Used This Week</Text>
                  <Text style={styles.capValue}>
                    ₱{order.bnpcCaps.discountCap.usedAfter.toFixed(2)} / 125
                  </Text>
                </View>
                <View style={styles.capRow}>
                  <Text style={styles.capLabel}>Purchase Used This Week</Text>
                  <Text style={styles.capValue}>
                    ₱{order.bnpcCaps.purchaseCap.usedAfter.toFixed(2)} / 2500
                  </Text>
                </View>
                {order.bnpcCaps.weekEnd && (
                  <Text style={styles.capNote}>
                    Resets: {new Date(order.bnpcCaps.weekEnd).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Loyalty Points */}
          {(pointsUsed > 0 || pointsEarned > 0) && (
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Loyalty Points</Text>
              <View style={styles.pointsCard}>
                {pointsUsed > 0 && (
                  <View style={styles.pointsRow}>
                    <MaterialCommunityIcons
                      name="star-minus"
                      size={20}
                      color="#DC2626"
                    />
                    <View style={styles.pointsInfo}>
                      <Text style={styles.pointsLabel}>Points Used</Text>
                      <Text style={[styles.pointsValue, styles.pointsUsedValue]}>
                        -{pointsUsed} points
                      </Text>
                    </View>
                  </View>
                )}
                {pointsEarned > 0 && (
                  <View style={styles.pointsRow}>
                    <MaterialCommunityIcons
                      name="star-plus"
                      size={20}
                      color="#00A86B"
                    />
                    <View style={styles.pointsInfo}>
                      <Text style={styles.pointsLabel}>Points Earned</Text>
                      <Text style={[styles.pointsValue, styles.pointsEarnedValue]}>
                        +{pointsEarned} points
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={18} color="#64748b" />
            <Text style={styles.closeModalText}>Close</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.downloadReceiptButton}
            onPress={() => onDownload(order._id, order.checkoutCode)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.downloadReceiptButtonText}>Downloading...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="file-pdf-box" size={18} color="#fff" />
                <Text style={styles.downloadReceiptButtonText}>Download Receipt</Text>
              </>
            )}
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
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 25,
  },
  statBox: {
    flex: 1,
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
  orderCount: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
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
    textAlign: "center",
  },
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
  moreItems: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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
  discountChipText: {
    color: "#00A86B",
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
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  downloadButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#00A86B",
    marginLeft: 4,
  },
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
  promoLabel: {
    color: "#FF9800",
  },
  promoValue: {
    color: "#FF9800",
  },
  loyaltyLabel: {
    color: "#FFD700",
  },
  loyaltyValue: {
    color: "#FFD700",
  },
  totalDiscountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalDiscountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  totalDiscountValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
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
  capsCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  capRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  capLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  capValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  capNote: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 4,
  },
  pointsCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 16,
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
  },
  pointsUsedValue: {
    color: "#DC2626",
  },
  pointsEarnedValue: {
    color: "#00A86B",
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
  downloadReceiptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#00A86B",
    borderRadius: 12,
    gap: 8,
  },
  downloadReceiptButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});

export default OrderHistoryScreen;