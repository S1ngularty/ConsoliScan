import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {
  const [points, setPoints] = useState(1250);
  const [userName, setUserName] = useState("John Doe");
  const [recentTransactions, setRecentTransactions] = useState([
    { id: 1, store: "FreshMart", amount: 45.99, date: "Today", points: 45 },
    { id: 2, store: "SuperGrocer", amount: 32.50, date: "Yesterday", points: 32 },
    { id: 3, store: "Local Market", amount: 18.75, date: "2 days ago", points: 18 },
  ]);

  const quickActions = [
    {
      id: 1,
      title: "Scan Products",
      icon: "barcode-scan",
      color: "#00A86B",
      screen: "Scanning",
    },
    {
      id: 2,
      title: "My Cart",
      icon: "cart",
      color: "#FF6B6B",
      screen: "Cart",
    },
    {
      id: 3,
      title: "Nearby Stores",
      icon: "store",
      color: "#4ECDC4",
      screen: "Stores",
    },
    {
      id: 4,
      title: "View Receipts",
      icon: "receipt",
      color: "#FFD166",
      screen: "Receipts",
    },
  ];

  const specialOffers = [
    {
      id: 1,
      title: "Weekend Special",
      description: "20% off on fresh vegetables",
      validUntil: "Valid until Sunday",
      icon: "leaf",
    },
    {
      id: 2,
      title: "Double Points",
      description: "Earn double loyalty points",
      validUntil: "All day Wednesday",
      icon: "gift",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#00A86B" barStyle="light-content" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Points Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <MaterialCommunityIcons name="trophy" size={28} color="#FFD166" />
            <Text style={styles.pointsTitle}>Your Loyalty Points</Text>
          </View>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
            <Text style={styles.pointsLabel}>POINTS</Text>
          </View>
          <View style={styles.pointsInfo}>
            <View style={styles.pointsInfoItem}>
              <MaterialCommunityIcons name="trending-up" size={20} color="#00A86B" />
              <Text style={styles.pointsInfoText}>+125 points this week</Text>
            </View>
            <TouchableOpacity style={styles.redeemButton}>
              <Text style={styles.redeemButtonText}>Redeem Rewards</Text>
              <MaterialCommunityIcons name="gift" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.color + '20' }]}>
                  <MaterialCommunityIcons
                    name={action.icon}
                    size={28}
                    color={action.color}
                  />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionInfo}>
                <View style={styles.storeIcon}>
                  <MaterialCommunityIcons name="store" size={20} color="#00A86B" />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.storeName}>{transaction.store}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={styles.amountText}>${transaction.amount.toFixed(2)}</Text>
                <View style={styles.pointsBadge}>
                  <MaterialCommunityIcons name="star" size={12} color="#FFD166" />
                  <Text style={styles.pointsBadgeText}>+{transaction.points}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Special Offers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Offers</Text>
          {specialOffers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerIconContainer}>
                <MaterialCommunityIcons name={offer.icon} size={24} color="#fff" />
              </View>
              <View style={styles.offerContent}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerDescription}>{offer.description}</Text>
                <Text style={styles.offerValid}>{offer.validUntil}</Text>
              </View>
              <TouchableOpacity style={styles.offerButton}>
                <Text style={styles.offerButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Scan QR Button */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scanning')}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={28} color="#fff" />
          <Text style={styles.scanButtonText}>Scan QR Code at Checkout</Text>
        </TouchableOpacity>
      </ScrollView>
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
  greeting: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginBottom: 2,
  },
  userName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  pointsCard: {
    backgroundColor: "#fff",
    margin: 20,
    marginTop: -30,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pointsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  pointsContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#00A86B",
  },
  pointsLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    letterSpacing: 1,
  },
  pointsInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  pointsInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsInfoText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  redeemButton: {
    backgroundColor: "#00A86B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  redeemButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  seeAllText: {
    color: "#00A86B",
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flexDirection: "column",
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  transactionDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 209, 102, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  pointsBadgeText: {
    fontSize: 12,
    color: "#FFD166",
    fontWeight: "600",
    marginLeft: 4,
  },
  offerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#00A86B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  offerValid: {
    fontSize: 12,
    color: "#999",
  },
  offerButton: {
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  offerButtonText: {
    color: "#00A86B",
    fontWeight: "600",
  },
  scanButton: {
    backgroundColor: "#00A86B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});