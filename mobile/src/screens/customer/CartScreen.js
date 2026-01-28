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
import Loader from "../../components/Loader";
import { adjustQuantity, removeToCart } from "../../features/cart/cartSlice";
import { saveLocally } from "../../features/cart/cartThunks";
import { debounceCartSync } from "../../features/cart/cartDebounce";

const CartScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  // Get cart from Redux store
  const { cart, itemCount, totalPrice } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

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
    {
      code: "SCAN20",
      discount: 20,
      type: "percentage",
      minSpend: 150,
      description: "20% off for scanning products",
    },
  ];

  const calculateFinalTotal = () => {
    return totalPrice - discount;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
    dispatch(saveLocally());
    debounceCartSync(dispatch);
  };

  const updateQuantity = (itemId, newQty) => {
    if (newQty < 1) {
      // Remove item if quantity is 0
      dispatch(removeToCart(itemId));
    } else {
      // Update quantity using Redux
      dispatch(
        adjustQuantity({
          _id: itemId,
          selectedQuantity: newQty,
        }),
      );
    }
    dispatch(saveLocally());
    debounceCartSync(dispatch);
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
            dispatch(removeToCart(itemId));
            dispatch(saveLocally());
            debounceCartSync(dispatch);
          },
        },
      ],
    );
  };

  const clearCart = () => {
    Alert.alert("Clear Cart", "Are you sure you want to clear all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: () => {
          // Clear all items one by one or create a new action
          cart.forEach((item) => {
            dispatch(removeToCart(item._id));
          });
          dispatch(saveLocally());
          debounceCartSync(dispatch);
        },
      },
    ]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently added";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleApplyVoucher = () => {
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

    if (totalPrice < voucher.minSpend) {
      Alert.alert(
        "Minimum Spend Required",
        `Minimum spend of ₱${voucher.minSpend} required for this voucher`,
      );
      return;
    }

    let calculatedDiscount = 0;
    if (voucher.type === "percentage") {
      calculatedDiscount = (totalPrice * voucher.discount) / 100;
    } else {
      calculatedDiscount = voucher.discount;
    }

    setDiscount(calculatedDiscount);
    setAppliedVoucher(voucher);
    Alert.alert(
      "Success",
      `Voucher applied! You saved ₱${calculatedDiscount.toFixed(2)}`,
    );
  };

  const handleRemoveVoucher = () => {
    setDiscount(0);
    setAppliedVoucher(null);
    setVoucherCode("");
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty. Add items to checkout.");
      return;
    }

    const checkoutData = {
      cart,
      totalPrice,
      discount,
      finalTotal: calculateFinalTotal(),
      voucher: appliedVoucher,
    };

    navigation.navigate("Checkout", { checkoutData });
  };

  const renderCartItem = (item) => (
    <View key={item._id} style={styles.cartItem}>
      <Image
        source={{
          uri:
            item.images?.[0]?.url ||
            item.product?.images?.[0]?.url ||
            "https://via.placeholder.com/100",
        }}
        style={styles.itemImage}
        resizeMode="cover"
      />

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name || item.product?.name || "Product"}
        </Text>
        <Text style={styles.itemPrice}>
          ₱{item.price?.toFixed(2) || "0.00"}
        </Text>
        <Text style={styles.itemDate}>Added {formatDate(item.dateAdded)}</Text>
      </View>

      <View style={styles.itemActions}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => updateQuantity(item._id, item.qty - 1)}
          >
            <MaterialCommunityIcons name="minus" size={18} color="#666" />
          </TouchableOpacity>

          <View style={styles.qtyDisplay}>
            <Text style={styles.qtyText}>{item.qty}</Text>
          </View>

          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => updateQuantity(item._id, item.qty + 1)}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemTotal}>
          <Text style={styles.itemTotalText}>
            ₱{((item.price || 0) * item.qty).toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item._id)}
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
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearCart}
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
                  style={styles.applyButton}
                  onPress={handleApplyVoucher}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Available Vouchers */}
            <View style={styles.availableVouchers}>
              <Text style={styles.availableVouchersTitle}>
                Available Vouchers
              </Text>
              {availableVouchers.map((voucher) => (
                <View key={voucher.code} style={styles.voucherItem}>
                  <View style={styles.voucherItemIcon}>
                    <MaterialCommunityIcons
                      name="ticket-percent"
                      size={18}
                      color="#FF9800"
                    />
                  </View>
                  <View style={styles.voucherItemContent}>
                    <Text style={styles.voucherItemCode}>{voucher.code}</Text>
                    <Text style={styles.voucherItemDesc}>
                      {voucher.description}
                    </Text>
                    <Text style={styles.voucherItemTerms}>
                      Min. spend ₱{voucher.minSpend}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.useVoucherButton}
                    onPress={() => {
                      setVoucherCode(voucher.code);
                      handleApplyVoucher();
                    }}
                    disabled={totalPrice < voucher.minSpend}
                  >
                    <Text
                      style={[
                        styles.useVoucherText,
                        totalPrice < voucher.minSpend &&
                          styles.useVoucherTextDisabled,
                      ]}
                    >
                      Use
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Order Summary */}
        {cart.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₱{totalPrice.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>₱0.00</Text>
            </View>

            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -₱{discount.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>₱0.00</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ₱{calculateFinalTotal().toFixed(2)}
              </Text>
            </View>

            {discount > 0 && (
              <Text style={styles.savingsText}>
                You saved ₱{discount.toFixed(2)} with {appliedVoucher?.code}
              </Text>
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
              You'll earn {Math.floor(calculateFinalTotal() / 10)} loyalty
              points with this purchase
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
              ₱{calculateFinalTotal().toFixed(2)}
            </Text>
            {discount > 0 && (
              <Text style={styles.originalPrice}>₱{totalPrice.toFixed(2)}</Text>
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
    marginBottom: 4,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00A86B",
    marginBottom: 4,
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
  availableVouchers: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  availableVouchersTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  voucherItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  voucherItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff3e0",
    justifyContent: "center",
    alignItems: "center",
  },
  voucherItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  voucherItemCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF9800",
  },
  voucherItemDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  voucherItemTerms: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  useVoucherButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#00A86B",
    borderRadius: 8,
  },
  useVoucherText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  useVoucherTextDisabled: {
    color: "#ccc",
  },
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
  discountValue: {
    color: "#00A86B",
    fontWeight: "700",
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
  savingsText: {
    fontSize: 13,
    color: "#00A86B",
    marginTop: 8,
    fontStyle: "italic",
  },
  pointsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
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
