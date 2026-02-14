import React, { useState, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
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
import { applyPromo } from "../../api/promo.api";
import { fetchHomeData } from "../../api/user.api";
import { getConfig } from "../../api/loyalty.api";

// Constants for BNPC caps
const BNPC_PURCHASE_CAP = 2500;
const BNPC_DISCOUNT_CAP = 125;

const CartScreen = ({ navigation, route }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState("");
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

  const isEligibleUser = eligibilityStatus?.isVerified;

  useEffect(() => {
    (async () => {
      userState.role === "user" && dispatch(getCartFromServer());
      await fetchLoyaltyPointsData();
    })();
  }, [userState.role]);

  useEffect(() => {
    if (eligibilityStatus?.idType === "senior") {
      setUserEligibility((prev) => ({ ...prev, isSenior: true }));
    }
    if (eligibilityStatus?.idType === "pwd") {
      setUserEligibility((prev) => ({ ...prev, isPWD: true }));
    }
  }, [eligibilityStatus]);

  // Reset points when cart changes
  useEffect(() => {
    if (appliedPoints > 0) {
      validateAndSetPoints(appliedPoints);
    }
  }, [cart]);

  async function fetchLoyaltyPointsData() {
    try {
      const [homeData, config] = await Promise.all([
        fetchHomeData(),
        getConfig(),
      ]);
      console.log("Home data:", homeData);
      
      setAvailablePoints(homeData.loyaltyPoints);
      
      // Set weekly usage from the API data
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

  // Normalize cart item
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

  // Calculate cart totals safely
  const calculateCartTotals = () => {
    if (!cart || cart.length === 0) {
      return { subtotal: 0, itemCount: 0 };
    }

    let subtotal = 0;
    let totalItems = 0;

    cart.forEach((item) => {
      const normalizedItem = normalizeCartItem(item);
      const price =
        normalizedItem.saleActive && normalizedItem.salePrice
          ? Number(normalizedItem.salePrice)
          : Number(normalizedItem.price) || 0;
      const quantity = Number(normalizedItem.selectedQuantity) || 1;

      if (!isNaN(price) && !isNaN(quantity)) {
        subtotal += price * quantity;
        totalItems += quantity;
      }
    });

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      itemCount: totalItems,
    };
  };

  // Get user discount scope based on eligibility
  const getUserDiscountScope = () => {
    if (userEligibility.isPWD) return "PWD";
    if (userEligibility.isSenior) return "SENIOR";
    return null;
  };

  // Filter Eligible BNPC Items
  const getEligibleBNPCItems = () => {
    if (!isEligibleUser) return [];

    const userScope = getUserDiscountScope();
    if (!userScope) return [];

    return cart.filter((item) => {
      const normalizedItem = normalizeCartItem(item);
      const product = normalizedItem.product;

      const isEligible =
        product.isBNPC &&
        !product.excludedFromDiscount &&
        ["PWD", "SENIOR"].includes(userScope);

      return isEligible;
    });
  };

  // Compute BNPC Subtotal for eligible items only
  const calculateBNPCEligibleSubtotal = () => {
    const eligibleItems = getEligibleBNPCItems();

    const subtotal = eligibleItems.reduce((sum, item) => {
      const normalizedItem = normalizeCartItem(item);
      const price =
        normalizedItem.saleActive && normalizedItem.salePrice
          ? Number(normalizedItem.salePrice)
          : Number(normalizedItem.price) || 0;
      const quantity = Number(normalizedItem.selectedQuantity) || 1;
      return sum + price * quantity;
    }, 0);

    return subtotal;
  };

  // Apply Weekly Caps using real data from API
  const calculateDiscountDetails = () => {
    const eligibleItems = getEligibleBNPCItems();
    const eligibleBNPCSubtotal = calculateBNPCEligibleSubtotal();

    if (!isEligibleUser) {
      return {
        eligible: false,
        discountApplied: 0,
        bnpcEligibleSubtotal: 0,
        cappedBNPCAmount: 0,
        eligibleItemsCount: 0,
        reason: "User not eligible for BNPC discounts",
      };
    }

    if (eligibleItems.length === 0) {
      return {
        eligible: false,
        discountApplied: 0,
        bnpcEligibleSubtotal: 0,
        cappedBNPCAmount: 0,
        eligibleItemsCount: 0,
        reason: "No eligible BNPC items in cart",
      };
    }

    // Calculate remaining caps based on actual usage from API
    const remainingPurchaseCap = Math.max(
      BNPC_PURCHASE_CAP - weeklyUsage.bnpcAmountUsed, 
      0
    );

    if (remainingPurchaseCap === 0) {
      return {
        eligible: false,
        discountApplied: 0,
        bnpcEligibleSubtotal: eligibleBNPCSubtotal,
        cappedBNPCAmount: 0,
        eligibleItemsCount: eligibleItems.length,
        reason: `Weekly purchase cap reached (₱${BNPC_PURCHASE_CAP.toLocaleString()})`,
      };
    }

    const cappedBNPCAmount = Math.min(
      eligibleBNPCSubtotal,
      remainingPurchaseCap,
    );

    const rawDiscount = cappedBNPCAmount * 0.05; // 5% discount on total eligible amount
    const remainingDiscountCap = Math.max(
      BNPC_DISCOUNT_CAP - weeklyUsage.discountUsed, 
      0
    );

    if (remainingDiscountCap === 0) {
      return {
        eligible: false,
        discountApplied: 0,
        bnpcEligibleSubtotal: eligibleBNPCSubtotal,
        cappedBNPCAmount,
        eligibleItemsCount: eligibleItems.length,
        reason: `Weekly discount cap reached (₱${BNPC_DISCOUNT_CAP})`,
      };
    }

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

  // Calculate promo discount with server validation
  const calculatePromoDiscount = (subtotal) => {
    if (!selectedPromo || !appliedPromoData) return 0;

    const promoData = appliedPromoData;

    // Check minimum purchase
    if (subtotal < (promoData.minPurchase || 0)) {
      return 0;
    }

    // Check if items are eligible for promo
    const eligibleItems = cart.filter((item) => {
      const normalizedItem = normalizeCartItem(item);
      const productId = normalizedItem.product._id;

      if (promoData.scope === "product") {
        return promoData.targetIds.includes(productId);
      } else if (promoData.scope === "category") {
        const categoryId = normalizedItem.product.category?._id;
        return categoryId && promoData.targetIds.includes(categoryId);
      }
      return true; // For global promos
    });

    if (eligibleItems.length === 0) {
      return 0;
    }

    // Calculate discount based on server response
    if (promoData.promoType === "percentage") {
      return (subtotal * promoData.value) / 100;
    } else {
      return promoData.value;
    }
  };

  // Validate and set loyalty points according to rules
  const validateAndSetPoints = (points) => {
    const { subtotal } = calculateCartTotals();

    // Check if loyalty program is enabled
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

    // Check if user has enough points
    if (points > availablePoints) {
      Alert.alert(
        "Insufficient Points",
        `You only have ${availablePoints} points available`,
      );
      setLoyaltyPoints(availablePoints.toString());
      return false;
    }

    // Calculate max points allowed (based on max redeem percent)
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

    // Calculate discount value
    const discountValue = points * loyaltyConfig.pointsToCurrencyRate;

    setAppliedPoints(points);
    setPointsDiscount(discountValue);
    return true;
  };

  const handleLoyaltyPointsChange = (text) => {
    // Allow only numbers
    const numericValue = text.replace(/[^0-9]/g, "");
    setLoyaltyPoints(numericValue);

    // Clear applied points if input is empty
    if (!numericValue) {
      setAppliedPoints(0);
      setPointsDiscount(0);
    }
  };

  const handleApplyLoyaltyPoints = () => {
    const points = parseInt(loyaltyPoints) || 0;

    if (points <= 0) {
      Alert.alert("Invalid Points", "Please enter valid loyalty points");
      return;
    }

    validateAndSetPoints(points);
  };

  const handleRemoveLoyaltyPoints = () => {
    setLoyaltyPoints("");
    setAppliedPoints(0);
    setPointsDiscount(0);
    Alert.alert("Points Removed", "Loyalty points have been removed");
  };

  // Calculate points earned from this purchase
  const calculatePointsEarned = (finalTotal) => {
    return Math.floor(finalTotal * loyaltyConfig.earnRate);
  };

  // Calculate all totals with loyalty points
  const calculateTotals = () => {
    const discountDetails = calculateDiscountDetails();
    const { subtotal } = calculateCartTotals();
    const promoDiscount = calculatePromoDiscount(subtotal);

    // Calculate total after BNPC and promo discounts (before loyalty)
    const afterOtherDiscounts =
      subtotal - discountDetails.discountApplied - promoDiscount;

    // Loyalty points discount (capped at max redeem percent)
    const maxLoyaltyDiscount =
      afterOtherDiscounts * (loyaltyConfig.maxRedeemPercent / 100);
    const effectiveLoyaltyDiscount = Math.min(
      pointsDiscount,
      maxLoyaltyDiscount,
    );

    const finalTotal = Math.max(
      0,
      afterOtherDiscounts - effectiveLoyaltyDiscount,
    );

    return {
      subtotal,
      bnpcDiscount: discountDetails.discountApplied,
      promoDiscount,
      loyaltyDiscount: effectiveLoyaltyDiscount,
      loyaltyPointsUsed:
        effectiveLoyaltyDiscount > 0
          ? effectiveLoyaltyDiscount / loyaltyConfig.pointsToCurrencyRate
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
    } catch (error) {
      console.error("Error refreshing cart:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const updateQuantity = (itemId, newQty) => {
    if (newQty < 1) {
      dispatch(removeFromCart(itemId));
    } else {
      const item = cart.find((item) => item._id === itemId);
      if (item) {
        const normalizedItem = normalizeCartItem(item);
        dispatch(
          adjustQuantity({
            _id: itemId,
            selectedQuantity: newQty,
            price: normalizedItem.price,
            name: normalizedItem.name,
          }),
        );
      }
    }
    userState.role === "user" && debounceCartSync(dispatch);
  };

  const removeItem = (itemId) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            dispatch(removeFromCart(itemId));
            userState.role === "user" && debounceCartSync(dispatch);
          },
        },
      ],
    );
  };

  const clearAllItems = () => {
    Alert.alert("Clear Cart", "Are you sure you want to clear all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: () => {
          dispatch(clearCart());
          userState.role === "user" && dispatch(clearCartToServer());
          // Clear loyalty points when cart is cleared
          setLoyaltyPoints("");
          setAppliedPoints(0);
          setPointsDiscount(0);
        },
      },
    ]);
  };

  const handleSelectPromo = async (promo) => {
    try {
      const promoResponse = await applyPromo(promo.code);

      if (!promoResponse.valid) {
        Alert.alert("Invalid Promo", "This promo code is not valid");
        return;
      }

      const promoData = promoResponse.promo;

      // Check if promo is still valid based on dates
      const now = new Date();
      const startDate = new Date(promoData.startDate);
      const endDate = new Date(promoData.endDate);

      if (now < startDate || now > endDate) {
        Alert.alert("Promo Expired", "This promo is no longer valid");
        return;
      }

      // Check if promo is active
      if (!promoData.active) {
        Alert.alert("Promo Inactive", "This promo is not active");
        return;
      }

      // Check usage limit
      if (promoData.usageLimit && promoData.usedCount >= promoData.usageLimit) {
        Alert.alert(
          "Promo Limit Reached",
          "This promo has reached its usage limit",
        );
        return;
      }

      // Set the selected promo with server data
      setSelectedPromo(promo);
      setAppliedPromoData(promoData);

      const totals = calculateTotals();
      const promoDiscount = calculatePromoDiscount(totals.subtotal);

      if (promoDiscount > 0) {
        Alert.alert(
          "Success",
          `Promo applied! You'll save ₱${promoDiscount.toFixed(2)}`,
        );
      }
    } catch (error) {
      console.error("Error applying promo:", error);
      Alert.alert("Promo Error", "Failed to apply promo. Please try again.");
    }
  };

  const handleRemovePromo = () => {
    setSelectedPromo(null);
    setAppliedPromoData(null);
    setPromoDiscountAmount(0);
  };

  const handleCheckout = async () => {
    const { itemCount } = calculateCartTotals();
    if (itemCount === 0) {
      Alert.alert("Empty Cart", "Your cart is empty. Add items to checkout.");
      return;
    }

    // Check if loyalty program is enabled when points are applied
    if (appliedPoints > 0 && !loyaltyConfig.enabled) {
      Alert.alert(
        "Loyalty Program Disabled",
        "Loyalty points cannot be used at this time",
      );
      return;
    }

    const totals = calculateTotals();
    const discountDetails = totals.discountDetails;

    // Get eligible BNPC items
    const eligibleBNPCItems = getEligibleBNPCItems();

    // Prepare detailed BNPC products data
    const bnpcProducts = eligibleBNPCItems.map((item) => {
      const normalizedItem = normalizeCartItem(item);
      const product = normalizedItem.product;
      const itemTotal = normalizedItem.price * normalizedItem.selectedQuantity;

      return {
        productId: product._id,
        name: product.name,
        price: normalizedItem.price,
        salePrice: normalizedItem.salePrice,
        saleActive: normalizedItem.saleActive,
        quantity: normalizedItem.selectedQuantity,
        unit: product.unit || "pc",
        category: product.category?._id,
        categoryName: product.category?.categoryName,
        isBNPCEligible: true,
        requiresVerification: true,
        itemTotal: itemTotal,
      };
    });

    // Prepare detailed cart items
    const items = cart.map((item) => {
      const normalizedItem = normalizeCartItem(item);
      const product = normalizedItem.product;

      const userScope = getUserDiscountScope();
      const isBNPCEligible =
        isEligibleUser &&
        product.isBNPC &&
        !product.excludedFromDiscount &&
        ["PWD", "SENIOR"].includes(userScope);

      return {
        product: product._id,
        name: product.name,
        sku: product.sku || `PROD-${product._id.slice(-6)}`,
        quantity: normalizedItem.selectedQuantity,
        unitPrice: normalizedItem.price,
        salePrice: normalizedItem.salePrice,
        saleActive: normalizedItem.saleActive,
        isBNPCEligible: isBNPCEligible || false,
        isBNPCProduct: product.isBNPC || false,
        excludedFromDiscount: product.excludedFromDiscount || false,
        category: {
          id: product.category?._id,
          name: product.category?.categoryName,
          isBNPC: product.category?.isBNPC || false,
        },
        unit: product.unit || "pc",
        itemTotal: normalizedItem.price * normalizedItem.selectedQuantity,
      };
    });

    // Prepare detailed totals
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

    // Prepare detailed BNPC discount snapshot with real usage data
    const discountSnapshot = {
      eligible: discountDetails.eligible,
      eligibleItemsCount: discountDetails.eligibleItemsCount || 0,
      bnpcEligibleSubtotal: discountDetails.bnpcEligibleSubtotal || 0,
      cappedBNPCAmount: discountDetails.cappedBNPCAmount || 0,
      discountApplied: discountDetails.discountApplied || 0,
      remainingPurchaseCap: discountDetails.remainingPurchaseCap || BNPC_PURCHASE_CAP,
      remainingDiscountCap: discountDetails.remainingDiscountCap || BNPC_DISCOUNT_CAP,
      weeklyPurchaseUsed: discountDetails.weeklyPurchaseUsed || 0,
      weeklyDiscountUsed: discountDetails.weeklyDiscountUsed || 0,
      weekStart: discountDetails.weekStart,
      weekEnd: discountDetails.weekEnd,
      reason: discountDetails.reason || null,
    };

    // Prepare detailed weekly usage from API data
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

    // Prepare promo data if applied
    const promoData = selectedPromo
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
          appliedPromoData: appliedPromoData,
        }
      : null;

    // Prepare loyalty points data with config
    const loyaltyPointsData =
      totals.loyaltyDiscount > 0
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

    // Points earned from this purchase
    const pointsEarned = calculatePointsEarned(totals.finalTotal);

    // Prepare user eligibility details
    const userEligibilityDetails = {
      isPWD: userEligibility.isPWD,
      isSenior: userEligibility.isSenior,
      verified: isEligibleUser,
      verificationIdType: eligibilityStatus?.idType || null,
      discountScope: getUserDiscountScope(),
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
    };

    // Final checkout payload with all details
    const checkoutData = {
      // User information
      user: userState.user?.userId || null,
      userType: userState.user?.userId ? "user" : "guest",
      userEmail: userState.user?.email || null,
      userName: userState.user?.name || null,

      // Cart items
      items: items,
      totalItems: itemCount,

      // BNPC specific data
      bnpcProducts: bnpcProducts,
      hasBNPCItems: bnpcProducts.length > 0,

      // Totals and discounts
      totals: checkoutTotals,
      discountBreakdown: {
        bnpcDiscount: totals.bnpcDiscount,
        promoDiscount: totals.promoDiscount,
        loyaltyDiscount: totals.loyaltyDiscount,
        totalDiscount: checkoutTotals.discountTotal,
      },

      // Discount calculations and snapshots with real usage data
      discountSnapshot: discountSnapshot,
      weeklyUsageSnapshot: weeklyUsageSnapshot,

      // User eligibility with current usage
      userEligibility: userEligibilityDetails,

      // Customer verification (for eligible users)
      customerVerification: isEligibleUser
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

      // Promo data (if applied)
      promo: promoData,

      // Loyalty points (if used)
      loyaltyPoints: loyaltyPointsData,

      // Points earned from this purchase
      pointsEarned: pointsEarned,

      // Original cart reference
      cartSnapshot: {
        itemCount: cart.length,
        totalValue: totals.subtotal,
        items: cart.map((item) => ({
          productId: item.product?._id || item._id,
          name: item.product?.name || item.name,
          quantity: item.selectedQuantity || item.qty,
        })),
      },
    };

    console.log("Checkout payload:", JSON.stringify(checkoutData, null, 2));

    try {
      const token = userState.role === "user" ? await getToken() : null;
      const queue = await checkout(checkoutData);
      navigation.navigate("Shared", {
        screen: "QR",
        params: { ...queue, token },
      });
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert("Checkout Failed", error.message || "Please try again");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently added";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
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
      const startDate = new Date(start);
      const endDate = new Date(end);
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    } catch {
      return "";
    }
  };

  const renderCartItem = (item) => {
    const normalizedItem = normalizeCartItem(item);
    const product = normalizedItem.product;
    const currentPrice =
      product.saleActive && product.salePrice
        ? product.salePrice
        : normalizedItem.price;
    const itemTotal = currentPrice * normalizedItem.selectedQuantity;

    const userScope = getUserDiscountScope();
    const isBNPCEligible =
      isEligibleUser &&
      product.isBNPC &&
      !product.excludedFromDiscount &&
      ["PWD", "SENIOR"].includes(userScope);

    return (
      <View key={normalizedItem._id} style={styles.cartItem}>
        <Image
          source={{
            uri:
              normalizedItem.images?.[0]?.url ||
              product.images?.[0]?.url ||
              "https://via.placeholder.com/100",
          }}
          style={styles.itemImage}
          resizeMode="cover"
        />

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {normalizedItem.name}
          </Text>

          {product.isBNPC && (
            <View style={styles.bnpcBadgeContainer}>
              <View style={styles.bnpcBadge}>
                <Text style={styles.bnpcBadgeText}>BNPC</Text>
              </View>
              {isBNPCEligible && (
                <Text style={styles.discountEligibleText}>
                  Eligible for 5% discount
                </Text>
              )}
              {product.isBNPC && !isBNPCEligible && isEligibleUser && (
                <Text style={styles.discountIneligibleText}>
                  Not eligible for discount
                </Text>
              )}
            </View>
          )}

          <View style={styles.priceRow}>
            {product.saleActive && product.salePrice ? (
              <>
                <Text style={styles.salePrice}>
                  ₱{product.salePrice.toFixed(2)}
                </Text>
                <Text style={styles.originalPriceText}>
                  ₱{product.price.toFixed(2)}
                </Text>
                <View style={styles.saleBadge}>
                  <Text style={styles.saleBadgeText}>SALE</Text>
                </View>
              </>
            ) : (
              <Text style={styles.itemPrice}>
                ₱{normalizedItem.price.toFixed(2)}
              </Text>
            )}
            <Text style={styles.itemUnit}>per {product.unit || "pc"}</Text>
          </View>

          <Text style={styles.itemDate}>
            Added {formatDate(normalizedItem.dateAdded)}
          </Text>
        </View>

        <View style={styles.itemActions}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() =>
                updateQuantity(
                  normalizedItem._id,
                  normalizedItem.selectedQuantity - 1,
                )
              }
            >
              <MaterialCommunityIcons name="minus" size={18} color="#666" />
            </TouchableOpacity>

            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyText}>
                {normalizedItem.selectedQuantity}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() =>
                updateQuantity(
                  normalizedItem._id,
                  normalizedItem.selectedQuantity + 1,
                )
              }
            >
              <MaterialCommunityIcons name="plus" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.itemTotal}>
            <Text style={styles.itemTotalText}>₱{itemTotal.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeItem(normalizedItem._id)}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={20}
              color="#f44336"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const totals = calculateTotals();
  const discountDetails = totals.discountDetails;
  const { itemCount: displayItemCount } = calculateCartTotals();
  const pointsEarned = calculatePointsEarned(totals.finalTotal);
  const maxPointsAllowed = Math.floor(
    (totals.afterOtherDiscounts * (loyaltyConfig.maxRedeemPercent / 100)) /
      loyaltyConfig.pointsToCurrencyRate,
  );

  // Calculate progress percentages for display
  const purchaseProgress = (weeklyUsage.bnpcAmountUsed / BNPC_PURCHASE_CAP) * 100;
  const discountProgress = (weeklyUsage.discountUsed / BNPC_DISCOUNT_CAP) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>My Cart</Text>
          <Text style={styles.subtitle}>
            {displayItemCount} item{displayItemCount !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearAllItems}
          disabled={cart.length === 0}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={22}
            color={cart.length === 0 ? "#ccc" : "#f44336"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00A86B"
          />
        }
      >
        {cart.length > 0 && (
          <View style={styles.eligibilityCard}>
            <View style={styles.eligibilityHeader}>
              {isEligibleUser ? (
                <>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={22}
                    color="#00A86B"
                  />
                  <Text style={styles.eligibilityTitle}>
                    You're eligible for BNPC discounts!
                  </Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="shield-off"
                    size={22}
                    color="#999"
                  />
                  <Text style={styles.eligibilityTitle}>Regular customer</Text>
                </>
              )}
            </View>
            <Text style={styles.eligibilityText}>
              {isEligibleUser
                ? `As a ${userEligibility.isPWD ? "PWD" : "Senior Citizen"}, you get 5% off on eligible BNPC items (up to ₱125/week)`
                : "Sign up for PWD/Senior benefits to get discounts on BNPC items"}
            </Text>
            
            {/* Weekly Usage Progress */}
            {isEligibleUser && (
              <View style={styles.weeklyProgressContainer}>
                <View style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Purchase Cap</Text>
                    <Text style={styles.progressValue}>
                      ₱{weeklyUsage.bnpcAmountUsed.toFixed(0)} / ₱{BNPC_PURCHASE_CAP}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${Math.min(purchaseProgress, 100)}%`,
                          backgroundColor: purchaseProgress >= 100 ? '#f44336' : '#00A86B'
                        }
                      ]} 
                    />
                  </View>
                </View>
                
                <View style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Discount Cap</Text>
                    <Text style={styles.progressValue}>
                      ₱{weeklyUsage.discountUsed.toFixed(0)} / ₱{BNPC_DISCOUNT_CAP}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${Math.min(discountProgress, 100)}%`,
                          backgroundColor: discountProgress >= 100 ? '#f44336' : '#00A86B'
                        }
                      ]} 
                    />
                  </View>
                </View>
                
                {weeklyUsage.weekStart && weeklyUsage.weekEnd && (
                  <Text style={styles.weekRange}>
                    Week: {formatWeekRange(weeklyUsage.weekStart, weeklyUsage.weekEnd)}
                  </Text>
                )}
              </View>
            )}
            
            {isEligibleUser && discountDetails.eligibleItemsCount > 0 && (
              <Text style={styles.eligibilityDebug}>
                {discountDetails.eligibleItemsCount} BNPC item(s) eligible for
                5% discount on total
              </Text>
            )}
          </View>
        )}

        {cart.length > 0 ? (
          <View style={styles.cartItemsContainer}>
            {cart.map(renderCartItem)}
          </View>
        ) : (
          <View style={styles.emptyCart}>
            <MaterialCommunityIcons name="cart-off" size={80} color="#ddd" />
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
                size={20}
                color="#fff"
              />
              <Text style={styles.scanButtonText}>Scan Products</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Promo Selection Section */}
        {cart.length > 0 && (
          <View style={styles.promoCard}>
            <View style={styles.promoHeader}>
              <MaterialCommunityIcons
                name="tag-multiple"
                size={22}
                color="#FF9800"
              />
              <Text style={styles.promoTitle}>Apply Promo</Text>
            </View>

            {selectedPromo ? (
              <View style={styles.appliedPromo}>
                <View style={styles.promoInfo}>
                  <MaterialCommunityIcons
                    name="ticket-percent"
                    size={20}
                    color="#4CAF50"
                  />
                  <View style={styles.promoDetails}>
                    <Text style={styles.promoCode}>{selectedPromo.code}</Text>
                    <Text style={styles.promoName}>
                      {selectedPromo.promoName?.promo || selectedPromo.name}
                    </Text>
                    <Text style={styles.promoDiscount}>
                      {appliedPromoData?.promoType === "percentage"
                        ? `${appliedPromoData?.value}% off`
                        : `₱${appliedPromoData?.value} off`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removePromoButton}
                  onPress={handleRemovePromo}
                >
                  <Text style={styles.removePromoText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.promoList}>
                {promo.map((promoItem) => (
                  <TouchableOpacity
                    key={promoItem._id}
                    style={styles.promoItem}
                    onPress={() => handleSelectPromo(promoItem)}
                  >
                    <MaterialCommunityIcons
                      name="ticket"
                      size={20}
                      color="#00A86B"
                    />
                    <View style={styles.promoItemDetails}>
                      <Text style={styles.promoItemCode}>{promoItem.code}</Text>
                      <Text style={styles.promoItemName}>
                        {promoItem.promoName?.promo}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Loyalty Points Section */}
        {cart.length > 0 && loyaltyConfig.enabled && (
          <View style={styles.loyaltyCard}>
            <View style={styles.loyaltyHeader}>
              <MaterialCommunityIcons name="trophy" size={22} color="#FFD700" />
              <Text style={styles.loyaltyTitle}>Loyalty Points</Text>
            </View>

            <View style={styles.pointsBalanceContainer}>
              <Text style={styles.pointsBalanceLabel}>Available Points:</Text>
              <Text style={styles.pointsBalanceValue}>{availablePoints}</Text>
            </View>

            {appliedPoints > 0 ? (
              <View style={styles.appliedPointsContainer}>
                <View style={styles.appliedPointsInfo}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color="#4CAF50"
                  />
                  <View style={styles.appliedPointsDetails}>
                    <Text style={styles.appliedPointsText}>
                      {appliedPoints} points applied
                    </Text>
                    <Text style={styles.appliedPointsValue}>
                      -₱{pointsDiscount.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removePointsButton}
                  onPress={handleRemoveLoyaltyPoints}
                >
                  <Text style={styles.removePointsText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.loyaltyInputContainer}>
                  <TextInput
                    style={styles.loyaltyInput}
                    placeholder="Enter points to use"
                    value={loyaltyPoints}
                    onChangeText={handleLoyaltyPointsChange}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={[
                      styles.applyLoyaltyButton,
                      (!loyaltyPoints.trim() || !loyaltyConfig.enabled) &&
                        styles.applyLoyaltyButtonDisabled,
                    ]}
                    onPress={handleApplyLoyaltyPoints}
                    disabled={!loyaltyPoints.trim() || !loyaltyConfig.enabled}
                  >
                    <Text style={styles.applyLoyaltyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>

                {loyaltyPoints && (
                  <Text style={styles.loyaltyInfo}>
                    Max: {maxPointsAllowed} points (₱
                    {(
                      maxPointsAllowed * loyaltyConfig.pointsToCurrencyRate
                    ).toFixed(2)}
                    )
                  </Text>
                )}
              </>
            )}

            <View style={styles.pointsEarnContainer}>
              <MaterialCommunityIcons name="gift" size={16} color="#FFD700" />
              <Text style={styles.pointsEarnText}>
                You'll earn {pointsEarned} points with this purchase
                {loyaltyConfig.earnRate > 0 &&
                  ` (₱1 = ${loyaltyConfig.earnRate} pts)`}
              </Text>
            </View>
          </View>
        )}

        {cart.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                ₱{totals.subtotal.toFixed(2)}
              </Text>
            </View>

            {/* BNPC Discount Section */}
            {isEligibleUser && discountDetails.eligibleItemsCount > 0 && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={styles.discountSectionTitle}>
                  BNPC Discount (5% on total)
                </Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Eligible BNPC items</Text>
                  <Text style={styles.detailValue}>
                    {discountDetails.eligibleItemsCount} items
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Eligible items total</Text>
                  <Text style={styles.detailValue}>
                    ₱{discountDetails.bnpcEligibleSubtotal.toFixed(2)}
                  </Text>
                </View>

                {discountDetails.bnpcEligibleSubtotal >
                  discountDetails.cappedBNPCAmount && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      After weekly purchase cap
                    </Text>
                    <Text style={styles.detailValue}>
                      ₱{discountDetails.cappedBNPCAmount.toFixed(2)}
                      <Text style={styles.capNote}>
                        {" "}
                        (₱{discountDetails.remainingPurchaseCap?.toFixed(
                          2,
                        )}{" "}
                        remaining)
                      </Text>
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <View style={styles.discountRateContainer}>
                    <MaterialCommunityIcons
                      name="percent"
                      size={14}
                      color="#00A86B"
                    />
                    <Text style={styles.detailLabel}>5% discount on total</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    -₱{(discountDetails.cappedBNPCAmount * 0.05).toFixed(2)}
                  </Text>
                </View>

                {discountDetails.discountApplied <
                  discountDetails.cappedBNPCAmount * 0.05 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      After weekly discount cap
                    </Text>
                    <Text style={styles.detailValue}>
                      -₱{discountDetails.discountApplied.toFixed(2)}
                      <Text style={styles.capNote}>
                        {" "}
                        (₱{discountDetails.remainingDiscountCap?.toFixed(
                          2,
                        )}{" "}
                        remaining)
                      </Text>
                    </Text>
                  </View>
                )}

                {discountDetails.discountApplied > 0 && (
                  <View style={styles.summaryRow}>
                    <Text
                      style={[styles.summaryLabel, styles.bnpcDiscountLabel]}
                    >
                      BNPC Discount
                    </Text>
                    <Text
                      style={[styles.summaryValue, styles.bnpcDiscountValue]}
                    >
                      -₱{discountDetails.discountApplied.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={styles.weeklySummary}>
                  <Text style={styles.weeklySummaryText}>
                    Weekly BNPC purchase: ₱
                    {discountDetails.weeklyPurchaseUsed?.toFixed(2)} / ₱{BNPC_PURCHASE_CAP}
                  </Text>
                  <Text style={styles.weeklySummaryText}>
                    Weekly BNPC discount: ₱
                    {discountDetails.weeklyDiscountUsed?.toFixed(2)} / ₱{BNPC_DISCOUNT_CAP}
                  </Text>
                </View>
              </>
            )}

            {/* Promo Discount */}
            {selectedPromo && totals.promoDiscount > 0 && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={styles.discountSectionTitle}>Promo Discount</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{selectedPromo.code}</Text>
                  <Text style={styles.detailValue}>
                    {appliedPromoData?.promoType === "percentage"
                      ? `${appliedPromoData?.value}% off`
                      : `₱${appliedPromoData?.value} off`}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, styles.promoDiscountLabel]}
                  >
                    Promo Discount
                  </Text>
                  <Text
                    style={[styles.summaryValue, styles.promoDiscountValue]}
                  >
                    -₱{totals.promoDiscount.toFixed(2)}
                  </Text>
                </View>
              </>
            )}

            {/* Loyalty Points Discount */}
            {totals.loyaltyDiscount > 0 && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={styles.discountSectionTitle}>Loyalty Points</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {totals.loyaltyPointsUsed} points used
                  </Text>
                  <Text style={styles.detailValue}>
                    ₱{loyaltyConfig.pointsToCurrencyRate} per point
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Max allowed</Text>
                  <Text style={styles.detailValue}>
                    {loyaltyConfig.maxRedeemPercent}% of order
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, styles.loyaltyDiscountLabel]}
                  >
                    Points Discount
                  </Text>
                  <Text
                    style={[styles.summaryValue, styles.loyaltyDiscountValue]}
                  >
                    -₱{totals.loyaltyDiscount.toFixed(2)}
                  </Text>
                </View>
              </>
            )}

            {!discountDetails.eligible &&
              discountDetails.reason &&
              isEligibleUser && (
                <>
                  <View style={styles.sectionDivider} />
                  <View style={styles.noDiscountContainer}>
                    <MaterialCommunityIcons
                      name="information"
                      size={16}
                      color="#999"
                    />
                    <Text style={styles.noDiscountText}>
                      {discountDetails.reason}
                    </Text>
                  </View>
                </>
              )}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₱{totals.finalTotal.toFixed(2)}
              </Text>
            </View>

            {(discountDetails.discountApplied > 0 ||
              totals.promoDiscount > 0 ||
              totals.loyaltyDiscount > 0) && (
              <View style={styles.savingsContainer}>
                <MaterialCommunityIcons
                  name="piggy-bank"
                  size={16}
                  color="#00A86B"
                />
                <Text style={styles.savingsText}>
                  Total savings: ₱
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

      {cart.length > 0 && (
        <View style={styles.checkoutBar}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total:</Text>
            <Text style={styles.totalAmount}>
              ₱{totals.finalTotal.toFixed(2)}
            </Text>
            {(discountDetails.discountApplied > 0 ||
              totals.promoDiscount > 0 ||
              totals.loyaltyDiscount > 0) && (
              <Text style={styles.originalPrice}>
                Was: ₱{totals.subtotal.toFixed(2)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cart-check" size={22} color="#fff" />
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  eligibilityCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eligibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eligibilityTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginLeft: 10,
  },
  eligibilityText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  eligibilityDebug: {
    fontSize: 12,
    color: "#00A86B",
    fontWeight: "600",
    marginTop: 4,
  },
  weeklyProgressContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  progressItem: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: "#666",
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  weekRange: {
    fontSize: 11,
    color: "#999",
    marginTop: 8,
    fontStyle: "italic",
  },
  cartItemsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
    lineHeight: 20,
  },
  bnpcBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
    flexWrap: "wrap",
  },
  bnpcBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bnpcBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
  },
  discountEligibleText: {
    fontSize: 11,
    color: "#00A86B",
    fontWeight: "600",
  },
  discountIneligibleText: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  salePrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00A86B",
  },
  originalPriceText: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
  },
  saleBadge: {
    backgroundColor: "#f44336",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saleBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00A86B",
  },
  itemUnit: {
    fontSize: 12,
    color: "#888",
  },
  itemDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  itemActions: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 4,
  },
  qtyButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyDisplay: {
    width: 40,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  itemTotal: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffebee",
    marginTop: 8,
  },
  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#666",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#00A86B",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Promo Card
  promoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginLeft: 10,
  },
  appliedPromo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f9f5",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  promoInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  promoDetails: {
    marginLeft: 12,
  },
  promoCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00A86B",
  },
  promoName: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  promoDiscount: {
    fontSize: 13,
    color: "#FF9800",
    fontWeight: "600",
    marginTop: 2,
  },
  removePromoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  removePromoText: {
    color: "#f44336",
    fontSize: 14,
    fontWeight: "600",
  },
  promoList: {
    gap: 12,
  },
  promoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  promoItemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  promoItemCode: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  promoItemName: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  // Loyalty Card
  loyaltyCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loyaltyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  loyaltyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginLeft: 10,
  },
  pointsBalanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  pointsBalanceLabel: {
    fontSize: 14,
    color: "#666",
  },
  pointsBalanceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  appliedPointsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f9f5",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c8e6c9",
    marginBottom: 12,
  },
  appliedPointsInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appliedPointsDetails: {
    marginLeft: 12,
  },
  appliedPointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  appliedPointsValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4CAF50",
    marginTop: 2,
  },
  removePointsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  removePointsText: {
    color: "#f44336",
    fontSize: 14,
    fontWeight: "600",
  },
  loyaltyInputContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  loyaltyInput: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  applyLoyaltyButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  applyLoyaltyButtonDisabled: {
    backgroundColor: "#ccc",
  },
  applyLoyaltyButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  loyaltyInfo: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
    fontStyle: "italic",
  },
  pointsEarnContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  pointsEarnText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  // Order Summary
  summaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 116,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#666",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  discountSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
  discountRateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bnpcDiscountLabel: {
    fontWeight: "700",
    color: "#000",
  },
  bnpcDiscountValue: {
    color: "#00A86B",
    fontWeight: "700",
  },
  promoDiscountLabel: {
    fontWeight: "700",
    color: "#000",
  },
  promoDiscountValue: {
    color: "#FF9800",
    fontWeight: "700",
  },
  loyaltyDiscountLabel: {
    fontWeight: "700",
    color: "#000",
  },
  loyaltyDiscountValue: {
    color: "#FFD700",
    fontWeight: "700",
  },
  capNote: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  weeklySummary: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  weeklySummaryText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  noDiscountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  noDiscountText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    flex: 1,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#00A86B",
  },
  savingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f0f9f5",
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 14,
    color: "#00A86B",
    fontWeight: "600",
  },
  // Checkout Bar
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalContainer: {
    flex: 1,
  },
  totalText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#00A86B",
  },
  checkoutButton: {
    flex: 1,
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginLeft: 16,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CartScreen;