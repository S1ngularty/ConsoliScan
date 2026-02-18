import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getSalesReports } from "../../api/cashier.api";

const { width } = Dimensions.get("window");

const ReportsScreen = ({ navigation }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  useFocusEffect(
    useCallback(() => {
      fetchReport();
    }, [selectedPeriod]),
  );

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await getSalesReports({ period: selectedPeriod });
      setReportData(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReport();
  };

  const PeriodButton = ({ period, label }) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.periodButtonActive,
      ]}
      onPress={() => setSelectedPeriod(period)}
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

  const StatCard = ({ icon, label, value, color }) => (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
          <Text style={styles.headerTitle}>Sales Reports</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.periodSelector}>
        <PeriodButton period="today" label="Today" />
        <PeriodButton period="week" label="This Week" />
        <PeriodButton period="month" label="This Month" />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {reportData && (
            <>
              <View style={styles.statsGrid}>
                <StatCard
                  icon="currency-php"
                  label="Total Revenue"
                  value={`₱${reportData.summary.totalRevenue.toLocaleString()}`}
                  color="#00A86B"
                />
                <StatCard
                  icon="receipt"
                  label="Transactions"
                  value={reportData.summary.totalTransactions}
                  color="#3B82F6"
                />
                <StatCard
                  icon="package-variant"
                  label="Items Sold"
                  value={reportData.summary.totalItems}
                  color="#8B5CF6"
                />
                <StatCard
                  icon="account-group"
                  label="PWD/Senior"
                  value={reportData.summary.specialCustomers}
                  color="#FF9800"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Methods</Text>
                <View style={styles.paymentMethodsCard}>
                  {Object.entries(reportData.paymentMethods).map(
                    ([method, count]) => (
                      <View key={method} style={styles.paymentRow}>
                        <Text style={styles.paymentMethod}>{method}</Text>
                        <Text style={styles.paymentCount}>
                          {count} transactions
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              </View>

              {reportData.topItems && reportData.topItems.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Top Selling Items</Text>
                  <View style={styles.topItemsCard}>
                    {reportData.topItems.slice(0, 5).map((item, index) => (
                      <View key={index} style={styles.topItemRow}>
                        <View style={styles.topItemRank}>
                          <Text style={styles.rankText}>{index + 1}</Text>
                        </View>
                        <View style={styles.topItemInfo}>
                          <Text style={styles.topItemName}>{item.name}</Text>
                          <Text style={styles.topItemStats}>
                            {item.quantity} units • ₱{item.revenue.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
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
  headerRight: { padding: 8, width: 40 },
  periodSelector: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    gap: 8,
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
  content: { flex: 1 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 8,
  },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  paymentMethodsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  paymentMethod: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  paymentCount: { fontSize: 14, color: "#64748B" },
  topItemsCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16 },
  topItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00A86B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  topItemInfo: { flex: 1 },
  topItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  topItemStats: { fontSize: 12, color: "#64748B" },
});

export default ReportsScreen;
