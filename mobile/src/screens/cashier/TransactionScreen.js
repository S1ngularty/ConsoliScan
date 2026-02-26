import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { getTransactionHistory } from "../../api/cashier.api";
import ScanMethodModal from "../../components/cashier/ScanMethodModal";
import OfflineIndicator from "../../components/Common/OfflineIndicator";

const TransactionScreen = ({ navigation }) => {
  const [showScanModal, setShowScanModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const networkState = useSelector((state) => state.network);

  // Local state to trigger re-renders when network state changes
  const [isOffline, setIsOffline] = useState(false);
  const [isServerDown, setIsServerDown] = useState(false);

  // Sync with Redux network state
  useEffect(() => {
    setIsOffline(networkState.isOffline);
    setIsServerDown(networkState.isServerDown);
  }, [networkState.isOffline, networkState.isServerDown]);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [selectedPeriod]),
  );

  const getDateRange = (period) => {
    const now = new Date();
    let startDate, endDate;

    if (period === "today") {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "week") {
      // Start of week (Sunday)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      // Start of month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  const fetchTransactions = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const dateRange = getDateRange(selectedPeriod);
      const params = {
        ...dateRange,
        page: isLoadMore ? page + 1 : 1,
        limit: 20,
      };

      const data = await getTransactionHistory(params);

      if (isLoadMore) {
        setTransactions((prev) => [...prev, ...data.transactions]);
        setPage((prev) => prev + 1);
      } else {
        setTransactions(data.transactions);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTransactions(true);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentIcon = (method) => {
    switch (method.toLowerCase()) {
      case "cash":
        return "cash";
      case "gcash":
      case "e-wallet":
        return "wallet";
      case "card":
      case "credit card":
      case "debit card":
        return "credit-card";
      default:
        return "cash-register";
    }
  };

  const PeriodButton = ({ period, label }) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.periodButtonActive,
      ]}
      onPress={() => {
        setSelectedPeriod(period);
        setPage(1);
      }}
    >
      <Text
        style={[
          styles.periodButtonText,
          selectedPeriod === period && styles.periodButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const TransactionCard = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionIdContainer}>
          <Text style={styles.transactionId}>{item.transactionId}</Text>
          {item.isSpecialCustomer && (
            <View style={styles.specialBadge}>
              <MaterialCommunityIcons
                name="account-heart"
                size={14}
                color="#FF9800"
              />
              <Text style={styles.specialBadgeText}>PWD/Senior</Text>
            </View>
          )}
        </View>
        <Text style={styles.transactionAmount}>₱{item.amount.toFixed(2)}</Text>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
            color="#64748B"
          />
          <Text style={styles.detailText}>
            {formatDate(item.timestamp)} • {formatTime(item.timestamp)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name={getPaymentIcon(item.paymentMethod)}
            size={16}
            color="#64748B"
          />
          <Text style={styles.detailText}>{item.paymentMethod}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="package-variant"
            size={16}
            color="#64748B"
          />
          <Text style={styles.detailText}>{item.itemCount} items</Text>
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="receipt-text-outline"
        size={80}
        color="#CBD5E1"
      />
      <Text style={styles.emptyText}>No transactions found</Text>
      <Text style={styles.emptySubtext}>
        {selectedPeriod === "today"
          ? "No transactions made today"
          : selectedPeriod === "week"
            ? "No transactions this week"
            : "No transactions this month"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuButton}
        >
          <MaterialCommunityIcons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Transactions</Text>
        </View>

        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => setShowScanModal(true)}
        >
          <MaterialCommunityIcons
            name="barcode-scan"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Period Filter */}
      <View style={styles.filterContainer}>
        <PeriodButton period="today" label="Today" />
        <PeriodButton period="week" label="This Week" />
        <PeriodButton period="month" label="This Month" />
      </View>

      {/* Transaction List */}
      {(loading || isOffline || isServerDown) && !refreshing ? (
        isOffline || isServerDown ? (
          <OfflineIndicator />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00A86B" />
          </View>
        )
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <TransactionCard item={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={<EmptyState />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#00A86B" />
              </View>
            ) : null
          }
        />
      )}

      {/* Scan Modal */}
      <ScanMethodModal
        visible={showScanModal}
        onClose={() => setShowScanModal(false)}
        navigation={navigation}
      />
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
  filterContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00A86B",
    alignItems: "center",
  },
  periodButtonActive: { backgroundColor: "#00A86B" },
  periodButtonText: { fontSize: 14, fontWeight: "600", color: "#00A86B" },
  periodButtonTextActive: { color: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, flexGrow: 1 },
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  transactionIdContainer: { flex: 1 },
  transactionId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  specialBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4E5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    gap: 4,
  },
  specialBadgeText: { fontSize: 11, fontWeight: "600", color: "#FF9800" },
  transactionAmount: { fontSize: 20, fontWeight: "800", color: "#00A86B" },
  transactionDetails: { gap: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 14, color: "#64748B" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 16,
  },
  emptySubtext: { fontSize: 14, color: "#CBD5E1", marginTop: 4 },
  footerLoader: { paddingVertical: 20, alignItems: "center" },
});

export default TransactionScreen;
