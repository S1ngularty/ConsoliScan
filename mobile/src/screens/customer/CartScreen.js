import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  adjustQuantity,
  removeFromCart,
  clearCart,
  setCart,
} from "../../features/slices/cart/cartSlice";
import {
  clearCartToServer,
  getCartFromServer,
  saveLocally,
} from "../../features/slices/cart/cartThunks";
import { debounceCartSync } from "../../features/slices/cart/cartDebounce";
import { checkout } from "../../api/checkout.api";
import { getToken } from "../../utils/authUtil";
import { applyPromo, applyGuestPromo } from "../../api/promo.api";
import { fetchHomeData } from "../../api/user.api";
import { getConfig } from "../../api/loyalty.api";

const BNPC_PURCHASE_CAP = 2500;
const BNPC_DISCOUNT_CAP = 125;

const CartScreen = ({ navigation, route }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState("");
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [weeklyUsage, setWeeklyUsage] = useState({
    bnpcAmountUsed: 0,
    discountUsed: 0,
    weekStart: "",
    weekEnd: "",
  });
  const eligibilityStatus = useSelector((state) => state.auth.eligible);
  const userState = useSelector((state) => state.auth);
  const [userEligibility, setUserEligibility] = useState({
    isPWD: false,
    isSenior: false,
  });
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [appliedPromoData, setAppliedPromoData] = useState(null);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [loyaltyConfig, setLoyaltyConfig] = useState({
    pointsToCurrencyRate: 1,
    maxRedeemPercent: 30,
    earnRate: 0.1,
    enabled: true,
  });
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);

  const dispatch = useDispatch();
  const { cart, itemCount, promo } = useSelector((state) => state.cart);
  const { isOffline, isServerDown } = useSelector((state) => state.network);
  const isEligibleUser = eligibilityStatus?.isVerified;

  useEffect(() => {
    (async () => {
      userState.role === "user" && dispatch(getCartFromServer());
      userState.role === "user" && (await fetchLoyaltyPointsData());
    })();
  }, [userState.role]);

  useEffect(() => {
    if (eligibilityStatus?.idType === "senior")
      setUserEligibility((p) => ({ ...p, isSenior: true }));
    if (eligibilityStatus?.idType === "pwd")
      setUserEligibility((p) => ({ ...p, isPWD: true }));
  }, [eligibilityStatus]);

  useEffect(() => {
    if (appliedPoints > 0) validateAndSetPoints(appliedPoints);
  }, [cart]);

  // Force cart refresh whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 [CART SCREEN] Screen focused - refreshing cart");
      if (userState.role === "user") {
        dispatch(getCartFromServer());
      }
    }, [userState.role, dispatch]),
  );

  async function fetchLoyaltyPointsData() {
    try {
      const [homeData, config] = await Promise.all([
        fetchHomeData(),
        getConfig(),
      ]);
      setAvailablePoints(homeData.loyaltyPoints);
      if (homeData.eligibilityDiscountUsage) {
        setWeeklyUsage({
          bnpcAmountUsed: homeData.eligibilityDiscountUsage.purchasedUsed || 0,
          discountUsed: homeData.eligibilityDiscountUsage.discountUsed || 0,
          weekStart: homeData.eligibilityDiscountUsage.weekStart,
          weekEnd: homeData.eligibilityDiscountUsage.weekEnd,
        });
      }
      setLoyaltyConfig(config);
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    }
  }

  const normalizeCartItem = (item) => {
    const product = item.product || item;
    const quantity = item.selectedQuantity || item.qty || 1;
    const category = product.category || {};
    return {
      _id: item._id || product._id,
      name: item.name || product.name,
      price: Number(item.price || product.price || 0),
      salePrice: product.salePrice,
      saleActive: product.saleActive,
      images: item.images || product.images || [],
      selectedQuantity: Number(quantity),
      qty: Number(quantity),
      dateAdded: item.dateAdded || new Date().toISOString(),
      product: {
        _id: product._id,
        name: product.name,
        price: Number(product.price || 0),
        salePrice: product.salePrice,
        saleActive: product.saleActive,
        isBNPC: category.isBNPC || false,
        excludedFromDiscount: product.excludedFromDiscount || false,
        unit: product.unit || "pc",
        images: product.images || [],
        category: category,
      },
    };
  };

  const calculateCartTotals = () => {
    if (!cart || cart.length === 0) return { subtotal: 0, itemCount: 0 };
    let subtotal = 0,
      totalItems = 0;
    cart.forEach((item) => {
      const n = normalizeCartItem(item);
      const price =
        n.saleActive && n.salePrice
          ? Number(n.salePrice)
          : Number(n.price) || 0;
      const qty = Number(n.selectedQuantity) || 1;
      if (!isNaN(price) && !isNaN(qty)) {
        subtotal += price * qty;
        totalItems += qty;
      }
    });
    return { subtotal: parseFloat(subtotal.toFixed(2)), itemCount: totalItems };
  };

  const getUserDiscountScope = () => {
    if (userEligibility.isPWD) return "PWD";
    if (userEligibility.isSenior) return "SENIOR";
    return null;
  };

  const getEligibleBNPCItems = () => {
    if (!isEligibleUser) return [];
    const scope = getUserDiscountScope();
    if (!scope) return [];
    return cart.filter((item) => {
      const n = normalizeCartItem(item);
      return (
        n.product.isBNPC &&
        !n.product.excludedFromDiscount &&
        ["PWD", "SENIOR"].includes(scope)
      );
    });
  };

  const calculateBNPCEligibleSubtotal = () =>
    getEligibleBNPCItems().reduce((sum, item) => {
      const n = normalizeCartItem(item);
      const price =
        n.saleActive && n.salePrice
          ? Number(n.salePrice)
          : Number(n.price) || 0;
      return sum + price * (Number(n.selectedQuantity) || 1);
    }, 0);

  const calculateDiscountDetails = () => {
    const eligibleItems = getEligibleBNPCItems();
    const eligibleBNPCSubtotal = calculateBNPCEligibleSubtotal();

    if (!isEligibleUser)
      return {
        eligible: false,
        discountApplied: 0,
        bnpcEligibleSubtotal: 0,
        cappedBNPCAmount: 0,
        eligibleItemsCount: 0,
        reason: "User not eligible for BNPC discounts",
      };
    if (!eligibleItems.length)
      return {
        eligible: false,
        discountApplied: 0,
        bnpcEligibleSubtotal: 0,
        cappedBNPCAmount: 0,
        eligibleItemsCount: 0,
        reason: "No eligible BNPC items in cart",
      };

    const remainingPurchaseCap = Math.max(
      BNPC_PURCHASE_CAP - weeklyUsage.bnpcAmountUsed,
      0,
    );
    if (!remainingPurchaseCap)
      return {
        eligible: false,
        discountApplied: 0,
        bnpcEligibleSubtotal: eligibleBNPCSubtotal,
        cappedBNPCAmount: 0,
        eligibleItemsCount: eligibleItems.length,
        reason: `Weekly purchase cap reached (₱${BNPC_PURCHASE_CAP.toLocaleString()})`,
      };

    const cappedBNPCAmount = Math.min(
      eligibleBNPCSubtotal,
      remainingPurchaseCap,
    );
    const rawDiscount = cappedBNPCAmount * 0.05;
    const remainingDiscountCap = Math.max(
      BNPC_DISCOUNT_CAP - weeklyUsage.discountUsed,
      0,
    );
    if (!remainingDiscountCap)
      return {
        eligible: false,
        discountApplied: 0,
        bnpcEligibleSubtotal: eligibleBNPCSubtotal,
        cappedBNPCAmount,
        eligibleItemsCount: eligibleItems.length,
        reason: `Weekly discount cap reached (₱${BNPC_DISCOUNT_CAP})`,
      };

    const discountApplied = Math.min(rawDiscount, remainingDiscountCap);
    return {
      eligible: true,
      discountApplied,
      bnpcEligibleSubtotal: eligibleBNPCSubtotal,
      cappedBNPCAmount,
      eligibleItemsCount: eligibleItems.length,
      remainingPurchaseCap,
      remainingDiscountCap,
      weeklyPurchaseUsed: weeklyUsage.bnpcAmountUsed + cappedBNPCAmount,
      weeklyDiscountUsed: weeklyUsage.discountUsed + discountApplied,
      weekStart: weeklyUsage.weekStart,
      weekEnd: weeklyUsage.weekEnd,
    };
  };

  const calculatePromoDiscount = (subtotal) => {
    if (!selectedPromo || !appliedPromoData) return 0;
    const pd = appliedPromoData;
    if (subtotal < (pd.minPurchase || 0)) return 0;
    const eligible = cart.filter((item) => {
      const n = normalizeCartItem(item);
      const id = n.product._id;
      if (pd.scope === "product") return pd.targetIds.includes(id);
      if (pd.scope === "category")
        return pd.targetIds.includes(n.product.category?._id);
      return true;
    });
    if (!eligible.length) return 0;
    return pd.promoType === "percentage"
      ? (subtotal * pd.value) / 100
      : pd.value;
  };

  const validateAndSetPoints = (points) => {
    const { subtotal } = calculateCartTotals();
    if (!loyaltyConfig.enabled) {
      Alert.alert(
        "Loyalty Program Disabled",
        "Loyalty points cannot be used at this time",
      );
      setLoyaltyPoints("");
      setAppliedPoints(0);
      setPointsDiscount(0);
      return false;
    }
    if (points > availablePoints) {
      Alert.alert(
        "Insufficient Points",
        `You only have ${availablePoints} points available`,
      );
      setLoyaltyPoints(availablePoints.toString());
      return false;
    }
    const maxPointsValue = subtotal * (loyaltyConfig.maxRedeemPercent / 100);
    const maxPointsAllowed = Math.floor(
      maxPointsValue / loyaltyConfig.pointsToCurrencyRate,
    );
    if (points > maxPointsAllowed) {
      Alert.alert(
        "Max Points Exceeded",
        `You can only use up to ${maxPointsAllowed} points (${loyaltyConfig.maxRedeemPercent}% of order total)`,
      );
      setLoyaltyPoints(maxPointsAllowed.toString());
      return false;
    }
    setAppliedPoints(points);
    setPointsDiscount(points * loyaltyConfig.pointsToCurrencyRate);
    return true;
  };

  const handleLoyaltyPointsChange = (text) => {
    const val = text.replace(/[^0-9]/g, "");
    setLoyaltyPoints(val);
    if (!val) {
      setAppliedPoints(0);
      setPointsDiscount(0);
    }
  };

  const handleApplyLoyaltyPoints = () => {
    const pts = parseInt(loyaltyPoints) || 0;
    if (pts <= 0) {
      Alert.alert("Invalid Points", "Please enter valid loyalty points");
      return;
    }
    validateAndSetPoints(pts);
  };

  const handleRemoveLoyaltyPoints = () => {
    setLoyaltyPoints("");
    setAppliedPoints(0);
    setPointsDiscount(0);
    Alert.alert("Points Removed", "Loyalty points have been removed");
  };

  const calculatePointsEarned = (finalTotal) =>
    Math.floor(finalTotal * loyaltyConfig.earnRate);

  const calculateTotals = () => {
    const discountDetails = calculateDiscountDetails();
    const { subtotal } = calculateCartTotals();
    const promoDiscount = calculatePromoDiscount(subtotal);
    const afterOtherDiscounts =
      subtotal - discountDetails.discountApplied - promoDiscount;
    const maxLoyaltyDiscount =
      afterOtherDiscounts * (loyaltyConfig.maxRedeemPercent / 100);
    const effectiveLoyalty = Math.min(pointsDiscount, maxLoyaltyDiscount);
    const finalTotal = Math.max(0, afterOtherDiscounts - effectiveLoyalty);
    return {
      subtotal,
      bnpcDiscount: discountDetails.discountApplied,
      promoDiscount,
      loyaltyDiscount: effectiveLoyalty,
      loyaltyPointsUsed:
        effectiveLoyalty > 0
          ? effectiveLoyalty / loyaltyConfig.pointsToCurrencyRate
          : 0,
      finalTotal,
      discountDetails,
      afterOtherDiscounts,
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      userState.role === "user" && (await dispatch(getCartFromServer()));
      await fetchLoyaltyPointsData();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const updateQuantity = (itemId, newQty) => {
    if (newQty < 1) {
      dispatch(removeFromCart(itemId));
    } else {
      const item = cart.find((i) => i._id === itemId);
      if (item) {
        const n = normalizeCartItem(item);
        dispatch(
          adjustQuantity({
            _id: itemId,
            selectedQuantity: newQty,
            price: n.price,
            name: n.name,
          }),
        );
      }
    }
    userState.role === "user" && debounceCartSync(dispatch);
  };

  const removeItem = (itemId) => {
    Alert.alert("Remove Item", "Remove this item from cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          dispatch(removeFromCart(itemId));
          userState.role === "user" && debounceCartSync(dispatch);
        },
      },
    ]);
  };

  const clearAllItems = () => {
    Alert.alert("Clear Cart", "Remove all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: () => {
          dispatch(clearCart());
          userState.role === "user" && dispatch(clearCartToServer());
          setLoyaltyPoints("");
          setAppliedPoints(0);
          setPointsDiscount(0);
        },
      },
    ]);
  };

  const handleSelectPromo = async (promo) => {
    try {
      let res;

      // For guest users, use applyGuestPromo with cart data
      if (userState.role === "guest") {
        const cartData = {
          items: cart.map((item) => {
            const n = normalizeCartItem(item);
            return {
              product: {
                _id: n.product._id,
                name: n.product.name,
                price: n.product.price,
                category: n.product.category,
              },
              qty: n.selectedQuantity,
            };
          }),
        };
        res = await applyGuestPromo(promo.code, cartData);
      } else {
        // For authenticated users, use applyPromo
        res = await applyPromo(promo.code);
      }

      if (!res.valid) {
        Alert.alert(
          "Invalid Promo",
          res.reason || "This promo code is not valid",
        );
        return;
      }
      const pd = res.promo;
      const now = new Date();
      if (now < new Date(pd.startDate) || now > new Date(pd.endDate)) {
        Alert.alert("Promo Expired", "This promo is no longer valid");
        return;
      }
      if (!pd.active) {
        Alert.alert("Promo Inactive", "This promo is not active");
        return;
      }
      if (pd.usageLimit && pd.usedCount >= pd.usageLimit) {
        Alert.alert(
          "Promo Limit Reached",
          "This promo has reached its usage limit",
        );
        return;
      }
      setSelectedPromo(promo);
      setAppliedPromoData(pd);
      const disc = calculatePromoDiscount(calculateTotals().subtotal);
      if (disc > 0)
        Alert.alert(
          "Success",
          `Promo applied! You'll save ₱${disc.toFixed(2)}`,
        );
    } catch {
      Alert.alert("Promo Error", "Failed to apply promo. Please try again.");
    }
  };

  const handleRemovePromo = () => {
    setSelectedPromo(null);
    setAppliedPromoData(null);
    setPromoDiscountAmount(0);
  };

  const openCheckoutConfirm = () => {
    setConfirmChecked(false);
    setConfirmModalVisible(true);
  };

  const closeCheckoutConfirm = () => {
    setConfirmModalVisible(false);
    setConfirmChecked(false);
  };

  const handleCheckout = async () => {
    const { itemCount } = calculateCartTotals();
    if (!itemCount) {
      Alert.alert("Empty Cart", "Your cart is empty. Add items to checkout.");
      return;
    }
    if (appliedPoints > 0 && !loyaltyConfig.enabled) {
      Alert.alert(
        "Loyalty Program Disabled",
        "Loyalty points cannot be used at this time",
      );
      return;
    }

    const totals = calculateTotals();
    const discountDetails = totals.discountDetails;
    const eligibleBNPCItems = getEligibleBNPCItems();
    const scope = getUserDiscountScope();

    const bnpcProducts = eligibleBNPCItems.map((item) => {
      const n = normalizeCartItem(item);
      return {
        productId: n.product._id,
        name: n.product.name,
        price: n.price,
        salePrice: n.salePrice,
        saleActive: n.saleActive,
        quantity: n.selectedQuantity,
        unit: n.product.unit || "pc",
        category: n.product.category?._id,
        categoryName: n.product.category?.categoryName,
        isBNPCEligible: true,
        requiresVerification: true,
        itemTotal: n.price * n.selectedQuantity,
      };
    });

    const items = cart.map((item) => {
      const n = normalizeCartItem(item);
      const p = n.product;
      const ok =
        isEligibleUser &&
        p.isBNPC &&
        !p.excludedFromDiscount &&
        ["PWD", "SENIOR"].includes(scope);
      return {
        product: p._id,
        name: p.name,
        sku: p.sku || `PROD-${p._id.slice(-6)}`,
        quantity: n.selectedQuantity,
        unitPrice: n.price,
        salePrice: n.salePrice,
        saleActive: n.saleActive,
        isBNPCEligible: ok || false,
        isBNPCProduct: p.isBNPC || false,
        excludedFromDiscount: p.excludedFromDiscount || false,
        category: {
          id: p.category?._id,
          name: p.category?.categoryName,
          isBNPC: p.category?.isBNPC || false,
        },
        unit: p.unit || "pc",
        itemTotal: n.price * n.selectedQuantity,
      };
    });

    const checkoutTotals = {
      subtotal: totals.subtotal,
      afterOtherDiscounts: totals.afterOtherDiscounts,
      bnpcEligibleSubtotal: discountDetails.bnpcEligibleSubtotal || 0,
      bnpcDiscount: totals.bnpcDiscount || 0,
      promoDiscount: totals.promoDiscount || 0,
      loyaltyDiscount: totals.loyaltyDiscount || 0,
      discountTotal:
        (totals.bnpcDiscount || 0) +
        (totals.promoDiscount || 0) +
        (totals.loyaltyDiscount || 0),
      finalTotal: totals.finalTotal,
    };
    const discountSnapshot = {
      eligible: discountDetails.eligible,
      eligibleItemsCount: discountDetails.eligibleItemsCount || 0,
      bnpcEligibleSubtotal: discountDetails.bnpcEligibleSubtotal || 0,
      cappedBNPCAmount: discountDetails.cappedBNPCAmount || 0,
      discountApplied: discountDetails.discountApplied || 0,
      remainingPurchaseCap:
        discountDetails.remainingPurchaseCap || BNPC_PURCHASE_CAP,
      remainingDiscountCap:
        discountDetails.remainingDiscountCap || BNPC_DISCOUNT_CAP,
      weeklyPurchaseUsed: discountDetails.weeklyPurchaseUsed || 0,
      weeklyDiscountUsed: discountDetails.weeklyDiscountUsed || 0,
      weekStart: discountDetails.weekStart,
      weekEnd: discountDetails.weekEnd,
      reason: discountDetails.reason || null,
    };
    const weeklyUsageSnapshot = {
      bnpcAmountUsed: weeklyUsage.bnpcAmountUsed,
      discountUsed: weeklyUsage.discountUsed,
      weekStart: weeklyUsage.weekStart,
      weekEnd: weeklyUsage.weekEnd,
      remainingPurchaseCap: BNPC_PURCHASE_CAP - weeklyUsage.bnpcAmountUsed,
      remainingDiscountCap: BNPC_DISCOUNT_CAP - weeklyUsage.discountUsed,
      purchaseCap: BNPC_PURCHASE_CAP,
      discountCap: BNPC_DISCOUNT_CAP,
    };
    const promoData =
      !isOffline && !isServerDown && selectedPromo
        ? {
            promoId: selectedPromo._id,
            code: selectedPromo.code,
            name: selectedPromo.promoName?.promo || selectedPromo.name,
            type: selectedPromo.promoType || selectedPromo.type,
            value: selectedPromo.value,
            scope: selectedPromo.scope,
            targetIds: selectedPromo.targetIds,
            minPurchase: selectedPromo.minPurchase || 0,
            discountAmount: totals.promoDiscount || 0,
            serverValidated: true,
            appliedPromoData,
          }
        : null;
    const loyaltyPointsData =
      !isOffline && !isServerDown && totals.loyaltyDiscount > 0
        ? {
            pointsUsed: totals.loyaltyPointsUsed,
            pointsValue: loyaltyConfig.pointsToCurrencyRate,
            discountAmount: totals.loyaltyDiscount,
            maxAllowedDiscount:
              totals.afterOtherDiscounts *
              (loyaltyConfig.maxRedeemPercent / 100),
            maxRedeemPercent: loyaltyConfig.maxRedeemPercent,
            percentageUsed:
              (
                (totals.loyaltyDiscount / totals.afterOtherDiscounts) *
                100
              ).toFixed(2) + "%",
            config: {
              pointsToCurrencyRate: loyaltyConfig.pointsToCurrencyRate,
              maxRedeemPercent: loyaltyConfig.maxRedeemPercent,
              earnRate: loyaltyConfig.earnRate,
            },
          }
        : null;

    const checkoutData = {
      user: userState.user?.userId || null,
      userType: userState.user?.userId ? "user" : "guest",
      userEmail: userState.user?.email || null,
      userName: userState.user?.name || null,
      items,
      totalItems: itemCount,
      bnpcProducts: !isOffline && !isServerDown ? bnpcProducts : [],
      hasBNPCItems:
        !isOffline && !isServerDown ? bnpcProducts.length > 0 : false,
      totals: checkoutTotals,
      discountBreakdown:
        !isOffline && !isServerDown
          ? {
              bnpcDiscount: totals.bnpcDiscount,
              promoDiscount: totals.promoDiscount,
              loyaltyDiscount: totals.loyaltyDiscount,
              totalDiscount: checkoutTotals.discountTotal,
            }
          : {
              bnpcDiscount: 0,
              promoDiscount: 0,
              loyaltyDiscount: 0,
              totalDiscount: 0,
            },
      discountSnapshot: !isOffline && !isServerDown ? discountSnapshot : null,
      weeklyUsageSnapshot:
        !isOffline && !isServerDown ? weeklyUsageSnapshot : null,
      userEligibility:
        !isOffline && !isServerDown
          ? {
              isPWD: userEligibility.isPWD,
              isSenior: userEligibility.isSenior,
              verified: isEligibleUser,
              verificationIdType: eligibilityStatus?.idType || null,
              discountScope: scope,
              weeklyCaps: {
                purchaseCap: BNPC_PURCHASE_CAP,
                discountCap: BNPC_DISCOUNT_CAP,
              },
              currentUsage: {
                purchasedUsed: weeklyUsage.bnpcAmountUsed,
                discountUsed: weeklyUsage.discountUsed,
                weekStart: weeklyUsage.weekStart,
                weekEnd: weeklyUsage.weekEnd,
              },
            }
          : null,
      customerVerification:
        !isOffline && !isServerDown && isEligibleUser
          ? {
              type: userEligibility.isPWD
                ? "pwd"
                : userEligibility.isSenior
                  ? "senior"
                  : null,
              verified: isEligibleUser,
              verificationSource: "system",
              verificationDate: new Date().toISOString(),
            }
          : null,
      promo: promoData,
      loyaltyPoints: loyaltyPointsData,
      pointsEarned:
        !isOffline && !isServerDown
          ? calculatePointsEarned(totals.finalTotal)
          : 0,
      offlineMode: isOffline || isServerDown,
      offlineNote:
        isOffline || isServerDown
          ? "Offline checkout: Promo and loyalty points will be applied by cashier during payment"
          : null,
      cartSnapshot: {
        itemCount: cart.length,
        totalValue: totals.subtotal,
        // When offline or server down, use lightweight format (IDs + qty only)
        // When online, include full product details
        items:
          isOffline || isServerDown
            ? cart.map((i) => ({
                productId: i.product?._id || i._id,
                quantity: i.selectedQuantity || i.qty,
              }))
            : cart.map((i) => ({
                productId: i.product?._id || i._id,
                name: i.product?.name || i.name,
                quantity: i.selectedQuantity || i.qty,
              })),
        offlineMode: isOffline || isServerDown,
      },
    };

    console.log("📦 [CART SCREEN] Checkout data prepared");
    console.log("📦 [CART SCREEN] Offline mode:", isOffline || isServerDown);
    console.log(
      "📦 [CART SCREEN] Cart snapshot:",
      isOffline || isServerDown ? "Lightweight (IDs only)" : "Full details",
    );

    try {
      // If offline or server down, queue checkout locally
      if (isOffline || isServerDown) {
        console.log(
          "🔌 [CHECKOUT] Offline mode detected - queueing checkout locally",
        );

        // Create checkout queue entry
        const checkoutQueue = {
          id: `checkout-${Date.now()}`,
          timestamp: new Date().toISOString(),
          data: checkoutData,
          status: "pending",
          synced: false,
        };

        // Get existing queue or create new
        const existingQueue = await AsyncStorage.getItem("checkout_queue");
        const queue = existingQueue ? JSON.parse(existingQueue) : [];
        queue.push(checkoutQueue);

        // Save to AsyncStorage
        await AsyncStorage.setItem("checkout_queue", JSON.stringify(queue));
        console.log("📝 [CHECKOUT] Queued checkout locally:", checkoutQueue.id);

        // Clear cart and show success message
        dispatch(clearCart());
        // Alert.alert(
        //   "Checkout Queued",
        //   "Your checkout is queued and will be processed when your connection is restored.",
        //   [{ text: "OK" }],
        // );

        // Navigate to QR screen with pending status
        navigation.navigate("Shared", {
          screen: "QR",
          params: {
            id: checkoutQueue.id,
            status: "pending",
            offlineMode: true,
            checkoutData,
          },
        });
        return;
      }

      // Online checkout - proceed normally
      const token = userState.role === "user" ? await getToken() : null;
      const queue = await checkout(checkoutData);
      navigation.navigate("Shared", {
        screen: "QR",
        params: { ...queue, token },
      });
    } catch (error) {
      Alert.alert("Checkout Failed", error.message || "Please try again");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently added";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently added";
    }
  };

  const formatWeekRange = (start, end) => {
    if (!start || !end) return "";
    try {
      return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
    } catch {
      return "";
    }
  };

  const totals = calculateTotals();
  const discountDetails = totals.discountDetails;
  const { itemCount: displayItemCount } = calculateCartTotals();
  const pointsEarned = calculatePointsEarned(totals.finalTotal);
  const maxPointsAllowed = Math.floor(
    (totals.afterOtherDiscounts * (loyaltyConfig.maxRedeemPercent / 100)) /
      loyaltyConfig.pointsToCurrencyRate,
  );
  const purchaseProgress = Math.min(
    (weeklyUsage.bnpcAmountUsed / BNPC_PURCHASE_CAP) * 100,
    100,
  );
  const discountProgress = Math.min(
    (weeklyUsage.discountUsed / BNPC_DISCOUNT_CAP) * 100,
    100,
  );

  const renderCartItem = (item) => {
    const n = normalizeCartItem(item);
    const product = n.product;
    const currentPrice =
      product.saleActive && product.salePrice ? product.salePrice : n.price;
    const itemTotal = currentPrice * n.selectedQuantity;
    const scope = getUserDiscountScope();
    const isBNPCEligible =
      isEligibleUser &&
      product.isBNPC &&
      !product.excludedFromDiscount &&
      ["PWD", "SENIOR"].includes(scope);

    return (
      <View key={n._id} style={styles.cartItem}>
        <Image
          source={{
            uri:
              n.images?.[0]?.url ||
              product.images?.[0]?.url ||
              "https://via.placeholder.com/100",
          }}
          style={styles.itemImage}
          resizeMode="cover"
        />

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {n.name}
          </Text>

          {product.isBNPC && (
            <View style={styles.badgeRow}>
              <View style={styles.bnpcBadge}>
                <Text style={styles.bnpcBadgeText}>BNPC</Text>
              </View>
              {isBNPCEligible && (
                <View style={styles.eligibleBadge}>
                  <Text style={styles.eligibleBadgeText}>5% off</Text>
                </View>
              )}
              {product.isBNPC && !isBNPCEligible && isEligibleUser && (
                <Text style={styles.ineligibleText}>Not eligible</Text>
              )}
            </View>
          )}

          <View style={styles.priceRow}>
            {product.saleActive && product.salePrice ? (
              <>
                <Text style={styles.salePrice}>
                  ₱{product.salePrice.toFixed(2)}
                </Text>
                <Text style={styles.originalPrice}>
                  ₱{product.price.toFixed(2)}
                </Text>
                <View style={styles.saleBadge}>
                  <Text style={styles.saleBadgeText}>SALE</Text>
                </View>
              </>
            ) : (
              <Text style={styles.regularPrice}>₱{n.price.toFixed(2)}</Text>
            )}
            <Text style={styles.unitText}>/ {product.unit || "pc"}</Text>
          </View>

          <Text style={styles.dateText}>Added {formatDate(n.dateAdded)}</Text>
        </View>

        <View style={styles.itemActions}>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(n._id, n.selectedQuantity - 1)}
            >
              <MaterialCommunityIcons name="minus" size={16} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyText}>{n.selectedQuantity}</Text>
            </View>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(n._id, n.selectedQuantity + 1)}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.itemTotalText}>₱{itemTotal.toFixed(2)}</Text>

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeItem(n._id)}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={18}
              color="#DC2626"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color="#0f172a"
          />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>My Cart</Text>
          <Text style={styles.headerSubtitle}>
            {displayItemCount} item{displayItemCount !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearAllItems}
          disabled={!cart.length}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={20}
            color={cart.length ? "#DC2626" : "#cbd5e1"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00A86B"
          />
        }
      >
        {/* ── Eligibility Card ── */}
        {cart.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: isEligibleUser
                      ? "rgba(0,168,107,0.1)"
                      : "#f1f5f9",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={isEligibleUser ? "shield-check" : "shield-off"}
                  size={18}
                  color={isEligibleUser ? "#00A86B" : "#94a3b8"}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>
                  {isEligibleUser
                    ? "BNPC Discount Eligible"
                    : "Regular Customer"}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {isEligibleUser
                    ? `${userEligibility.isPWD ? "PWD" : "Senior Citizen"} · 5% off eligible BNPC items`
                    : "Apply for PWD/Senior benefits to unlock discounts"}
                </Text>
              </View>
            </View>

            {/* Simple eligibility message - removed progress bars */}
            {isEligibleUser && discountDetails.eligibleItemsCount > 0 && (
              <View style={[styles.chip, styles.greenChip, { marginTop: 8 }]}>
                <MaterialCommunityIcons name="tag" size={14} color="#00A86B" />
                <Text style={[styles.chipText, { color: "#00A86B" }]}>
                  {discountDetails.eligibleItemsCount} BNPC item
                  {discountDetails.eligibleItemsCount !== 1 ? "s" : ""} eligible
                  for 5% discount
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Cart Items ── */}
        {cart.length > 0 ? (
          <View style={styles.itemsContainer}>{cart.map(renderCartItem)}</View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons
                name="cart-off"
                size={48}
                color="#CBD5E1"
              />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>
              Scan products to add them to your cart
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => navigation.navigate("Scan")}
            >
              <MaterialCommunityIcons
                name="barcode-scan"
                size={18}
                color="#fff"
              />
              <Text style={styles.scanButtonText}>Scan Products</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Promo Card ── */}
        {cart.length > 0 && !isOffline && !isServerDown && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: "rgba(255,152,0,0.1)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="tag-multiple"
                  size={18}
                  color="#FF9800"
                />
              </View>
              <Text style={[styles.cardTitle, { marginLeft: 12 }]}>
                Apply Promo
              </Text>
            </View>

            {selectedPromo ? (
              <View style={styles.appliedRow}>
                <View style={styles.appliedInfo}>
                  <MaterialCommunityIcons
                    name="ticket-percent"
                    size={18}
                    color="#00A86B"
                  />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.appliedCode}>{selectedPromo.code}</Text>
                    <Text style={styles.appliedName}>
                      {selectedPromo.promoName?.promo || selectedPromo.name}
                    </Text>
                    <Text style={styles.appliedValue}>
                      {appliedPromoData?.promoType === "percentage"
                        ? `${appliedPromoData?.value}% off`
                        : `₱${appliedPromoData?.value} off`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeChip}
                  onPress={handleRemovePromo}
                >
                  <Text style={styles.removeChipText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 10, marginTop: 4 }}>
                {promo.map((p) => (
                  <TouchableOpacity
                    key={p._id}
                    style={styles.promoOption}
                    onPress={() => handleSelectPromo(p)}
                  >
                    <MaterialCommunityIcons
                      name="ticket"
                      size={18}
                      color="#00A86B"
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.promoOptionCode}>{p.code}</Text>
                      <Text style={styles.promoOptionName}>
                        {p.promoName?.promo}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Loyalty Points Card ── */}
        {cart.length > 0 &&
          loyaltyConfig.enabled &&
          userState.role === "user" && !isOffline && !isServerDown && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: "rgba(180,83,9,0.1)" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="trophy"
                    size={18}
                    color="#B45309"
                  />
                </View>
                <Text style={[styles.cardTitle, { marginLeft: 12 }]}>
                  Loyalty Points
                </Text>
              </View>

              {/* Balance pill */}
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Available</Text>
                <Text style={styles.balanceValue}>
                  {availablePoints.toLocaleString()} pts
                </Text>
              </View>

              {appliedPoints > 0 ? (
                <View style={styles.appliedRow}>
                  <View style={styles.appliedInfo}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={18}
                      color="#00A86B"
                    />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.appliedCode}>
                        {appliedPoints} points applied
                      </Text>
                      <Text style={[styles.appliedValue, { color: "#059669" }]}>
                        -₱{pointsDiscount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeChip}
                    onPress={handleRemoveLoyaltyPoints}
                  >
                    <Text style={styles.removeChipText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.pointsInput}
                      placeholder="Enter points"
                      placeholderTextColor="#94a3b8"
                      value={loyaltyPoints}
                      onChangeText={handleLoyaltyPointsChange}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                    <TouchableOpacity
                      style={[
                        styles.applyBtn,
                        (!loyaltyPoints.trim() || !loyaltyConfig.enabled) &&
                          styles.applyBtnDisabled,
                      ]}
                      onPress={handleApplyLoyaltyPoints}
                      disabled={!loyaltyPoints.trim() || !loyaltyConfig.enabled}
                    >
                      <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                  {loyaltyPoints ? (
                    <Text style={styles.hintText}>
                      Max {maxPointsAllowed} pts = ₱
                      {(
                        maxPointsAllowed * loyaltyConfig.pointsToCurrencyRate
                      ).toFixed(2)}
                    </Text>
                  ) : null}
                </>
              )}

              <View
                style={[
                  styles.chip,
                  { backgroundColor: "rgba(180,83,9,0.08)", marginTop: 12 },
                ]}
              >
                <MaterialCommunityIcons name="gift" size={13} color="#B45309" />
                <Text style={[styles.chipText, { color: "#B45309" }]}>
                  You'll earn {pointsEarned} pts with this purchase
                  {loyaltyConfig.earnRate > 0
                    ? ` (₱1 = ${loyaltyConfig.earnRate} pts)`
                    : ""}
                </Text>
              </View>
            </View>
          )}

        {/* ── Order Summary ── */}
        {cart.length > 0 && (
          <View style={[styles.card, styles.summaryCard]}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            {/* Subtotal */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                ₱{totals.subtotal.toFixed(2)}
              </Text>
            </View>

            {/* BNPC Discount block - simplified */}
            {isEligibleUser && discountDetails.eligibleItemsCount > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.discountHeader}>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={16}
                    color="#00A86B"
                  />
                  <Text style={styles.discountTitle}>BNPC Discount (5%)</Text>
                </View>

                {discountDetails.discountApplied > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.discountLabel}>
                      Savings on BNPC items
                    </Text>
                    <Text style={[styles.discountValue, { color: "#00A86B" }]}>
                      -₱{discountDetails.discountApplied.toFixed(2)}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Promo Discount block */}
            {selectedPromo && totals.promoDiscount > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.discountHeader}>
                  <MaterialCommunityIcons
                    name="tag"
                    size={16}
                    color="#FF9800"
                  />
                  <Text style={styles.discountTitle}>Promo Discount</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.discountLabel}>{selectedPromo.code}</Text>
                  <Text style={[styles.discountValue, { color: "#FF9800" }]}>
                    -₱{totals.promoDiscount.toFixed(2)}
                  </Text>
                </View>
              </>
            )}

            {/* Loyalty Discount block */}
            {totals.loyaltyDiscount > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.discountHeader}>
                  <MaterialCommunityIcons
                    name="trophy"
                    size={16}
                    color="#B45309"
                  />
                  <Text style={styles.discountTitle}>Loyalty Discount</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.discountLabel}>
                    {totals.loyaltyPointsUsed} pts used
                  </Text>
                  <Text style={[styles.discountValue, { color: "#B45309" }]}>
                    -₱{totals.loyaltyDiscount.toFixed(2)}
                  </Text>
                </View>
              </>
            )}

            {/* Total */}
            <View style={styles.totalDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₱{totals.finalTotal.toFixed(2)}
              </Text>
            </View>

            {/* Savings pill */}
            {(discountDetails.discountApplied > 0 ||
              totals.promoDiscount > 0 ||
              totals.loyaltyDiscount > 0) && (
              <View
                style={[
                  styles.chip,
                  styles.greenChip,
                  { marginTop: 12, justifyContent: "center" },
                ]}
              >
                <MaterialCommunityIcons
                  name="piggy-bank"
                  size={14}
                  color="#00A86B"
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: "#00A86B", fontWeight: "700" },
                  ]}
                >
                  You saved ₱
                  {(
                    discountDetails.discountApplied +
                    totals.promoDiscount +
                    totals.loyaltyDiscount
                  ).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Checkout Confirmation Modal ── */}
      <Modal
        transparent
        animationType="fade"
        visible={confirmModalVisible}
        onRequestClose={closeCheckoutConfirm}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <MaterialCommunityIcons
              name="cart-check"
              size={48}
              color="#00A86B"
              style={styles.confirmIcon}
            />
            <Text style={styles.confirmTitle}>Confirm Your Cart</Text>
            <Text style={styles.confirmText}>
              You have {displayItemCount} item
              {displayItemCount !== 1 ? "s" : ""} in your cart. Please verify
              before proceeding to checkout.
            </Text>

            <TouchableOpacity
              style={styles.confirmCheckboxRow}
              onPress={() => setConfirmChecked((prev) => !prev)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={
                  confirmChecked ? "checkbox-marked" : "checkbox-blank-outline"
                }
                size={24}
                color={confirmChecked ? "#00A86B" : "#94A3B8"}
              />
              <Text style={styles.confirmCheckboxText}>
                I have verified the items in my cart
              </Text>
            </TouchableOpacity>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={closeCheckoutConfirm}
              >
                <Text style={styles.confirmCancelText}>Review Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmProceedBtn,
                  !confirmChecked && styles.confirmProceedBtnDisabled,
                ]}
                onPress={() => {
                  closeCheckoutConfirm();
                  handleCheckout();
                }}
                disabled={!confirmChecked}
              >
                <Text style={styles.confirmProceedText}>Proceed to QR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Checkout Bar ── */}
      {cart.length > 0 && (
        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.checkoutLabel}>Total</Text>
            <Text style={styles.checkoutTotal}>
              ₱{totals.finalTotal.toFixed(2)}
            </Text>
            {(discountDetails.discountApplied > 0 ||
              totals.promoDiscount > 0 ||
              totals.loyaltyDiscount > 0) && (
              <Text style={styles.checkoutOriginal}>
                Was ₱{totals.subtotal.toFixed(2)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={openCheckoutConfirm}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cart-check" size={20} color="#fff" />
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Styles — aligned with design system ──────────────────
const styles = StyleSheet.create({
  // Layout
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingBottom: 120 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },

  // Card
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  cardSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // Chips
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: "#F8FAFC",
  },
  greenChip: { backgroundColor: "rgba(0,168,107,0.1)" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#64748B" },

  // Cart items
  itemsContainer: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 6,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 6,
  },
  bnpcBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bnpcBadgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  eligibleBadge: {
    backgroundColor: "rgba(0,168,107,0.1)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  eligibleBadgeText: { fontSize: 10, color: "#00A86B", fontWeight: "700" },
  ineligibleText: { fontSize: 11, color: "#94A3B8" },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  regularPrice: { fontSize: 16, fontWeight: "700", color: "#00A86B" },
  salePrice: { fontSize: 16, fontWeight: "700", color: "#00A86B" },
  originalPrice: {
    fontSize: 13,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  saleBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saleBadgeText: { fontSize: 9, color: "#fff", fontWeight: "700" },
  unitText: { fontSize: 12, color: "#94A3B8" },
  dateText: { fontSize: 11, color: "#94A3B8" },
  itemActions: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingLeft: 8,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyDisplay: {
    minWidth: 32,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginHorizontal: 2,
  },
  qtyText: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  itemTotalText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 6,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    marginHorizontal: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#00A86B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  scanButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  // Applied row
  appliedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  appliedInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  appliedCode: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  appliedName: { fontSize: 12, color: "#64748B", marginTop: 2 },
  appliedValue: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  removeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  removeChipText: { fontSize: 12, fontWeight: "600", color: "#EF4444" },

  // Promo option
  promoOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  promoOptionCode: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  promoOptionName: { fontSize: 12, color: "#64748B", marginTop: 2 },

  // Loyalty balance
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
  },
  balanceLabel: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  balanceValue: { fontSize: 18, fontWeight: "700", color: "#0F172A" },

  // Points input
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  pointsInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    color: "#0F172A",
  },
  applyBtn: {
    backgroundColor: "#B45309",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  applyBtnDisabled: { backgroundColor: "#E2E8F0" },
  applyBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  hintText: { fontSize: 12, color: "#94A3B8", marginBottom: 4 },

  // Order summary
  summaryCard: { marginBottom: 16 },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 14, color: "#64748B" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  discountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  discountTitle: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  discountLabel: { fontSize: 13, color: "#64748B", flex: 1 },
  discountValue: { fontSize: 14, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 14 },
  totalDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 14,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  totalValue: { fontSize: 24, fontWeight: "800", color: "#00A86B" },

  // Confirmation Modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmIcon: { marginBottom: 16 },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  confirmText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 20,
    width: "100%",
  },
  confirmCheckboxText: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
    flex: 1,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
  },
  confirmCancelText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmProceedBtn: {
    flex: 1,
    backgroundColor: "#00A86B",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmProceedBtnDisabled: {
    backgroundColor: "#CBD5E1",
  },
  confirmProceedText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Checkout bar
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  checkoutLabel: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  checkoutTotal: { fontSize: 24, fontWeight: "800", color: "#00A86B" },
  checkoutOriginal: {
    fontSize: 13,
    color: "#94A3B8",
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  checkoutBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A86B",
    borderRadius: 30,
    paddingVertical: 14,
    gap: 8,
    marginLeft: 16,
  },
  checkoutBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

export default CartScreen;
