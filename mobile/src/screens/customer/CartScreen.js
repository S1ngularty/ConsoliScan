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

// Mock weekly usage tracker - in production, fetch from API
const mockWeeklyUsage = {
  bnpcAmountUsed: 0,
  discountUsed: 0,
  weekStart: "2024-01-15",
  weekEnd: "2024-01-21",
};

const CartScreen = ({ navigation, route }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState("");
  const [weeklyUsage, setWeeklyUsage] = useState(mockWeeklyUsage);
  const eligibilityStatus = useSelector((state) => state.auth.eligible);
  const userState = useSelector((state) => state.auth);
  const [userEligibility, setUserEligibility] = useState({
    isPWD: false,
    isSenior: false,
  });

  const dispatch = useDispatch();

  const { cart, itemCount, promo } = useSelector((state) => state.cart);
  // console.log(promo, cart);

  const isEligibleUser = eligibilityStatus?.isVerified;

  useEffect(() => {
    userState.role === "user" && dispatch(getCartFromServer());
  }, [userState.role]);

  useEffect(() => {
    if (eligibilityStatus?.idType === "senior") {
      setUserEligibility((prev) => ({ ...prev, isSenior: true }));
    }
    if (eligibilityStatus?.idType === "pwd") {
      setUserEligibility((prev) => ({ ...prev, isPWD: true }));
    }
  }, [eligibilityStatus]);

  // Available promos from the LOG data
  const availablePromos = [
    {
      _id: "698ab7496df9cbd7f5fdcb3b",
      code: "PROMO-YWABWU83",
      name: "BUY 1 GET NONE",
      type: "percentage",
      value: 25,
      scope: "category",
      targetIds: [
        "6989f666d310e45067710e70",
        "6989f666d310e45067710e6f",
        "6989f6f2d310e45067710e8a",
        "6989f6f2d310e45067710e89",
        "6989f8e9f212b85e9b2bf7e9",
      ],
      minPurchase: 0,
      startDate: "2026-02-10T00:00:00.000Z",
      endDate: "2026-04-10T00:00:00.000Z",
      usageLimit: 1000,
      usedCount: 300,
      active: true,
    },
    {
      _id: "698ae5c10006555e22337a69",
      code: "PROMO-5GUBY2ZR",
      name: "SummerSale 20% off",
      type: "percentage",
      value: 20,
      scope: "product",
      targetIds: [
        "697218a0f58f7c6804de4b14",
        "697231bf94db4310e9900e25",
        "6981a260b29f902e9a8b0f4e",
        "6981a3b6b29f902e9a8b0f5f",
      ],
      minPurchase: 0,
      startDate: "2026-02-10T00:00:00.000Z",
      endDate: "2026-03-10T00:00:00.000Z",
      active: true,
    },
  ];

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

  // Step 1: Filter Eligible BNPC Items
  const getEligibleBNPCItems = () => {
    if (!isEligibleUser) return [];

    const userScope = getUserDiscountScope();
    if (!userScope) return [];

    return cart.filter((item) => {
      const normalizedItem = normalizeCartItem(item);
      const product = normalizedItem.product;
      // console.log(product);
      const isEligible =
        product.isBNPC &&
        !product.excludedFromDiscount &&
        ["PWD", "SENIOR"].includes(userScope);

      return isEligible;
    });
  };

  // Step 2: Compute BNPC Subtotal safely
  const calculateBNPCSubtotal = () => {
    const bnpcItems = cart.filter((item) => {
      const normalizedItem = normalizeCartItem(item);
      const product = normalizedItem.product;
      return product.isBNPC === true;
    });

    const subtotal = bnpcItems.reduce((sum, item) => {
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

  // Step 3 & 4: Apply Weekly Caps
  const calculateDiscountDetails = () => {
    const bnpcSubtotal = calculateBNPCSubtotal();

    if (!isEligibleUser) {
      return {
        eligible: false,
        discountApplied: 0,
        bnpcSubtotal: bnpcSubtotal,
        cappedBNPCAmount: 0,
        reason: "User not eligible for BNPC discounts",
      };
    }

    const eligibleItems = getEligibleBNPCItems();
    if (eligibleItems.length === 0) {
      return {
        eligible: false,
        discountApplied: 0,
        bnpcSubtotal: bnpcSubtotal,
        cappedBNPCAmount: 0,
        reason: "No eligible BNPC items in cart",
      };
    }

    const calculateBNPCSubtotalForItems = (items) => {
      return items.reduce((sum, item) => {
        const normalizedItem = normalizeCartItem(item);
        const price =
          normalizedItem.saleActive && normalizedItem.salePrice
            ? Number(normalizedItem.salePrice)
            : Number(normalizedItem.price) || 0;
        const quantity = Number(normalizedItem.selectedQuantity) || 1;
        return sum + price * quantity;
      }, 0);
    };

    const eligibleBNPCSubtotal = calculateBNPCSubtotalForItems(eligibleItems);
    const remainingPurchaseCap = Math.max(2500 - weeklyUsage.bnpcAmountUsed, 0);

    if (remainingPurchaseCap === 0) {
      return {
        eligible: false,
        discountApplied: 0,
        bnpcSubtotal: eligibleBNPCSubtotal,
        cappedBNPCAmount: 0,
        reason: "Weekly purchase cap reached (₱2,500)",
      };
    }

    const cappedBNPCAmount = Math.min(
      eligibleBNPCSubtotal,
      remainingPurchaseCap,
    );
    const rawDiscount = cappedBNPCAmount * 0.05;
    const remainingDiscountCap = Math.max(125 - weeklyUsage.discountUsed, 0);

    if (remainingDiscountCap === 0) {
      return {
        eligible: false,
        discountApplied: 0,
        bnpcSubtotal: eligibleBNPCSubtotal,
        cappedBNPCAmount,
        reason: "Weekly discount cap reached (₱125)",
      };
    }

    const discountApplied = Math.min(rawDiscount, remainingDiscountCap);

    return {
      eligible: true,
      discountApplied,
      bnpcSubtotal: eligibleBNPCSubtotal,
      cappedBNPCAmount,
      eligibleItemsCount: eligibleItems.length,
      remainingPurchaseCap,
      remainingDiscountCap,
      weeklyPurchaseUsed: weeklyUsage.bnpcAmountUsed + cappedBNPCAmount,
      weeklyDiscountUsed: weeklyUsage.discountUsed + discountApplied,
    };
  };

  // Calculate promo discount
  const calculatePromoDiscount = (subtotal) => {
    if (!selectedPromo) return 0;

    // Check if promo is still valid
    const now = new Date();
    const startDate = new Date(selectedPromo.startDate);
    const endDate = new Date(selectedPromo.endDate);

    if (now < startDate || now > endDate) {
      setSelectedPromo(null);
      Alert.alert("Promo Expired", "This promo is no longer valid");
      return 0;
    }

    // Check usage limit
    if (
      selectedPromo.usageLimit &&
      selectedPromo.usedCount >= selectedPromo.usageLimit
    ) {
      setSelectedPromo(null);
      Alert.alert(
        "Promo Limit Reached",
        "This promo has reached its usage limit",
      );
      return 0;
    }

    // Check minimum purchase
    if (subtotal < selectedPromo.minPurchase) {
      Alert.alert(
        "Minimum Purchase Required",
        `Minimum purchase of ₱${selectedPromo.minPurchase} required for this promo`,
      );
      return 0;
    }

    // Check if items are eligible for promo
    const eligibleItems = cart.filter((item) => {
      const normalizedItem = normalizeCartItem(item);
      const productId = normalizedItem.product._id;

      if (selectedPromo.scope === "product") {
        return selectedPromo.targetIds.includes(productId);
      } else if (selectedPromo.scope === "category") {
        const categoryId = normalizedItem.product.category?._id;
        return categoryId && selectedPromo.targetIds.includes(categoryId);
      }
      return true; // For global promos
    });

    if (eligibleItems.length === 0) {
      Alert.alert(
        "Promo Not Applicable",
        "No items in cart are eligible for this promo",
      );
      return 0;
    }

    // Calculate discount
    if (selectedPromo.type === "percentage") {
      return (subtotal * selectedPromo.value) / 100;
    } else {
      return selectedPromo.value;
    }
  };

  // Calculate loyalty points discount (max 30% of order total)
  const calculateLoyaltyPointsDiscount = (subtotal) => {
    const points = parseInt(loyaltyPoints) || 0;
    if (points <= 0) return 0;

    // Assuming 1 point = ₱1 value
    const pointsValue = points;
    const maxPointsValue = subtotal * 0.3; // Max 30% of subtotal

    return Math.min(pointsValue, maxPointsValue);
  };

  // Calculate all totals
  const calculateTotals = () => {
    const discountDetails = calculateDiscountDetails();
    const { subtotal } = calculateCartTotals();
    const promoDiscount = calculatePromoDiscount(subtotal);
    const loyaltyDiscount = calculateLoyaltyPointsDiscount(subtotal);

    const finalTotal = Math.max(
      0,
      subtotal -
        discountDetails.discountApplied -
        promoDiscount -
        loyaltyDiscount,
    );

    return {
      subtotal,
      bnpcDiscount: discountDetails.discountApplied,
      promoDiscount,
      loyaltyDiscount,
      finalTotal,
      discountDetails,
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      userState.role === "user" && (await dispatch(getCartFromServer()));
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
        },
      },
    ]);
  };

  const handleSelectPromo = (promo) => {
    setSelectedPromo(promo);

    const totals = calculateTotals();
    const promoDiscount = calculatePromoDiscount(totals.subtotal);

    if (promoDiscount > 0) {
      Alert.alert(
        "Success",
        `Promo applied! You'll save ₱${promoDiscount.toFixed(2)}`,
      );
    }
  };

  const handleRemovePromo = () => {
    setSelectedPromo(null);
  };

  const handleLoyaltyPointsChange = (text) => {
    // Allow only numbers
    const numericValue = text.replace(/[^0-9]/g, "");
    setLoyaltyPoints(numericValue);
  };

  const handleApplyLoyaltyPoints = () => {
    const points = parseInt(loyaltyPoints) || 0;
    if (points <= 0) {
      Alert.alert("Invalid Points", "Please enter valid loyalty points");
      return;
    }

    const totals = calculateTotals();
    const maxPointsValue = totals.subtotal * 0.3;
    const pointsValue = points; // Assuming 1 point = ₱1

    if (pointsValue > maxPointsValue) {
      Alert.alert(
        "Max Limit Exceeded",
        `You can only use points worth ₱${maxPointsValue.toFixed(2)} (30% of order total)`,
      );
      setLoyaltyPoints(Math.floor(maxPointsValue).toString());
    } else {
      Alert.alert(
        "Points Applied",
        `Using ${points} points (₱${pointsValue.toFixed(2)})`,
      );
    }
  };

  const handleCheckout = async () => {
    const { itemCount } = calculateCartTotals();
    if (itemCount === 0) {
      Alert.alert("Empty Cart", "Your cart is empty. Add items to checkout.");
      return;
    }
    const totals = calculateTotals();
    const discountDetails = totals.discountDetails;

    const bnpcProducts = cart
      .filter((item) => {
        const normalizedItem = normalizeCartItem(item);
        const product = normalizedItem.product;
        return product.isBNPC === true;
      })
      .map((item) => {
        const normalizedItem = normalizeCartItem(item);
        const product = normalizedItem.product;
        return {
          productId: product._id,
          name: product.name,
          price: normalizedItem.price,
          quantity: normalizedItem.selectedQuantity,
          requiresVerification: true,
        };
      });

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
        isBNPCEligible: isBNPCEligible || false,
        isBNPCProduct: product.isBNPC || false,
        category: product.category,
      };
    });

    const checkoutTotals = {
      subtotal: totals.subtotal,
      bnpcSubtotal: discountDetails.bnpcSubtotal || 0,
      discountTotal:
        (totals.bnpcDiscount || 0) +
        (totals.promoDiscount || 0) +
        (totals.loyaltyDiscount || 0),
      finalTotal: totals.finalTotal,
    };

    const discountSnapshot = {
      eligible: discountDetails.eligible,
      eligibleItemsCount: discountDetails.eligibleItemsCount || 0,
      bnpcSubtotal: discountDetails.bnpcSubtotal || 0,
      cappedBNPCAmount: discountDetails.cappedBNPCAmount || 0,
      discountApplied: discountDetails.discountApplied || 0,
      weeklyDiscountUsed:
        discountDetails.weeklyDiscountUsed || weeklyUsage.discountUsed,
      weeklyPurchaseUsed:
        discountDetails.weeklyPurchaseUsed || weeklyUsage.bnpcAmountUsed,
      remainingDiscountCap:
        discountDetails.remainingDiscountCap || 125 - weeklyUsage.discountUsed,
      remainingPurchaseCap:
        discountDetails.remainingPurchaseCap ||
        2500 - weeklyUsage.bnpcAmountUsed,
    };

    const checkoutData = {
      user: userState.user?.userId || null,
      userType: userState.user?.userId ? "user" : "guest",
      items,
      bnpcProducts,
      totals: checkoutTotals,
      discountSnapshot,
      userEligibility: {
        isPWD: userEligibility.isPWD,
        isSenior: userEligibility.isSenior,
        verified: isEligibleUser,
      },
      customerVerification: isEligibleUser
        ? {
            type: userEligibility.isPWD
              ? "pwd"
              : userEligibility.isSenior
                ? "senior"
                : null,
            verified: isEligibleUser,
            verificationSource: "system",
          }
        : null,
      promo: selectedPromo
        ? {
            code: selectedPromo.code,
            discountAmount: totals.promoDiscount,
            type: selectedPromo.type,
            name: selectedPromo.name,
          }
        : null,
      loyaltyPoints: {
        pointsUsed: parseInt(loyaltyPoints) || 0,
        discountAmount: totals.loyaltyDiscount,
      },
      weeklyUsageSnapshot: {
        bnpcAmountUsed: discountSnapshot.weeklyPurchaseUsed,
        discountUsed: discountSnapshot.weeklyDiscountUsed,
      },
    };

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

  const renderCartItem = (item) => {
    const normalizedItem = normalizeCartItem(item);
    const product = normalizedItem.product;
    const currentPrice =
      product.saleActive && product.salePrice
        ? product.salePrice
        : normalizedItem.price;
    const itemTotal = currentPrice * normalizedItem.selectedQuantity;

    const totals = calculateTotals();
    const userScope = getUserDiscountScope();
    const isBNPCEligible =
      totals.discountDetails.eligible &&
      product.isBNPC &&
      !product.excludedFromDiscount &&
      ["PWD", "SENIOR"].includes(userScope);

    const bnpcItemDiscount = isBNPCEligible ? itemTotal * 0.05 : 0;

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

          {isBNPCEligible && bnpcItemDiscount > 0 && (
            <View style={styles.discountRow}>
              <MaterialCommunityIcons
                name="percent"
                size={12}
                color="#00A86B"
              />
              <Text style={styles.discountText}>
                5% off: ₱{bnpcItemDiscount.toFixed(2)}
              </Text>
            </View>
          )}

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
            {bnpcItemDiscount > 0 ? (
              <>
                <Text style={styles.originalPrice}>
                  ₱{itemTotal.toFixed(2)}
                </Text>
                <Text style={styles.discountedPrice}>
                  ₱{(itemTotal - bnpcItemDiscount).toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={styles.itemTotalText}>₱{itemTotal.toFixed(2)}</Text>
            )}
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
            {isEligibleUser && (
              <Text style={styles.eligibilityDebug}>
                User scope: {getUserDiscountScope() || "None"}
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
                    <Text style={styles.promoName}>{selectedPromo.name}</Text>
                    <Text style={styles.promoDiscount}>
                      {selectedPromo.type === "percentage"
                        ? `${selectedPromo.value}% off`
                        : `₱${selectedPromo.value} off`}
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
                {availablePromos.map((promo) => (
                  <TouchableOpacity
                    key={promo._id}
                    style={styles.promoItem}
                    onPress={() => handleSelectPromo(promo)}
                  >
                    <MaterialCommunityIcons
                      name="ticket"
                      size={20}
                      color="#00A86B"
                    />
                    <View style={styles.promoItemDetails}>
                      <Text style={styles.promoItemCode}>{promo.code}</Text>
                      <Text style={styles.promoItemName}>{promo.name}</Text>
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
        {cart.length > 0 && (
          <View style={styles.loyaltyCard}>
            <View style={styles.loyaltyHeader}>
              <MaterialCommunityIcons name="trophy" size={22} color="#FFD700" />
              <Text style={styles.loyaltyTitle}>Loyalty Points</Text>
            </View>

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
                  !loyaltyPoints.trim() && styles.applyLoyaltyButtonDisabled,
                ]}
                onPress={handleApplyLoyaltyPoints}
                disabled={!loyaltyPoints.trim()}
              >
                <Text style={styles.applyLoyaltyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {loyaltyPoints && (
              <Text style={styles.loyaltyInfo}>
                Max: ₱{(totals.subtotal * 0.3).toFixed(2)} (30% of order)
              </Text>
            )}

            <Text style={styles.earnPointsText}>
              You'll earn {Math.floor(totals.finalTotal / 10)} points with this
              purchase
            </Text>
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

            {discountDetails.eligible && discountDetails.bnpcSubtotal > 0 && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={styles.discountSectionTitle}>
                  {isEligibleUser && "Estimated"} BNPC Discount
                </Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Eligible BNPC items</Text>
                  <Text style={styles.detailValue}>
                    {discountDetails.eligibleItemsCount} items
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>BNPC subtotal</Text>
                  <Text style={styles.detailValue}>
                    ₱{discountDetails.bnpcSubtotal.toFixed(2)}
                  </Text>
                </View>

                {discountDetails.bnpcSubtotal >
                  discountDetails.cappedBNPCAmount && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>After weekly cap</Text>
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
                    <Text style={styles.detailLabel}>5% discount</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    -₱{(discountDetails.cappedBNPCAmount * 0.05).toFixed(2)}
                  </Text>
                </View>

                {discountDetails.discountApplied <
                  discountDetails.cappedBNPCAmount * 0.05 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>After discount cap</Text>
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

                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, styles.bnpcDiscountLabel]}>
                    {isEligibleUser && "Estimated"} Total BNPC Discount
                  </Text>
                  <Text style={[styles.summaryValue, styles.bnpcDiscountValue]}>
                    -₱{discountDetails.discountApplied.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.weeklySummary}>
                  <Text style={styles.weeklySummaryText}>
                    Weekly usage: ₱
                    {discountDetails.weeklyPurchaseUsed?.toFixed(2)} / ₱2,500
                    spent
                  </Text>
                  <Text style={styles.weeklySummaryText}>
                    Weekly discount: ₱
                    {discountDetails.weeklyDiscountUsed?.toFixed(2)} / ₱125 used
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
                    {selectedPromo.type === "percentage"
                      ? `${selectedPromo.value}% off`
                      : `₱${selectedPromo.value} off`}
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
            {loyaltyPoints && totals.loyaltyDiscount > 0 && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={styles.discountSectionTitle}>Loyalty Points</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{loyaltyPoints} points</Text>
                  <Text style={styles.detailValue}>₱1 per point</Text>
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

            {!discountDetails.eligible && discountDetails.reason && (
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
              <Text style={styles.totalLabel}>
                {isEligibleUser && "Estimated"} Total Amount
              </Text>
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
                  You save ₱
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
            {discountDetails.discountApplied > 0 && (
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
    color: "#888",
    fontStyle: "italic",
    marginTop: 4,
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
    fontStyle: "italic",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
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
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  discountText: {
    fontSize: 12,
    color: "#00A86B",
    fontWeight: "600",
  },
  itemDate: {
    fontSize: 12,
    color: "#888",
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
  originalPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#00A86B",
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
    marginBottom: 8,
    fontStyle: "italic",
  },
  earnPointsText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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
