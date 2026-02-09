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
  bnpcAmountUsed: 0, // Amount spent on BNPC this week
  discountUsed: 0, // Discount used this week
  weekStart: "2024-01-15",
  weekEnd: "2024-01-21",
};

const CartScreen = ({ navigation, route }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [weeklyUsage, setWeeklyUsage] = useState(mockWeeklyUsage);
  const eligibilityStatus = useSelector((state) => state.auth.eligible);
  const userState = useSelector((state) => state.auth);
  const [userEligibility, setUserEligibility] = useState({
    isPWD: false,
    isSenior: false,
  });

  const dispatch = useDispatch();

  // Get cart from Redux store
  const { cart, itemCount } = useSelector((state) => state.cart);
  console.log(cart)
  // Check if user is eligible for BNPC discounts
  const isEligibleUser = eligibilityStatus?.isVerified;

  useEffect(() => {
    // Fetch cart from server on mount
   userState.role ==="user" && dispatch(getCartFromServer());
  }, [userState.role]);

  useEffect(() => {
    // Set user eligibility based on auth status
    if (eligibilityStatus?.idType === "senior") {
      setUserEligibility((prev) => ({ ...prev, isSenior: true }));
    }
    if (eligibilityStatus?.idType === "pwd") {
      setUserEligibility((prev) => ({ ...prev, isPWD: true }));
    }
  }, [eligibilityStatus]);

  // Available vouchers
  const availableVouchers = [
    {
      code: "WELCOME10",
      discount: 10,
      type: "percentage",
      minSpend: 100,
      description: "10% off on first purchase",
    },
    {
      code: "SAVE50",
      discount: 50,
      type: "fixed",
      minSpend: 200,
      description: "Save ₱50 on orders above ₱200",
    },
  ];

  // =========================
  // HELPER FUNCTIONS FOR DATA SYNC - UPDATED
  // =========================

  // Normalize cart item for consistent data structure - UPDATED for new category structure
  const normalizeCartItem = (item) => {
    // Check if item is from server (has product nested) or local (flat)
    const product = item.product || item;
    const quantity = item.selectedQuantity || item.qty || 1;

    // Get BNPC fields from category object
    const category = product.category || {};

    // Extract all necessary fields
    return {
      _id: item._id || product._id,
      name: item.name || product.name,
      price: Number(item.price || product.price || 0),
      images: item.images || product.images || [],
      selectedQuantity: Number(quantity),
      qty: Number(quantity),
      dateAdded: item.dateAdded || new Date().toISOString(),

      // Product details for discount calculations - UPDATED
      product: {
        _id: product._id,
        name: product.name,
        price: Number(product.price || 0),
        // BNPC fields now come from category object
        isBNPC: category.isBNPC || false,
        excludedFromDiscount: product.excludedFromDiscount || false,
        discountScopes: category.applicableTo || [],
        bnpcCategory: category.bnpcCategory || "",
        unit: product.unit || "pc",
        images: product.images || [],
        // Keep reference to category for debugging
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
      const price = Number(normalizedItem.price) || 0;
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

  // =========================
  // BNPC DISCOUNT CALCULATION - UPDATED
  // =========================

  // Get user discount scope based on eligibility
  const getUserDiscountScope = () => {
    if (userEligibility.isPWD) return "PWD";
    if (userEligibility.isSenior) return "SENIOR";
    return null;
  };

  // Step 1: Filter Eligible BNPC Items - FIXED
  const getEligibleBNPCItems = () => {
    if (!isEligibleUser) return [];

    const userScope = getUserDiscountScope();
    if (!userScope) return [];

    // console.log("Checking BNPC eligibility for user scope:", userScope);

    return cart.filter((item) => {
      const normalizedItem = normalizeCartItem(item);
      const product = normalizedItem.product;

      // Debug log
      // console.log(`Item: ${product.name}`);
      // console.log(`  - isBNPC: ${product.isBNPC}`);
      // console.log(`  - excludedFromDiscount: ${product.excludedFromDiscount}`);
      // console.log(`  - discountScopes: ${JSON.stringify(product.discountScopes)}`);
      // console.log(`  - userScope: ${userScope}`);
      // console.log(`  - includes user scope: ${product.discountScopes?.includes(userScope)}`);

      const isEligible =
        product.isBNPC &&
        !product.excludedFromDiscount &&
        product.discountScopes?.includes(userScope);

      // console.log(`  - Final eligibility: ${isEligible}`);

      return isEligible;
    });
  };

// Step 2: Compute BNPC Subtotal safely - FIXED FOR ALL CUSTOMERS
const calculateBNPCSubtotal = () => {
  const bnpcItems = cart.filter((item) => {
    const normalizedItem = normalizeCartItem(item);
    const product = normalizedItem.product;
    return product.isBNPC === true;
  });

  const subtotal = bnpcItems.reduce((sum, item) => {
    const normalizedItem = normalizeCartItem(item);
    const price = Number(normalizedItem.price) || 0;
    const quantity = Number(normalizedItem.selectedQuantity) || 1;
    return sum + price * quantity;
  }, 0);

  return subtotal;
};
 // Step 3 & 4: Apply Weekly Caps - FIXED
const calculateDiscountDetails = () => {
  // Always calculate BNPC subtotal (for tracking)
  const bnpcSubtotal = calculateBNPCSubtotal();
  
  // For non-eligible users, just return tracking data
  if (!isEligibleUser) {
    return {
      eligible: false,
      discountApplied: 0,
      bnpcSubtotal: bnpcSubtotal, // Track BNPC subtotal even for non-eligible
      cappedBNPCAmount: 0,
      reason: "User not eligible for BNPC discounts",
    };
  }

  const eligibleItems = getEligibleBNPCItems();
  if (eligibleItems.length === 0) {
    return {
      eligible: false,
      discountApplied: 0,
      bnpcSubtotal: bnpcSubtotal, // Track BNPC subtotal
      cappedBNPCAmount: 0,
      reason: "No eligible BNPC items in cart",
    };
  }

  const eligibleBNPCSubtotal = calculateBNPCSubtotalForItems(eligibleItems);
  
  // Rest of your existing code...
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

  const cappedBNPCAmount = Math.min(eligibleBNPCSubtotal, remainingPurchaseCap);
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

// Add this helper function
const calculateBNPCSubtotalForItems = (items) => {
  return items.reduce((sum, item) => {
    const normalizedItem = normalizeCartItem(item);
    const price = Number(normalizedItem.price) || 0;
    const quantity = Number(normalizedItem.selectedQuantity) || 1;
    return sum + price * quantity;
  }, 0);
};

  // Calculate voucher discount
  const calculateVoucherDiscount = (subtotal) => {
    if (!appliedVoucher) return 0;

    const eligibleAmount = subtotal;

    if (eligibleAmount < appliedVoucher.minSpend) return 0;

    if (appliedVoucher.type === "percentage") {
      return (eligibleAmount * appliedVoucher.discount) / 100;
    } else {
      return appliedVoucher.discount;
    }
  };

  // Calculate all totals
  const calculateTotals = () => {
    const discountDetails = calculateDiscountDetails();
    const { subtotal } = calculateCartTotals();
    const voucherDiscount = calculateVoucherDiscount(subtotal);
    const finalTotal = Math.max(
      0,
      subtotal - discountDetails.discountApplied - voucherDiscount,
    );

    // console.log("\n=== Final Totals ===");
    // console.log("Subtotal:", subtotal);
    // console.log("BNPC Discount:", discountDetails.discountApplied);
    // console.log("Voucher Discount:", voucherDiscount);
    // console.log("Final Total:", finalTotal);

    return {
      subtotal,
      bnpcDiscount: discountDetails.discountApplied,
      voucherDiscount,
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
      // Find the item to get its correct structure
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
    userState.role ==="user" && debounceCartSync(dispatch);
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

  const handleApplyVoucher = () => {
    const totals = calculateTotals();

    if (!voucherCode.trim()) {
      Alert.alert("Invalid Code", "Please enter a voucher code");
      return;
    }

    const voucher = availableVouchers.find(
      (v) => v.code === voucherCode.toUpperCase(),
    );

    if (!voucher) {
      Alert.alert("Invalid Code", "Voucher code is not valid");
      return;
    }

    if (totals.subtotal < voucher.minSpend) {
      Alert.alert(
        "Minimum Spend Required",
        `Minimum spend of ₱${voucher.minSpend} required for this voucher`,
      );
      return;
    }

    setAppliedVoucher(voucher);

    const voucherDiscount = calculateVoucherDiscount(totals.subtotal);
    Alert.alert(
      "Success",
      `Voucher applied! You saved ₱${voucherDiscount.toFixed(2)}`,
    );
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
  };

 const handleCheckout = async () => {
  const { itemCount } = calculateCartTotals();
  if (itemCount === 0) {
    Alert.alert("Empty Cart", "Your cart is empty. Add items to checkout.");
    return;
  }
  const totals = calculateTotals();
  const discountDetails = totals.discountDetails;

  /* ======================
     EXTRACT BNPC PRODUCTS
  ====================== */
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
        bnpcCategory: product.bnpcCategory || "",
        discountScopes: product.discountScopes || [],
        requiresVerification: true,
      };
    });

  /* ======================
     SANITIZE CART ITEMS - UPDATED
  ====================== */
  const items = cart.map((item) => {
    const normalizedItem = normalizeCartItem(item);
    const product = normalizedItem.product;

    const userScope = getUserDiscountScope();
    const isBNPCEligible =
      isEligibleUser &&
      product.isBNPC &&
      !product.excludedFromDiscount &&
      product.discountScopes?.includes(userScope);

    return {
      product: product._id,
      name: product.name,
      sku: product.sku || `PROD-${product._id.slice(-6)}`,
      quantity: normalizedItem.selectedQuantity,
      unitPrice: normalizedItem.price,
      categoryType: product.bnpcCategory || null,
      isBNPCEligible: isBNPCEligible || false,
      isBNPCProduct: product.isBNPC || false,
      bnpcCategory: product.bnpcCategory || "",
      discountScopes: product.discountScopes || [],
      // Include category data for reference
      category: product.category,
    };
  });

  /* ======================
     FREEZE TOTALS - FIXED (ADD bnpcSubtotal)
  ====================== */
  const checkoutTotals = {
    subtotal: totals.subtotal,
    bnpcSubtotal: discountDetails.bnpcSubtotal || 0, // ADD THIS LINE
    discountTotal: (totals.bnpcDiscount || 0) + (totals.voucherDiscount || 0),
    finalTotal: totals.finalTotal,
  };

  /* ======================
     DISCOUNT SNAPSHOT
  ====================== */
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

  /* ======================
     FINAL CHECKOUT PAYLOAD - FIXED
  ====================== */
  const checkoutData = {
    user: userState.user?.userId || null,
    userType: userState.user?.userId ? "user" : "guest",
    items,
    bnpcProducts, // ADD BNPC products array
    totals: checkoutTotals,
    discountSnapshot,
    userEligibility: {
      isPWD: userEligibility.isPWD,
      isSenior: userEligibility.isSenior,
      verified: isEligibleUser,
    },
    // Add customer verification info for app users
    customerVerification: isEligibleUser ? {
      type: userEligibility.isPWD ? "pwd" : userEligibility.isSenior ? "senior" : null,
      verified: isEligibleUser,
      verificationSource: "system",
    } : null,
    voucher: appliedVoucher
      ? {
          code: appliedVoucher.code,
          discountAmount: totals.voucherDiscount || appliedVoucher.discount,
          type: appliedVoucher.type,
        }
      : null,
    weeklyUsageSnapshot: {
      bnpcAmountUsed: discountSnapshot.weeklyPurchaseUsed,
      discountUsed: discountSnapshot.weeklyDiscountUsed,
    },
  };

  console.log("Checkout payload:", JSON.stringify(checkoutData, null, 2));

  try {
    const token = userState.role === "user" ? await getToken() : null;
    console.log("token:", token);
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
    const itemTotal = normalizedItem.price * normalizedItem.selectedQuantity;

    const totals = calculateTotals();

    // Check if item is BNPC eligible
    const userScope = getUserDiscountScope();
    const isBNPCEligible =
      totals.discountDetails.eligible &&
      product.isBNPC &&
      !product.excludedFromDiscount &&
      product.discountScopes?.includes(userScope);

    const bnpcItemDiscount = isBNPCEligible ? itemTotal * 0.05 : 0;

    // Debug display
    // console.log(`Rendering item: ${product.name}`);
    // console.log(`  - isBNPC: ${product.isBNPC}`);
    // console.log(`  - discountScopes: ${JSON.stringify(product.discountScopes)}`);
    // console.log(`  - userScope: ${userScope}`);
    // console.log(`  - isEligible: ${isBNPCEligible}`);

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
              {!product.excludedFromDiscount &&
                product.discountScopes?.length > 0 && (
                  <Text style={styles.discountEligibleText}>
                    Eligible for {product.discountScopes?.join("/")} discount
                  </Text>
                )}
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>
              ₱{normalizedItem.price.toFixed(2)}
            </Text>
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

  // Debug summary
  // console.log("\n=== CART SUMMARY ===");
  // console.log("Cart items:", cart.length);
  // console.log("User eligible for BNPC:", isEligibleUser);
  // console.log("User scope:", getUserDiscountScope());
  // console.log("BNPC discount eligible:", discountDetails.eligible);
  // console.log("BNPC discount reason:", discountDetails.reason);
  // console.log("BNPC discount amount:", discountDetails.discountApplied);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
        {/* User Eligibility Banner */}
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

        {/* Cart Items */}
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

        {/* Voucher Section */}
        {cart.length > 0 && (
          <View style={styles.voucherCard}>
            <View style={styles.voucherHeader}>
              <MaterialCommunityIcons name="tag" size={22} color="#FF9800" />
              <Text style={styles.voucherTitle}>Apply Voucher</Text>
            </View>

            {appliedVoucher ? (
              <View style={styles.appliedVoucher}>
                <View style={styles.voucherInfo}>
                  <MaterialCommunityIcons
                    name="ticket-percent"
                    size={20}
                    color="#4CAF50"
                  />
                  <View style={styles.voucherDetails}>
                    <Text style={styles.voucherCode}>
                      {appliedVoucher.code}
                    </Text>
                    <Text style={styles.voucherDescription}>
                      {appliedVoucher.description}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeVoucherButton}
                  onPress={handleRemoveVoucher}
                >
                  <Text style={styles.removeVoucherText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.voucherInputContainer}>
                <TextInput
                  style={styles.voucherInput}
                  placeholder="Enter voucher code"
                  value={voucherCode}
                  onChangeText={setVoucherCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    !voucherCode.trim() && styles.applyButtonDisabled,
                  ]}
                  onPress={handleApplyVoucher}
                  disabled={!voucherCode.trim()}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Order Summary */}
        {cart.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            {/* Subtotal */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                ₱{totals.subtotal.toFixed(2)}
              </Text>
            </View>

            {/* BNPC Discount Details */}
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

            {/* Voucher Discount */}
            {appliedVoucher && totals.voucherDiscount > 0 && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={styles.discountSectionTitle}>
                  Voucher Discount
                </Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{appliedVoucher.code}</Text>
                  <Text style={styles.detailValue}>
                    {appliedVoucher.type === "percentage"
                      ? `${appliedVoucher.discount}% off`
                      : `₱${appliedVoucher.discount} off`}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, styles.voucherDiscountLabel]}
                  >
                    Voucher Discount
                  </Text>
                  <Text
                    style={[styles.summaryValue, styles.voucherDiscountValue]}
                  >
                    -₱{totals.voucherDiscount.toFixed(2)}
                  </Text>
                </View>
              </>
            )}

            {/* If not eligible, show reason */}
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

            {/* Final Total */}
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>
                {isEligibleUser && "Estimated"} Total Amount
              </Text>
              <Text style={styles.totalValue}>
                ₱{totals.finalTotal.toFixed(2)}
              </Text>
            </View>

            {/* Total Savings */}
            {(discountDetails.discountApplied > 0 ||
              totals.voucherDiscount > 0) && (
              <View style={styles.savingsContainer}>
                <MaterialCommunityIcons
                  name="piggy-bank"
                  size={16}
                  color="#00A86B"
                />
                <Text style={styles.savingsText}>
                  You save ₱
                  {(
                    discountDetails.discountApplied + totals.voucherDiscount
                  ).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Loyalty Points */}
        {cart.length > 0 && (
          <View style={styles.pointsCard}>
            <View style={styles.pointsHeader}>
              <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.pointsTitle}>Earn Points</Text>
            </View>
            <Text style={styles.pointsText}>
              You'll earn {Math.floor(totals.finalTotal / 10)} loyalty points
              with this purchase
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Checkout Button */}
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
  // Eligibility Card
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
  // Cart Items
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
  // Voucher Section
  voucherCard: {
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
  voucherHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  voucherTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginLeft: 10,
  },
  voucherInputContainer: {
    flexDirection: "row",
    gap: 12,
  },
  voucherInput: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  applyButton: {
    backgroundColor: "#00A86B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  applyButtonDisabled: {
    backgroundColor: "#ccc",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  appliedVoucher: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f9f5",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  voucherInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  voucherDetails: {
    marginLeft: 12,
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00A86B",
  },
  voucherDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  removeVoucherButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  removeVoucherText: {
    color: "#f44336",
    fontSize: 14,
    fontWeight: "600",
  },
  // Order Summary
  summaryCard: {
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
  // Discount Details
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
  voucherDiscountLabel: {
    fontWeight: "700",
    color: "#000",
  },
  voucherDiscountValue: {
    color: "#FF9800",
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
  // Points Card
  pointsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 100,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFD700",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pointsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginLeft: 8,
  },
  pointsText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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
  originalPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
    marginTop: 2,
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
