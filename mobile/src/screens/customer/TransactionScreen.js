import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  SectionList,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TransactionsScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Mock data - grouped by month
  const transactionSections = [
    {
      title: "December 2024",
      data: [
        {
          id: "1",
          store: "FreshMart Supermarket",
          date: "Dec 28, 2024",
          time: "10:30 AM",
          amount: 45.99,
          points: 45,
          items: 8,
          paymentMethod: "Credit Card",
          status: "completed",
          receiptId: "RC-2024-12-28-001",
          itemsList: ["Apples", "Bread", "Milk", "Eggs", "Cheese", "Tomatoes", "Chicken", "Rice"],
        },
        {
          id: "2",
          store: "City Grocers",
          date: "Dec 25, 2024",
          time: "02:15 PM",
          amount: 120.5,
          points: 120,
          items: 15,
          paymentMethod: "Digital Wallet",
          status: "completed",
          receiptId: "RC-2024-12-25-001",
          itemsList: ["Christmas Ham", "Wine", "Cheese Platter", "Chocolate", "Cookies"],
        },
        {
          id: "3",
          store: "QuickMart Express",
          date: "Dec 22, 2024",
          time: "08:45 PM",
          amount: 18.75,
          points: 18,
          items: 3,
          paymentMethod: "Cash",
          status: "completed",
          receiptId: "RC-2024-12-22-001",
          itemsList: ["Milk", "Bread", "Butter"],
        },
      ],
    },
    {
      title: "November 2024",
      data: [
        {
          id: "4",
          store: "FreshMart Supermarket",
          date: "Nov 18, 2024",
          time: "04:20 PM",
          amount: 65.25,
          points: 65,
          items: 12,
          paymentMethod: "Credit Card",
          status: "completed",
          receiptId: "RC-2024-11-18-001",
          itemsList: ["Pasta", "Pasta Sauce", "Ground Beef", "Onions", "Garlic", "Parmesan"],
        },
        {
          id: "5",
          store: "Organic Garden",
          date: "Nov 10, 2024",
          time: "11:10 AM",
          amount: 32.99,
          points: 32,
          items: 7,
          paymentMethod: "Digital Wallet",
          status: "completed",
          receiptId: "RC-2024-11-10-001",
          itemsList: ["Organic Lettuce", "Tomatoes", "Cucumbers", "Bell Peppers", "Avocado"],
        },
      ],
    },
    {
      title: "October 2024",
      data: [
        {
          id: "6",
          store: "FreshMart Supermarket",
          date: "Oct 29, 2024",
          time: "01:45 PM",
          amount: 89.99,
          points: 89,
          items: 14,
          paymentMethod: "Credit Card",
          status: "completed",
          receiptId: "RC-2024-10-29-001",
          itemsList: ["Cleaning Supplies", "Paper Towels", "Toilet Paper", "Laundry Detergent"],
        },
      ],
    },
  ];

  const filters = [
    { id: "all", label: "All" },
    { id: "month", label: "This Month" },
    { id: "week", label: "This Week" },
    { id: "store", label: "By Store" },
  ];

  const stats = {
    totalSpent: 372.47,
    totalPoints: 369,
    totalTransactions: 6,
    avgTransaction: 62.08,
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => setSelectedTransaction(item)}
      activeOpacity={0.7}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.storeInfo}>
          <View style={styles.storeIcon}>
            <MaterialCommunityIcons name="store" size={20} color="#00A86B" />
          </View>
          <View>
            <Text style={styles.storeName}>{item.store}</Text>
            <Text style={styles.transactionDate}>
              {item.date} • {item.time}
            </Text>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
          <View style={styles.pointsContainer}>
            <MaterialCommunityIcons name="star" size={14} color="#FFD166" />
            <Text style={styles.pointsText}>+{item.points}</Text>
          </View>
        </View>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="package-variant" size={16} color="#666" />
          <Text style={styles.detailText}>{item.items} items</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="credit-card" size={16} color="#666" />
          <Text style={styles.detailText}>{item.paymentMethod}</Text>
        </View>
        <View style={[styles.statusBadge, styles.statusCompleted]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewReceiptButton}>
        <Text style={styles.viewReceiptText}>View Receipt</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#00A86B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderTransactionDetailModal = () => {
    if (!selectedTransaction) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Transaction Details</Text>
            <TouchableOpacity onPress={() => setSelectedTransaction(null)}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Store Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Store:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.store}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date & Time:</Text>
                <Text style={styles.detailValue}>
                  {selectedTransaction.date} at {selectedTransaction.time}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Receipt ID:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.receiptId}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Purchase Summary</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Amount:</Text>
                <Text style={[styles.detailValue, styles.amountLarge]}>
                  ${selectedTransaction.amount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Items Purchased:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.items} items</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Method:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.paymentMethod}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Points Earned:</Text>
                <View style={styles.pointsEarned}>
                  <MaterialCommunityIcons name="star" size={16} color="#FFD166" />
                  <Text style={styles.pointsValue}>+{selectedTransaction.points}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Items List</Text>
              {selectedTransaction.itemsList.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <MaterialCommunityIcons name="checkbox-marked-circle" size={16} color="#00A86B" />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="download" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Download Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.shareButton]}>
                <MaterialCommunityIcons name="share" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Share Receipt</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#00A86B" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Transactions</Text>
            <Text style={styles.headerSubtitle}>Your purchase history</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <MaterialCommunityIcons name="filter-variant" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${stats.totalSpent.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalPoints}</Text>
          <Text style={styles.statLabel}>Points Earned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalTransactions}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterTab,
              selectedFilter === filter.id && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === filter.id && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transactions List */}
      <SectionList
        sections={transactionSections}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Transaction Detail Modal */}
      {renderTransactionDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#00A86B",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00A86B",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterTabActive: {
    backgroundColor: "#00A86B",
    borderColor: "#00A86B",
  },
  filterTabText: {
    color: "#666",
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  storeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#666",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 209, 102, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pointsText: {
    fontSize: 12,
    color: "#FFD166",
    fontWeight: "600",
    marginLeft: 4,
  },
  transactionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: "rgba(0, 168, 107, 0.1)",
  },
  statusText: {
    fontSize: 12,
    color: "#00A86B",
    fontWeight: "600",
  },
  viewReceiptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "rgba(0, 168, 107, 0.05)",
    borderRadius: 8,
  },
  viewReceiptText: {
    color: "#00A86B",
    fontWeight: "600",
    marginRight: 4,
  },
  // Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  detailSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  amountLarge: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00A86B",
  },
  pointsEarned: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 209, 102, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsValue: {
    fontSize: 14,
    color: "#FFD166",
    fontWeight: "600",
    marginLeft: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A86B",
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  shareButton: {
    backgroundColor: "#4ECDC4",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
});