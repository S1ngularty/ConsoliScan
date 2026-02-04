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
  const TransactionItem = ({ store, date, amount, pts }) => (
    <View style={styles.transRow}>
      <View style={styles.transIcon}>
        <MaterialCommunityIcons
          name="store-outline"
          size={20}
          color="#0f172a"
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.transStore}>{store}</Text>
        <Text style={styles.transDate}>{date}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.transAmount}>{amount}</Text>
        <Text style={styles.transPoints}>+{pts} pts</Text>
      </View>
    </View>
  );

  // Local sub-component for Special Offer Card
  const OfferCard = ({ title, description, color }) => (
    <View style={[styles.offerCard, { backgroundColor: color }]}>
      <View style={styles.offerContent}>
        <Text style={styles.offerTitle}>{title}</Text>
        <Text style={styles.offerDesc}>{description}</Text>
      </View>
      <TouchableOpacity style={styles.offerButton}>
        <Text style={styles.offerButtonText}>Claim</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color="#fff" />
      </TouchableOpacity>
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
            {userState.user?.name || "Welcome back"}
          </Text>
        </View>
        <TouchableOpacity style={styles.notifCircle}>
          <Ionicons name="notifications-outline" size={22} color="#0f172a" />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- POINTS BALANCE (HERO) --- */}
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>Total Balance</Text>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
            <Text style={styles.pointsCurrency}>pts</Text>
          </View>
          <TouchableOpacity style={styles.rewardPill}>
            <MaterialCommunityIcons name="auto-fix" size={16} color="#00A86B" />
            <Text style={styles.rewardText}>2 rewards ready to redeem</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color="#00A86B"
            />
          </TouchableOpacity>
        </View>

        {/* --- ACTION GRID --- */}
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
            title="Nearby Stores"
            icon="map-marker-outline"
            onPress={() => navigation.navigate("Stores")}
          />
          <ActionCard
            title="Activity"
            icon="script-text-outline"
            onPress={() => navigation.navigate("Transactions")}
          />
        </View>

        {/* --- SPECIAL OFFERS --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Special Offers</Text>
          <TouchableOpacity>
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
            title="Double Points"
            description="Earn 2x points on all purchases today"
            color="#0f172a"
          />
          <OfferCard
            title="Weekend Special"
            description="20% off fresh vegetables"
            color="#00A86B"
          />
          <OfferCard
            title="Free Delivery"
            description="On orders above ₱500"
            color="#3b82f6"
          />
        </ScrollView>

        {/* --- RECENT ACTIVITY SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
            <Text style={styles.seeAll}>See history</Text>
          </TouchableOpacity>
        </View>

        <TransactionItem
          store="FreshMart"
          date="2 hours ago"
          amount="₱240.00"
          pts="24"
        />
        <TransactionItem
          store="SuperGrocer"
          date="Yesterday"
          amount="₱1,120.50"
          pts="112"
        />
        <TransactionItem
          store="QuickMart Express"
          date="Dec 28, 2024"
          amount="₱45.99"
          pts="45"
        />

        {/* --- TIPS CARD --- */}
        <View style={styles.tipsCard}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={24}
            color="#0f172a"
          />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.tipsTitle}>Secure & Fast Checkout</Text>
            <Text style={styles.tipsText}>
              Blockchain-verified transactions for maximum security
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* --- FLOATING SCAN BUTTON --- */}
      <TouchableOpacity
        style={styles.floatingScan}
        onPress={() => navigation.getParent()?.navigate("Scan")}
        activeOpacity={0.9}
      >
        <MaterialCommunityIcons name="qrcode-scan" size={22} color="#fff" />
        <Text style={styles.floatingText}>Start Shopping</Text>
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

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    justifyContent: "space-between",
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
    justifyContent: "space-between",
  },
  offerContent: {
    marginBottom: 20,
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  offerDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  offerButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  offerButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    marginRight: 4,
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
  transDate: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  transAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  transPoints: {
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
