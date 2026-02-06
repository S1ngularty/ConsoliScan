import React, { useEffect, useState } from "react";
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
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import asyncStorage from "@react-native-async-storage/async-storage";
import { setCart } from "../../features/slices/cart/cartSlice";
import { getCartFromServer } from "../../features/slices/cart/cartThunks";

const HomeScreen = ({ navigation }) => {
  const [points] = useState(1250);
  const userState = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Mock weekly savings data
  const [weeklyStats, setWeeklyStats] = useState({
    bnpcSaved: 85,
    totalSavings: 210,
    itemsScanned: 24,
  });

  useEffect(() => {
    (async () => {
      if (!userState.isLoggedIn) return
        dispatch(getCartFromServer());
      
      //  const currCart = await asyncStorage.getItem("cart");
      //  console.log(JSON.parse(currCart))
      //    dispatch(setCart(JSON.parse(currCart)));
    })();
  }, []);

  // Local sub-component for Action Cards
  const ActionCard = ({ title, icon, onPress, isPrimary }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, isPrimary && styles.primaryCard]}
    >
      <View style={[styles.cardIconBox, isPrimary && styles.primaryIconBox]}>
        <MaterialCommunityIcons
          name={icon}
          size={26}
          color={isPrimary ? "#00A86B" : "#64748b"}
        />
      </View>
      <Text style={[styles.cardTitle, isPrimary && styles.primaryCardTitle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Local sub-component for Activity Rows
  const TransactionItem = ({ product, store, date, amount, saved }) => (
    <View style={styles.transRow}>
      <View style={styles.transIcon}>
        <MaterialCommunityIcons
          name={saved ? "tag-outline" : "shopping-outline"}
          size={20}
          color="#0f172a"
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.transStore}>{product}</Text>
        <View style={styles.transDetails}>
          <Text style={styles.transDate}>{store}</Text>
          <Text style={styles.transSeparator}>•</Text>
          <Text style={styles.transDate}>{date}</Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.transAmount}>{amount}</Text>
        {saved > 0 && (
          <Text style={styles.transSaved}>Saved ₱{saved}</Text>
        )}
      </View>
    </View>
  );

  // Local sub-component for Special Offer Card
  const OfferCard = ({ title, description, icon, color }) => (
    <TouchableOpacity 
      style={[styles.offerCard, { backgroundColor: color }]}
      activeOpacity={0.8}
    >
      <View style={styles.offerIconContainer}>
        <MaterialCommunityIcons name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.offerContent}>
        <Text style={styles.offerTitle}>{title}</Text>
        <Text style={styles.offerDesc}>{description}</Text>
      </View>
    </TouchableOpacity>
  );

  // Local sub-component for Stats Card
  const StatCard = ({ title, value, icon, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={20} color="#fff" />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* --- TOP NAVIGATION --- */}
      <View style={styles.navBar}>
        <View>
          <Text style={styles.greetingText}>Good Day,</Text>
          <Text style={styles.userNameText}>
            {userState.user?.name?.split(" ")[0] || "Welcome back"}
          </Text>
        </View>
        <View style={styles.navActions}>
          <TouchableOpacity style={styles.notifCircle}>
            <Ionicons name="notifications-outline" size={22} color="#0f172a" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.profileCircle}
            onPress={() => navigation.navigate("Profile", { user: userState.user })}
          >
            <Text style={styles.profileInitials}>
              {userState.user?.name ? 
                userState.user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) : 
                "U"
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- POINTS BALANCE (HERO) --- */}
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>Your Points Balance</Text>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
            <Text style={styles.pointsCurrency}>pts</Text>
          </View>
          <TouchableOpacity 
            style={styles.rewardPill}
            onPress={() => navigation.navigate("Rewards")}
          >
            <MaterialCommunityIcons name="gift-outline" size={16} color="#00A86B" />
            <Text style={styles.rewardText}>3 rewards available</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color="#00A86B"
            />
          </TouchableOpacity>
        </View>

        {/* --- ACTION GRID --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.gridContainer}>
          <ActionCard
            title="Scan Product"
            icon="barcode-scan"
            onPress={() => navigation.navigate("Scan")}
            isPrimary
          />
          <ActionCard
            title="My Cart"
            icon="basket-outline"
            onPress={() => navigation.navigate("Cart")}
          />
          <ActionCard
            title="BNPC Guide"
            icon="book-information-variant"
            onPress={() => navigation.navigate("BNPCGuide")}
          />
          <ActionCard
            title="My Orders"
            icon="clipboard-list-outline"
            onPress={() => navigation.navigate("Orders")}
          />
        </View>

        {/* --- SPECIAL OFFERS --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exclusive Offers</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Offers")}>
            <Text style={styles.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.offersScroll}
          contentContainerStyle={styles.offersContainer}
        >
          <OfferCard
            title="Senior/PWD Special"
            description="Get extra 5% off BNPC items"
            icon="account-heart-outline"
            color="#00A86B"
          />
          <OfferCard
            title="Scan & Earn"
            description="Double points on all scans today"
            icon="qrcode-scan"
            color="#0f172a"
          />
          <OfferCard
            title="Weekly Cap Tracker"
            description="Track your ₱125 discount limit"
            icon="chart-line"
            color="#3b82f6"
          />
        </ScrollView>

        {/* --- RECENT ACTIVITY SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <TouchableOpacity onPress={() => navigation.navigate("ScanHistory")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <TransactionItem
          product="Premium Rice 5kg"
          store="FreshMart"
          date="2 hours ago"
          amount="₱240.00"
          saved={12.00}
        />
        <TransactionItem
          product="Fresh Eggs (30 pcs)"
          store="SuperGrocer"
          date="Yesterday"
          amount="₱180.00"
          saved={9.00}
        />
        <TransactionItem
          product="Cooking Oil 1L"
          store="QuickMart"
          date="Dec 28, 2024"
          amount="₱120.00"
          saved={6.00}
        />

        {/* --- TIPS CARD --- */}
        <TouchableOpacity 
          style={styles.tipsCard}
          onPress={() => navigation.navigate("Tips")}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={24}
            color="#00A86B"
          />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.tipsTitle}>Maximize Your Savings</Text>
            <Text style={styles.tipsText}>
              Scan all eligible BNPC items to reach your ₱125 weekly discount cap
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </ScrollView>

      {/* --- FLOATING SCAN BUTTON --- */}
      <TouchableOpacity
        style={styles.floatingScan}
        onPress={() => navigation.getParent()?.navigate("Scan")}
        activeOpacity={0.9}
      >
        <MaterialCommunityIcons name="qrcode-scan" size={22} color="#fff" />
        <Text style={styles.floatingText}>Scan Product</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  greetingText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },
  userNameText: {
    fontSize: 18,
    color: "#0f172a",
    fontWeight: "800",
  },
  notifCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B6B",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 168, 107, 0.2)",
  },
  profileInitials: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  scrollContent: {
    paddingBottom: 140, // Space for floating button + Tab bar
  },

  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 35,
    alignItems: "center",
  },
  heroLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  pointsValue: {
    fontSize: 60,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -1,
  },
  pointsCurrency: {
    fontSize: 20,
    fontWeight: "700",
    color: "#00A86B",
    marginLeft: 6,
  },
  rewardPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 168, 107, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 18,
  },
  rewardText: {
    color: "#00A86B",
    fontSize: 13,
    fontWeight: "700",
    marginHorizontal: 6,
  },

  // Stats Cards
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  statTitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  primaryCard: {
    borderColor: "rgba(0, 168, 107, 0.15)",
    backgroundColor: "#ffffff",
  },
  cardIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  primaryIconBox: {
    backgroundColor: "rgba(0, 168, 107, 0.1)",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  primaryCardTitle: {
    color: "#0f172a",
  },

  // Offers Section
  offersScroll: {
    marginBottom: 10,
  },
  offersContainer: {
    paddingHorizontal: 24,
  },
  offerCard: {
    width: 280,
    borderRadius: 24,
    padding: 24,
    marginRight: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  offerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  offerDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 25,
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

  transRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  transIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  transStore: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  transDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  transDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  transSeparator: {
    fontSize: 12,
    color: "#cbd5e1",
    marginHorizontal: 6,
  },
  transAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  transSaved: {
    fontSize: 12,
    color: "#00A86B",
    fontWeight: "800",
    marginTop: 2,
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

  floatingScan: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 15,
    left: 24,
    right: 24,
    height: 64,
    backgroundColor: "#0f172a",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  floatingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 12,
  },
});

export default HomeScreen;