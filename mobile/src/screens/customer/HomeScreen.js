import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCartFromServer } from "../../features/slices/cart/cartThunks";

const HomeScreen = ({ navigation }) => {
  const [points, setPoints] = useState(1250);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [weeklyCap, setWeeklyCap] = useState({
    used: 65,
    total: 125,
  });
  
  const userState = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      if (userState.isLoggedIn) {
        dispatch(getCartFromServer());
        
        // Load scan history
        const scanHistory = await AsyncStorage.getItem("scanHistory");
        if (scanHistory) {
          const parsedHistory = JSON.parse(scanHistory);
          // Get last 3 scans
          setRecentScans(parsedHistory.slice(0, 3));
        }
        
        // Mock API call for points and cap
        setTimeout(() => {
          setPoints(1420);
          setWeeklyCap({
            used: 78,
            total: 125,
          });
          setLoading(false);
        }, 800);
      }
    } catch (error) {
      console.error("Error loading home data:", error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const calculateCapPercentage = () => {
    return (weeklyCap.used / weeklyCap.total) * 100;
  };

  const getCapColor = () => {
    const percentage = calculateCapPercentage();
    if (percentage < 50) return "#00A86B";
    if (percentage < 80) return "#FF9800";
    return "#F44336";
  };

  // Local sub-component for Action Cards
  const ActionCard = ({ title, icon, onPress, isPrimary, badge }) => (
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
        {badge && (
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.cardTitle, isPrimary && styles.primaryCardTitle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Local sub-component for Recent Scan Items
  const TransactionItem = ({ product, price, date, isEligible }) => (
    <TouchableOpacity style={styles.transRow} activeOpacity={0.8}>
      <View style={[
        styles.transIcon,
        isEligible && styles.eligibleIcon
      ]}>
        <MaterialCommunityIcons
          name="barcode-scan"
          size={20}
          color={isEligible ? "#00A86B" : "#0f172a"}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.transProduct}>{product}</Text>
        <Text style={styles.transDate}>{date}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.transPrice}>₱{price}</Text>
        {isEligible && (
          <Text style={styles.eligibleBadge}>Eligible</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Local sub-component for Special Offer Card
  const OfferCard = ({ title, description, icon, color, onPress }) => (
    <TouchableOpacity
      style={[styles.offerCard, { backgroundColor: color }]}
      activeOpacity={0.8}
      onPress={onPress}
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

  // New Component: Discount Cap Progress
  const DiscountCapProgress = () => (
    <View style={styles.discountCapCard}>
      <View style={styles.capHeader}>
        <MaterialCommunityIcons name="shield-check" size={20} color="#0f172a" />
        <View style={styles.capTitleContainer}>
          <Text style={styles.capTitle}>Weekly Discount Cap</Text>
          <Text style={styles.capSubtitle}>Resets every Monday</Text>
        </View>
        <Text style={styles.capAmount}>
          ₱{weeklyCap.used}/{weeklyCap.total}
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${calculateCapPercentage()}%`,
                backgroundColor: getCapColor()
              }
            ]} 
          />
        </View>
        <View style={styles.capInfo}>
          <Text style={[
            styles.capStatus,
            { color: getCapColor() }
          ]}>
            {calculateCapPercentage() >= 100 ? 'Cap Reached' : 
             calculateCapPercentage() >= 80 ? 'Almost Full' : 'Good Progress'}
          </Text>
          <Text style={styles.capRemaining}>
            ₱{weeklyCap.total - weeklyCap.used} remaining
          </Text>
        </View>
      </View>
    </View>
  );

  // New Component: Quick Tips
  const QuickTips = () => (
    <View style={styles.quickTipsCard}>
      <View style={styles.quickTipsHeader}>
        <MaterialCommunityIcons name="lightbulb-on" size={20} color="#FF9800" />
        <Text style={styles.quickTipsTitle}>How to Use Our App</Text>
      </View>
      
      <View style={styles.tipsContainer}>
        <View style={styles.tipItem}>
          <View style={styles.tipNumber}>
            <Text style={styles.tipNumberText}>1</Text>
          </View>
          <Text style={styles.tipText}>
            Scan product barcodes to check prices and eligibility
          </Text>
        </View>
        
        <View style={styles.tipItem}>
          <View style={styles.tipNumber}>
            <Text style={styles.tipNumberText}>2</Text>
          </View>
          <Text style={styles.tipText}>
            Apply for PWD/Senior discounts in your profile
          </Text>
        </View>
        
        <View style={styles.tipItem}>
          <View style={styles.tipNumber}>
            <Text style={styles.tipNumberText}>3</Text>
          </View>
          <Text style={styles.tipText}>
            Track your weekly ₱125 discount cap progress
          </Text>
        </View>
        
        <View style={styles.tipItem}>
          <View style={styles.tipNumber}>
            <Text style={styles.tipNumberText}>4</Text>
          </View>
          <Text style={styles.tipText}>
            View scanned items history and save favorites
          </Text>
        </View>
      </View>
    </View>
  );

  // New Component: Empty State for Recent Scans
  const EmptyRecentScans = () => (
    <View style={styles.emptyScansCard}>
      <MaterialCommunityIcons name="barcode-off" size={48} color="#cbd5e1" />
      <Text style={styles.emptyScansTitle}>No Recent Scans</Text>
      <Text style={styles.emptyScansText}>
        Start scanning products to build your history
      </Text>
      <TouchableOpacity 
        style={styles.emptyScanButton}
        onPress={() => navigation.navigate("Scan")}
      >
        <MaterialCommunityIcons name="qrcode-scan" size={18} color="#fff" />
        <Text style={styles.emptyScanButtonText}>Scan Your First Product</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* --- TOP NAVIGATION --- */}
      <View style={styles.navBar}>
        <View>
          <Text style={styles.greetingText}>
            {new Date().getHours() < 12 ? 'Good Morning' : 
             new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'},
          </Text>
          <Text style={styles.userNameText}>
            {userState.user?.name?.split(" ")[0] || "Welcome back"}
          </Text>
        </View>
        <View style={styles.navActions}>
          <TouchableOpacity 
            style={styles.notifCircle}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color="#0f172a" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileCircle}
            onPress={() =>
              navigation.navigate("Profile", { user: userState.user })
            }
          >
            <Text style={styles.profileInitials}>
              {userState.user?.name
                ? userState.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)
                : "U"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={["#00A86B"]}
            tintColor="#00A86B"
          />
        }
      >
        {/* --- POINTS BALANCE --- */}
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
            <MaterialCommunityIcons
              name="gift-outline"
              size={16}
              color="#00A86B"
            />
            <Text style={styles.rewardText}>Redeem points for rewards</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color="#00A86B"
            />
          </TouchableOpacity>
        </View>

        {/* --- QUICK ACTIONS --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.gridContainer}>
          <ActionCard
            title="Scan Product"
            icon="barcode-scan"
            onPress={() => navigation.navigate("Scan")}
            isPrimary
            badge="New"
          />
          <ActionCard
            title="My Cart"
            icon="basket-outline"
            onPress={() => navigation.navigate("Cart")}
            badge="3"
          />
          <ActionCard
            title="Eligibility"
            icon="badge-account"
            onPress={() => navigation.navigate("Eligibility")}
          />
          <ActionCard
            title="Order History"
            icon="clipboard-list-outline"
            onPress={() => navigation.navigate("Orders")}
            badge="2"
          />
          <ActionCard
            title="Saved Items"
            icon="heart-outline"
            onPress={() => navigation.navigate("Saved")}
          />
          <ActionCard
            title="BNPC Guide"
            icon="book-information-variant"
            onPress={() => navigation.navigate("BNPCGuide")}
          />
        </View>

        {/* --- DISCOUNT CAP PROGRESS --- */}
        <DiscountCapProgress />

        {/* --- QUICK TIPS --- */}
        <QuickTips />

        {/* --- EXCLUSIVE OFFERS --- */}
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
            onPress={() => navigation.navigate("Eligibility")}
          />
          <OfferCard
            title="Scan & Save"
            description="Track all your grocery scans"
            icon="qrcode-scan"
            color="#0f172a"
            onPress={() => navigation.navigate("Scan")}
          />
          <OfferCard
            title="Weekly Cap Alert"
            description="Never miss your discount limit"
            icon="bell-outline"
            color="#3b82f6"
            onPress={() => navigation.navigate("Notifications")}
          />
        </ScrollView>

        {/* --- RECENT SCANS --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <TouchableOpacity onPress={() => navigation.navigate("ScanHistory")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentScans.length > 0 ? (
          recentScans.map((scan, index) => (
            <TransactionItem
              key={index}
              product={scan.name || "Scanned Product"}
              price={scan.price || "0.00"}
              date={scan.scannedAt ? new Date(scan.scannedAt).toLocaleDateString() : "Recent"}
              isEligible={scan.isEligible || false}
            />
          ))
        ) : (
          <EmptyRecentScans />
        )}

        {/* --- TIPS CARD --- */}
        <TouchableOpacity
          style={styles.tipsCard}
          onPress={() => navigation.navigate("Help")}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="help-circle-outline"
            size={24}
            color="#00A86B"
          />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.tipsTitle}>Need Help?</Text>
            <Text style={styles.tipsText}>
              Visit our Help & Support section for guides and FAQs
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#94a3b8"
          />
        </TouchableOpacity>
      </ScrollView>

      {/* --- FLOATING SCAN BUTTON --- */}
      <TouchableOpacity
        style={styles.floatingScan}
        onPress={() => navigation.navigate("Scan")}
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
    paddingBottom: 140,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
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

  // Discount Cap Card
  discountCapCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  capHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  capTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  capTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  capSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  capAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  capInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  capStatus: {
    fontSize: 12,
    fontWeight: "700",
  },
  capRemaining: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },

  // Quick Tips Card
  quickTipsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  quickTipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  quickTipsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginLeft: 12,
  },
  tipsContainer: {
    gap: 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  tipNumberText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#00A86B",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },

  // Empty Scans State
  emptyScansCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  emptyScansTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyScansText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyScanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A86B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyScanButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  // Grid Container & Action Cards
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    width: "31%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
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
    marginBottom: 12,
    position: "relative",
  },
  primaryIconBox: {
    backgroundColor: "rgba(0, 168, 107, 0.1)",
  },
  cardBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#00A86B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    textAlign: "center",
  },
  primaryCardTitle: {
    color: "#0f172a",
  },

  // Section Header
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

  // Recent Scans
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
  eligibleIcon: {
    backgroundColor: "rgba(0, 168, 107, 0.1)",
  },
  transProduct: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  transDate: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  transPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  eligibleBadge: {
    fontSize: 10,
    color: "#00A86B",
    fontWeight: "800",
    marginTop: 4,
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Tips Card
  tipsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 30,
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

  // Floating Button
  floatingScan: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 80,
    left: 24,
    right: 24,
    height: 56,
    backgroundColor: "#0f172a",
    borderRadius: 16,
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