import React, { useEffect, useState, useRef, useCallback } from "react";
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
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchHomeData } from "../../api/user.api";
import OfflineIndicator from "../../components/Common/OfflineIndicator";

// ─── Reusable animated counter hook ─────────────────────────────────────────
// Returns a display string that counts from 0 → target over `duration` ms
const useCountUp = (target, duration = 1200, decimals = 0, delay = 0) => {
  const [display, setDisplay] = useState("0");
  const animRef = useRef(new Animated.Value(0));

  useEffect(() => {
    if (target == null || isNaN(target)) return;
    animRef.current.setValue(0);

    const timer = setTimeout(() => {
      Animated.timing(animRef.current, {
        toValue: target,
        duration,
        ease: Easing.out(Easing.cubic),
        useNativeDriver: false, // JS driver required — we read .addListener
      }).start();

      const id = animRef.current.addListener(({ value }) => {
        setDisplay(value.toFixed(decimals));
      });

      return () => animRef.current.removeListener(id);
    }, delay);

    return () => clearTimeout(timer);
  }, [target]);

  return display;
};

// ─── Animated progress bar ───────────────────────────────────────────────────
// Grows from 0 → targetPct (0–100) after mount
const AnimatedProgressBar = ({ targetPct, color, height = 8, delay = 200 }) => {
  const widthAnim = useRef(new Animated.Value(0)).current; // JS driver

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(widthAnim, {
        toValue: Math.min(Math.max(targetPct, 0), 100),
        duration: 900,
        ease: Easing.out(Easing.quad),
        useNativeDriver: false, // width interpolation — must be JS
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [targetPct]);

  const widthStr = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.progressTrack, { height }]}>
      <Animated.View
        style={[
          styles.progressFill,
          { width: widthStr, backgroundColor: color, height },
        ]}
      />
    </View>
  );
};

// ─── Fade+slide mount helper ─────────────────────────────────────────────────
const useMountAnim = (delay = 0) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay,
      ease: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const style = {
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  };
  return style;
};

// ─── Animated card wrapper ───────────────────────────────────────────────────
const FadeSlideCard = ({ delay = 0, children, style }) => {
  const mountStyle = useMountAnim(delay);
  return <Animated.View style={[mountStyle, style]}>{children}</Animated.View>;
};

// ─── Action card with press spring ──────────────────────────────────────────
const ActionCard = ({ title, icon, onPress, isPrimary, badge, delay = 0 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 320,
      delay,
      ease: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();

  const mountStyle = {
    opacity: mountAnim,
    transform: [
      {
        translateY: mountAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      { scale },
    ],
  };

  return (
    <Animated.View
      style={[styles.card, isPrimary && styles.primaryCard, mountStyle]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        style={{ flex: 1 }}
      >
        <View style={[styles.cardIconBox, isPrimary && styles.primaryIconBox]}>
          <MaterialCommunityIcons
            name={icon}
            size={24}
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
    </Animated.View>
  );
};

// ─── Discount cap card with animated counter + bar ───────────────────────────
const DiscountCapCard = ({ homeData }) => {
  const discountUsed = homeData.eligibilityDiscountUsage?.discountUsed || 0;
  const purchasedUsed = homeData.eligibilityDiscountUsage?.purchasedUsed || 0;
  const weekEnd = homeData.eligibilityDiscountUsage?.weekEnd;
  const discountPct = (discountUsed / 125) * 100;
  const purchasePct = (purchasedUsed / 2500) * 100;

  const capColor =
    discountPct >= 100 ? "#DC2626" : discountPct >= 80 ? "#FF9800" : "#00A86B";
  const capLabel =
    discountPct >= 100
      ? "Cap Reached"
      : discountPct >= 80
        ? "Almost Full"
        : "Good Standing";

  // Count-up for both numbers
  const discountDisplay = useCountUp(discountUsed, 1000, 0, 200);
  const purchaseDisplay = useCountUp(purchasedUsed, 1000, 0, 300);
  const remainingDisplay = useCountUp(125 - discountUsed, 1000, 0, 400);

  return (
    <FadeSlideCard delay={180} style={styles.discountCapCard}>
      {/* Header */}
      <View style={styles.capHeader}>
        <View
          style={[styles.capIconWrap, { backgroundColor: `${capColor}15` }]}
        >
          <MaterialCommunityIcons
            name="shield-check"
            size={18}
            color={capColor}
          />
        </View>
        <View style={styles.capTitleContainer}>
          <Text style={styles.capTitle}>Weekly Discount Cap</Text>
          <Text style={styles.capSubtitle}>
            {weekEnd
              ? `Resets ${new Date(weekEnd).toLocaleDateString()}`
              : "Resets every Monday"}
          </Text>
        </View>
        {/* Animated counter badge */}
        <View style={styles.capAmountWrap}>
          <Text style={[styles.capAmountValue, { color: capColor }]}>
            ₱{discountDisplay}
          </Text>
          <Text style={styles.capAmountMax}>/125</Text>
        </View>
      </View>

      {/* Discount progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Discount Used</Text>
          <Text style={[styles.progressPct, { color: capColor }]}>
            {discountPct.toFixed(0)}%
          </Text>
        </View>
        <AnimatedProgressBar
          targetPct={discountPct}
          color={capColor}
          delay={250}
        />
      </View>

      {/* Purchase progress */}
      <View style={[styles.progressSection, { marginTop: 12 }]}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Purchase Used</Text>
          <Text style={styles.progressPct}>₱{purchaseDisplay} / ₱2500</Text>
        </View>
        <AnimatedProgressBar
          targetPct={purchasePct}
          color="#64748b"
          height={5}
          delay={350}
        />
      </View>

      {/* Footer row */}
      <View style={styles.capFooter}>
        <View
          style={[styles.capStatusChip, { backgroundColor: `${capColor}12` }]}
        >
          <View style={[styles.capStatusDot, { backgroundColor: capColor }]} />
          <Text style={[styles.capStatusText, { color: capColor }]}>
            {capLabel}
          </Text>
        </View>
        <Text style={styles.capRemaining}>₱{remainingDisplay} remaining</Text>
      </View>
    </FadeSlideCard>
  );
};

// ─── Hero points display with count-up ──────────────────────────────────────
const HeroPoints = ({ points, navigation }) => {
  const displayPts = useCountUp(points, 1400, 2, 100);

  // Pulse ring animation (native scale)
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 1600,
          ease: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,

          ease: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <FadeSlideCard delay={0} style={styles.heroSection}>
      <Text style={styles.heroLabel}>Points Balance</Text>

      <Animated.View
        style={[styles.heroPointsRing, { transform: [{ scale: pulse }] }]}
      >
        <View style={styles.heroPointsInner}>
          <Text style={styles.pointsValue}>{displayPts}</Text>
          <Text style={styles.pointsCurrency}>pts</Text>
        </View>
      </Animated.View>

      {points === 0 ? (
        <TouchableOpacity
          style={styles.earnPointsPill}
          onPress={() => navigation.navigate("Rewards")}
        >
          <MaterialCommunityIcons
            name="star-outline"
            size={15}
            color="#FF9800"
          />
          <Text style={styles.earnPointsText}>Start earning points</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={15}
            color="#FF9800"
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.rewardPill}
          onPress={() => navigation.navigate("Rewards")}
        >
          <MaterialCommunityIcons
            name="gift-outline"
            size={15}
            color="#00A86B"
          />
          <Text style={styles.rewardText}>Learn How to use points</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={15}
            color="#00A86B"
          />
        </TouchableOpacity>
      )}
    </FadeSlideCard>
  );
};

// ─── Transaction item ────────────────────────────────────────────────────────
const TransactionItem = ({ product, price, date, isEligible, delay = 0 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const mountStyle = useMountAnim(delay);

  return (
    <Animated.View
      style={[mountStyle, { marginHorizontal: 24, marginBottom: 12 }]}
    >
      <TouchableOpacity
        style={styles.transRow}
        activeOpacity={0.85}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 50,
            bounciness: 0,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 5,
          }).start()
        }
      >
        <View style={[styles.transIcon, isEligible && styles.eligibleIcon]}>
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
          {isEligible && <Text style={styles.eligibleBadge}>Eligible</Text>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Offer card ──────────────────────────────────────────────────────────────
const OfferCard = ({ title, description, icon, color, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.offerCard, { backgroundColor: color }]}
        activeOpacity={1}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 50,
            bounciness: 0,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 5,
          }).start()
        }
        onPress={onPress}
      >
        <View style={styles.offerIconContainer}>
          <MaterialCommunityIcons name={icon} size={22} color="#fff" />
        </View>
        <View style={styles.offerContent}>
          <Text style={styles.offerTitle}>{title}</Text>
          <Text style={styles.offerDesc}>{description}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Eligibility prompt ──────────────────────────────────────────────────────
const EligibilityPrompt = ({ navigation }) => (
  <FadeSlideCard delay={220} style={styles.eligibilityCard}>
    <View style={styles.eligibilityIconContainer}>
      <MaterialCommunityIcons
        name="badge-account-alert"
        size={30}
        color="#FF9800"
      />
    </View>
    <Text style={styles.eligibilityTitle}>Are you a PWD/Senior Citizen?</Text>
    <Text style={styles.eligibilityTitle}>Verify Your Eligibility!</Text>
    <Text style={styles.eligibilityText}>
      Get access to PWD/Senior discounts by verifying your eligibility status
    </Text>
    <TouchableOpacity
      style={styles.eligibilityButton}
      onPress={() => navigation.navigate("EligibilityIntro")}
    >
      <Text style={styles.eligibilityButtonText}>Verify Now</Text>
      <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
    </TouchableOpacity>
  </FadeSlideCard>
);

// ─── Quick tips ──────────────────────────────────────────────────────────────
const QuickTips = () => (
  <FadeSlideCard delay={260} style={styles.quickTipsCard}>
    <View style={styles.quickTipsHeader}>
      <MaterialCommunityIcons name="lightbulb-on" size={18} color="#FF9800" />
      <Text style={styles.quickTipsTitle}>How to Use Our App</Text>
    </View>
    <View style={styles.tipsContainer}>
      {[
        "Scan product barcodes to check prices and eligibility",
        "Apply for PWD/Senior discounts in your profile",
        "Track your weekly ₱125 discount cap progress",
        "View scanned items history and save favorites",
      ].map((tip, i) => (
        <View key={i} style={styles.tipItem}>
          <View style={styles.tipNumber}>
            <Text style={styles.tipNumberText}>{i + 1}</Text>
          </View>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  </FadeSlideCard>
);

// ─── Empty states ────────────────────────────────────────────────────────────
const EmptyRecentScans = ({ navigation }) => (
  <FadeSlideCard delay={200} style={styles.emptyScansCard}>
    <MaterialCommunityIcons name="barcode-off" size={48} color="#cbd5e1" />
    <Text style={styles.emptyScansTitle}>No Recent Scans</Text>
    <Text style={styles.emptyScansText}>
      Start scanning products to build your history
    </Text>
    <TouchableOpacity
      style={styles.emptyScanButton}
      onPress={() => navigation.navigate("Shared", { screen: "Scan" })}
    >
      <MaterialCommunityIcons name="qrcode-scan" size={16} color="#fff" />
      <Text style={styles.emptyScanButtonText}>Scan Your First Product</Text>
    </TouchableOpacity>
  </FadeSlideCard>
);

const EmptyCartPrompt = ({ navigation }) => (
  <FadeSlideCard delay={140} style={{ marginHorizontal: 24, marginBottom: 16 }}>
    <TouchableOpacity
      style={styles.emptyCartCard}
      onPress={() => navigation.navigate("Shared", { screen: "Scan" })}
    >
      <MaterialCommunityIcons name="cart-outline" size={28} color="#94a3b8" />
      <View style={styles.emptyCartContent}>
        <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
        <Text style={styles.emptyCartText}>
          Start scanning products to add items
        </Text>
      </View>
      <MaterialCommunityIcons name="arrow-right" size={18} color="#00A86B" />
    </TouchableOpacity>
  </FadeSlideCard>
);

// ─── Main screen ─────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [homeData, setHomeData] = useState({
    cartItemCount: 0,
    eligibilityDiscountUsage: {
      discountUsed: 0,
      purchasedUsed: 0,
      weekEnd: "",
      weekStart: "",
    },
    is_eligibility_verified: false,
    loyaltyPoints: 0,
    orderCount: 0,
  });

  const userState = useSelector((state) => state.auth);
  const networkState = useSelector((state) => state.network);
  const dispatch = useDispatch();

  // Local state to trigger re-renders when network state changes
  const [isOffline, setIsOffline] = useState(false);
  const [isServerDown, setIsServerDown] = useState(false);

  // Sync with Redux network state
  useEffect(() => {
    setIsOffline(networkState.isOffline);
    setIsServerDown(networkState.isServerDown);
  }, [networkState.isOffline, networkState.isServerDown]);

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    try {
      if (userState.isLoggedIn) {
        // await dispatch(getCartFromServer());
        const response = await fetchHomeData();
        setHomeData(response);

        const scanHistory = await AsyncStorage.getItem("scanHistory");
        if (scanHistory) setRecentScans(JSON.parse(scanHistory).slice(0, 3));
      }
    } catch (e) {
      console.error("Error loading home data:", e);
    } finally {
      setLoading(false);
    }
  }, [userState.isLoggedIn]);

  useEffect(() => {
    loadHomeData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  // Show offline indicator during initial load
  console.log(
    "Render HomeScreen - loading:",
    loading,
    "isOffline:",
    isOffline,
    "isServerDown:",
    isServerDown,
  );
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        {isOffline || isServerDown ? (
          <OfflineIndicator message="Cannot load dashboard" />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00A86B" />
            <Text style={styles.loadingText}>Loading your dashboard…</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Show offline indicator if server is down (even after loading failed)
  if ((isOffline || isServerDown) && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <OfflineIndicator message="Cannot load dashboard" />
      </SafeAreaView>
    );
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Nav bar */}
      <View style={styles.navBar}>
        <View>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.userNameText}>
            {userState.user?.name?.split(" ")[0] || "Welcome back"}
          </Text>
        </View>
        <View style={styles.navActions}>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons name="notifications-outline" size={20} color="#0f172a" />
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
        {/* ── Points hero with count-up ── */}
        <HeroPoints
          points={homeData.loyaltyPoints || 0}
          navigation={navigation}
        />

        {/* ── Quick actions (staggered mount) ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.gridContainer}>
          {[
            {
              title: "My Cart",
              icon: "basket-outline",
              onPress: () =>
                navigation.navigate("HomeTabs", { screen: "Cart" }),
              badge:
                homeData.cartItemCount > 0
                  ? homeData.cartItemCount.toString()
                  : null,
            },
            {
              title: "Eligibility",
              icon: "badge-account",
              onPress: () => navigation.navigate("EligibilityStatus"),
              badge: !homeData.is_eligibility_verified ? "!" : null,
            },
            {
              title: "Order History",
              icon: "clipboard-list-outline",
              onPress: () =>
                navigation.navigate("HomeTabs", {
                  screen: "History",
                }),
              badge:
                homeData.orderCount > 0 ? homeData.orderCount.toString() : null,
            },
            {
              title: "Saved Items",
              icon: "heart-outline",
              onPress: () => navigation.navigate("Saved"),
            },
            {
              title: "BNPC Guide",
              icon: "book-information-variant",
              onPress: () => navigation.navigate("BNPCGuide"),
            },
          ].map((item, i) => (
            <ActionCard key={item.title} {...item} delay={80 + i * 55} />
          ))}
        </View>

        {homeData.cartItemCount === 0 && (
          <EmptyCartPrompt navigation={navigation} />
        )}

        {/* ── Discount cap with animated progress + count-up ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Discount Cap</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Details</Text>
          </TouchableOpacity>
        </View>
        <DiscountCapCard homeData={homeData} />

        {/* ── Eligibility prompt ── */}
        {!homeData.is_eligibility_verified && (
          <EligibilityPrompt navigation={navigation} />
        )}

        {/* ── Quick tips ── */}
        <QuickTips />

        {/* ── Exclusive offers ── */}
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
            onPress={() => navigation.navigate("EligibilityIntro")}
          />
          <OfferCard
            title="Scan & Save"
            description="Track all your grocery scans"
            icon="qrcode-scan"
            color="#0f172a"
            onPress={() => navigation.navigate("Shared", { screen: "Scan" })}
          />
          <OfferCard
            title="Weekly Cap Alert"
            description="Never miss your discount limit"
            icon="bell-outline"
            color="#3b82f6"
            onPress={() => navigation.navigate("Notifications")}
          />
        </ScrollView>

        {/* ── Recent scans ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <TouchableOpacity onPress={() => navigation.navigate("ScanHistory")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentScans.length > 0 ? (
          recentScans.map((scan, i) => (
            <TransactionItem
              key={i}
              delay={i * 70}
              product={scan.name || "Scanned Product"}
              price={scan.price || "0.00"}
              date={
                scan.scannedAt
                  ? new Date(scan.scannedAt).toLocaleDateString()
                  : "Recent"
              }
              isEligible={scan.isEligible || false}
            />
          ))
        ) : (
          <EmptyRecentScans navigation={navigation} />
        )}

        {/* ── Help card ── */}
        <FadeSlideCard delay={300} style={styles.tipsCard}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
            onPress={() => navigation.navigate("Shared", { screen: "Help" })}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="help-circle-outline"
              size={22}
              color="#00A86B"
            />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.tipsTitle}>Need Help?</Text>
              <Text style={styles.tipsText}>
                Visit our Help & Support section for guides and FAQs
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color="#94a3b8"
            />
          </TouchableOpacity>
        </FadeSlideCard>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContent: { paddingBottom: 80 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748b" },

  // Nav
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  navActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  greetingText: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },
  userNameText: { fontSize: 20, color: "#0f172a", fontWeight: "800" },
  navIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  notifDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#DC2626",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: { fontSize: 14, fontWeight: "800", color: "#fff" },

  // Hero
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 28,
    alignItems: "center",
  },
  heroLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 20,
  },
  heroPointsRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "rgba(0,168,107,0.15)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#00A86B",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  heroPointsInner: { alignItems: "center" },
  pointsValue: {
    fontSize: 52,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -2,
  },
  pointsCurrency: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00A86B",
    marginTop: -4,
  },
  rewardPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,168,107,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
    gap: 6,
  },
  earnPointsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,152,0,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
    gap: 6,
  },
  rewardText: { color: "#00A86B", fontSize: 13, fontWeight: "700" },
  earnPointsText: { color: "#FF9800", fontSize: 13, fontWeight: "700" },

  // Grid
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
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  primaryCard: { borderColor: "rgba(0,168,107,0.2)" },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
  },
  primaryIconBox: { backgroundColor: "rgba(0,168,107,0.1)" },
  cardBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#00A86B",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 18,
    alignItems: "center",
  },
  cardBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },
  cardTitle: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  primaryCardTitle: { color: "#0f172a" },

  // Discount cap card
  discountCapCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  capHeader: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  capIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  capTitleContainer: { flex: 1, marginLeft: 12 },
  capTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  capSubtitle: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  capAmountWrap: { alignItems: "flex-end" },
  capAmountValue: { fontSize: 20, fontWeight: "900" },
  capAmountMax: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },

  progressSection: { gap: 8 },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  progressPct: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  progressTrack: {
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: { borderRadius: 6 },

  capFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  capStatusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  capStatusDot: { width: 6, height: 6, borderRadius: 3 },
  capStatusText: { fontSize: 12, fontWeight: "700" },
  capRemaining: { fontSize: 12, color: "#64748b", fontWeight: "600" },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 14,
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  seeAll: { color: "#00A86B", fontWeight: "700", fontSize: 13 },

  // Eligibility card
  eligibilityCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFE0B2",
    alignItems: "center",
  },
  eligibilityIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(255,152,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  eligibilityTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  eligibilityText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 20,
  },
  eligibilityButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF9800",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  eligibilityButtonText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  // Quick tips
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
    marginBottom: 18,
  },
  quickTipsTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginLeft: 10,
  },
  tipsContainer: { gap: 14 },
  tipItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  tipNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,168,107,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  tipNumberText: { fontSize: 11, fontWeight: "800", color: "#00A86B" },
  tipText: { flex: 1, fontSize: 14, color: "#64748b", lineHeight: 20 },

  // Empty states
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
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 14,
    marginBottom: 6,
  },
  emptyScansText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 22,
    lineHeight: 20,
  },
  emptyScanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A86B",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyScanButtonText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  emptyCartCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderStyle: "dashed",
  },
  emptyCartContent: { flex: 1, marginLeft: 12 },
  emptyCartTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  emptyCartText: { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  // Offers
  offersScroll: { marginBottom: 10 },
  offersContainer: { paddingHorizontal: 24 },
  offerCard: {
    width: 260,
    borderRadius: 24,
    padding: 22,
    marginRight: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  offerIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  offerContent: { flex: 1 },
  offerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  offerDesc: { fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 18 },

  // Recent scans
  transRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
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
  eligibleIcon: { backgroundColor: "rgba(0,168,107,0.1)" },
  transProduct: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  transDate: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  transPrice: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  eligibleBadge: {
    fontSize: 10,
    color: "#00A86B",
    fontWeight: "800",
    marginTop: 4,
    backgroundColor: "rgba(0,168,107,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },

  // Help card
  tipsCard: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: "#fff",
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
  tipsText: { fontSize: 12, color: "#64748b" },
});

export default HomeScreen;
