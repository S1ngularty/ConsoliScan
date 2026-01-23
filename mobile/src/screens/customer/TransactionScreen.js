import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const TransactionsScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Local sub-component for Transaction Cards
  const TransactionCard = ({ store, date, amount, points, items, status }) => (
    <View style={styles.transCard}>
      <View style={styles.transHeader}>
        <View style={styles.storeBadge}>
          <MaterialCommunityIcons name="store-outline" size={16} color="#0f172a" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.storeName}>{store}</Text>
          <Text style={styles.transDate}>{date}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amountText}>{amount}</Text>
          <Text style={styles.pointsBadge}>+{points} pts</Text>
        </View>
      </View>
      
      <View style={styles.transFooter}>
        <View style={styles.chip}>
          <MaterialCommunityIcons name="package-variant" size={12} color="#64748b" />
          <Text style={styles.chipText}>{items} items</Text>
        </View>
        <View style={[styles.chip, styles.statusChip]}>
          <View style={[styles.statusDot, status === 'completed' && styles.completedDot]} />
          <Text style={styles.chipText}>{status}</Text>
        </View>
        <TouchableOpacity style={styles.detailsButton}>
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

  const filters = [
    { id: "all", label: "All" },
    { id: "month", label: "This Month" },
    { id: "week", label: "This Week" },
    { id: "store", label: "By Store" },
  ];

  const transactions = [
    { 
      id: 1, 
      store: "FreshMart Supermarket", 
      date: "Dec 28, 2024 • 10:30 AM", 
      amount: "₱45.99", 
      points: 45, 
      items: 8, 
      status: "completed" 
    },
    { 
      id: 2, 
      store: "City Grocers", 
      date: "Dec 25, 2024 • 02:15 PM", 
      amount: "₱120.50", 
      points: 120, 
      items: 15, 
      status: "completed" 
    },
    { 
      id: 3, 
      store: "QuickMart Express", 
      date: "Dec 22, 2024 • 08:45 PM", 
      amount: "₱18.75", 
      points: 18, 
      items: 3, 
      status: "completed" 
    },
    { 
      id: 4, 
      store: "Organic Garden", 
      date: "Nov 10, 2024 • 11:10 AM", 
      amount: "₱32.99", 
      points: 32, 
      items: 7, 
      status: "completed" 
    },
  ];

  const stats = {
    totalSpent: "₱2,840.75",
    totalPoints: 2840,
    avgTransaction: "₱62.08",
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerSubtitle}>Purchase history & receipts</Text>
        </View>
        <TouchableOpacity style={styles.filterIcon}>
          <MaterialCommunityIcons name="filter-variant" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- STATS OVERVIEW --- */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalSpent}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.avgTransaction}</Text>
            <Text style={styles.statLabel}>Avg. Transaction</Text>
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

        {/* --- TRANSACTIONS LIST --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            store={transaction.store}
            date={transaction.date}
            amount={transaction.amount}
            points={transaction.points}
            items={transaction.items}
            status={transaction.status}
          />
        ))}

        {/* --- RECEIPT TIPS --- */}
        <View style={styles.tipsCard}>
          <MaterialCommunityIcons name="receipt-text-outline" size={24} color="#0f172a" />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.tipsTitle}>All receipts stored securely</Text>
            <Text style={styles.tipsText}>Access anytime via blockchain verification</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F9FA" 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  headerTitle: { 
    fontSize: 24, 
    color: "#0f172a", 
    fontWeight: '800' 
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: "#94a3b8", 
    marginTop: 2,
    fontWeight: '500' 
  },
  filterIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  scrollContent: { 
    paddingBottom: 100 
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 25,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  statValue: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#0f172a', 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 11, 
    color: '#64748b', 
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5 
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  activeFilterChip: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  activeFilterChipText: {
    color: '#fff',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center'
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#0f172a' 
  },
  seeAll: { 
    color: '#00A86B', 
    fontWeight: '700', 
    fontSize: 13 
  },

  // Transaction Card
  transCard: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  transHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeName: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#0f172a' 
  },
  transDate: { 
    fontSize: 12, 
    color: '#94a3b8', 
    marginTop: 2 
  },
  amountText: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#0f172a' 
  },
  pointsBadge: { 
    fontSize: 11, 
    color: '#00A86B', 
    fontWeight: '800', 
    marginTop: 4,
    backgroundColor: 'rgba(0, 168, 107, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden'
  },
  transFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusChip: {
    backgroundColor: 'rgba(0, 168, 107, 0.1)',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginLeft: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
  },
  completedDot: {
    backgroundColor: '#00A86B',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00A86B',
    marginRight: 2,
  },

  // Tips Card
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  tipsTitle: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: '#0f172a', 
    marginBottom: 2 
  },
  tipsText: { 
    fontSize: 12, 
    color: '#64748b' 
  },
});

export default TransactionsScreen;