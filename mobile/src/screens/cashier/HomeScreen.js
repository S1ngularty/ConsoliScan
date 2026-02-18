import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  getDashboardStats,
  getRecentTransactions,
} from "../../api/cashier.api";
import ScanMethodModal from "../../components/cashier/ScanMethodModal";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [greeting, setGreeting] = useState("");
  const [stats, setStats] = useState({
    salesToday: 0,
    revenue: 0,
    transactions: 0,
    specialCustomers: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dashboard data on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, []),
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const dashboardData = await getDashboardStats();
      if (dashboardData) {
        setStats({
          salesToday: dashboardData.today?.salesToday || 0,
          revenue: dashboardData.today?.revenue || 0,
          transactions: dashboardData.today?.transactions || 0,
          specialCustomers: dashboardData.today?.specialCustomers || 0,
        });
      }

      // Fetch recent transactions
      const transactionsData = await getRecentTransactions(5);
      if (transactionsData?.transactions) {
        setRecentTransactions(transactionsData.transactions);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const updateTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    setCurrentTime(timeString);

    const hour = now.getHours();
    let newGreeting = "Good Evening";
    if (hour < 12) newGreeting = "Good Morning";
    else if (hour < 18) newGreeting = "Good Afternoon";
    setGreeting(newGreeting);
  };

  const QuickActionButton = ({
    icon,
    title,
    subtitle,
    onPress,
    color = "#00A86B",
  }) => (
    <TouchableOpacity
      style={styles.quickActionCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon} size={32} color={color} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );

  const StatCard = ({ value, label, icon, color = "#1E293B" }) => (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScanMethodModal
        visible={scanModalVisible}
        onClose={() => setScanModalVisible(false)}
        navigation={navigation}
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuButton}
        >
          <MaterialCommunityIcons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ConsoliScan Cashier</Text>
        </View>

        <View style={styles.timeBadge}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#00A86B"]}
              tintColor="#00A86B"
            />
          }
        >
          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>
              {greeting}, <Text style={styles.userName}>Cashier</Text>
            </Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                value={stats.salesToday.toLocaleString()}
                label="Sales Today"
                icon="shopping"
                color="#00A86B"
              />
              <StatCard
                value={`₱${stats.revenue.toLocaleString()}`}
                label="Revenue"
                icon="currency-php"
                color="#00965C"
              />
              <StatCard
                value={stats.transactions.toString()}
                label="Transactions"
                icon="receipt"
                color="#64748B"
              />
              <StatCard
                value={stats.specialCustomers.toString()}
                label="PWD/Senior"
                icon="account-group"
                color="#FF9800"
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <QuickActionButton
                icon="shopping-cart"
                title="New Transaction"
                subtitle="Start scanning items"
                onPress={() => setScanModalVisible(true)}
                color="#00A86B"
              />

              <QuickActionButton
                icon="package-variant"
                title="Inventory"
                subtitle="Check stock levels"
                onPress={() => navigation.navigate("Inventory")}
                color="#3B82F6"
              />

              <QuickActionButton
                icon="chart-line"
                title="Reports"
                subtitle="View sales analytics"
                onPress={() => navigation.navigate("Reports")}
                color="#8B5CF6"
              />

              <QuickActionButton
                icon="account-group"
                title="Customers"
                subtitle="PWD/Senior lookup"
                onPress={() => console.log("Customer Lookup")}
                color="#EF4444"
              />

              <QuickActionButton
                icon="swap-horizontal"
                title="Exchange Returns"
                subtitle="Process item returns"
                onPress={() => navigation.navigate("ExchangeReturn")}
                color="#10B981"
              />
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Transaction")}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentList}>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => (
                  <TouchableOpacity
                    key={transaction._id || index}
                    style={styles.recentItem}
                    activeOpacity={0.7}
                  >
                    <View style={styles.recentItemLeft}>
                      <View style={styles.transactionIcon}>
                        <MaterialCommunityIcons
                          name="receipt"
                          size={20}
                          color="#00A86B"
                        />
                      </View>
                      <View>
                        <Text style={styles.transactionId}>
                          {transaction.transactionId}
                        </Text>
                        <Text style={styles.transactionTime}>
                          {new Date(transaction.timestamp).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.recentItemRight}>
                      <Text style={styles.transactionAmount}>
                        ₱{transaction.amount.toFixed(2)}
                      </Text>
                      <View style={styles.paymentBadge}>
                        <Text style={styles.paymentText}>
                          {transaction.paymentMethod}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyTransactions}>
                  <MaterialCommunityIcons
                    name="receipt-text-outline"
                    size={40}
                    color="#94A3B8"
                  />
                  <Text style={styles.emptyText}>
                    No transactions yet today
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Start scanning to see recent transactions
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#00A86B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  menuButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  greetingSection: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  userName: {
    color: "#00A86B",
  },
  dateText: {
    fontSize: 14,
    color: "#64748B",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
  },
  statsSection: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  statIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  actionsSection: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: (width - 56) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8F5EF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  recentSection: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    color: "#00A86B",
    fontSize: 14,
    fontWeight: "500",
  },
  recentList: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    overflow: "hidden",
  },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8F5EF",
  },
  recentItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5EF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: "#64748B",
  },
  recentItemRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  paymentBadge: {
    backgroundColor: "#E8F5EF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paymentText: {
    fontSize: 10,
    color: "#00A86B",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  emptyTransactions: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
    textAlign: "center",
  },
});

export default HomeScreen;
