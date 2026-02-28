/**
 * OrderHistoryScreen.js
 * screens/OrderHistoryScreen.js
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { fetchOrders, downloadReceipt } from "../../api/order.api";
import OfflineIndicator from "../../components/Common/OfflineIndicator";

// ─── Animated Filter Chip ────────────────────────────────────────────────────
const FilterChip = ({ label, isActive, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const bg = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bg, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.93,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
    ]).start();
    onPress();
  };

  const backgroundColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffffff", "#0f172a"],
  });
  const textColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: ["#64748b", "#ffffff"],
  });
  const borderColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: ["#f1f5f9", "#0f172a"],
  });

  return (
    <Animated.View
      style={[styles.filterChip, { backgroundColor, borderColor }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={1}
          style={styles.filterChipInner}
        >
          <Animated.Text style={[styles.filterChipText, { color: textColor }]}>
            {label}
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Animated Order Card ─────────────────────────────────────────────────────
const OrderCard = ({
  order,
  onDetails,
  onDownload,
  onReturn,
  downloadingId,
  index,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef(null);
  const isDownloading = downloadingId === order._id;

  // ── Check if this order has any returnable items ──
  const hasReturnableItems = order.items?.some(
    (i) => i.status !== "EXCHANGED" && i.status !== "RETURNED",
  );

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 300,
      delay: Math.min(index * 55, 300),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isDownloading) {
      spinAnim.setValue(0);
      spinLoop.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      spinLoop.current.start();
    } else {
      spinLoop.current?.stop();
      spinAnim.setValue(0);
    }
    return () => spinLoop.current?.stop();
  }, [isDownloading]);

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();

  const opacity = mountAnim;
  const translateY = mountAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const formatPrice = (n) => `₱${(n || 0).toFixed(2)}`;
  const formatDate = (d) => {
    const date = new Date(d);
    const diff = Math.floor((new Date() - date) / 86400000);
    const time = date.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (diff === 0) return `Today at ${time}`;
    if (diff === 1) return `Yesterday at ${time}`;
    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalDiscount =
    order.discountBreakdown?.total || order.seniorPwdDiscountAmount || 0;
  const itemCount = order.items?.length || 0;
  const returnedCount =
    order.items?.filter((i) => i.status === "RETURNED").length || 0;
  const exchangedCount =
    order.items?.filter((i) => i.status === "EXCHANGED").length || 0;
  const pointsEarned =
    order.loyaltyDiscount?.pointsEarned || order.pointsEarned || 0;

  return (
    <Animated.View
      style={[
        styles.orderCard,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onDetails(order)}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={styles.storeBadge}>
            <MaterialCommunityIcons name="shopping" size={16} color="#0f172a" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.storeName}>Order #{order.checkoutCode}</Text>
            <Text style={styles.orderDate}>
              {formatDate(order.confirmedAt)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.amountText}>
              {formatPrice(order.finalAmountPaid)}
            </Text>
            {pointsEarned > 0 && (
              <Text style={styles.pointsBadge}>+{pointsEarned} pts</Text>
            )}
          </View>
        </View>

        {/* Items summary */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <MaterialCommunityIcons
              name="package-variant"
              size={14}
              color="#64748b"
            />
            <Text style={styles.itemsLabel}>{itemCount} items</Text>
            {returnedCount > 0 && (
              <View style={styles.itemsReturnedBadge}>
                <MaterialCommunityIcons name="undo" size={10} color="#EF4444" />
                <Text style={styles.itemsReturnedText}>
                  {returnedCount} returned
                </Text>
              </View>
            )}
            {exchangedCount > 0 && (
              <View style={styles.itemsExchangedBadge}>
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={10}
                  color="#3B82F6"
                />
                <Text style={styles.itemsExchangedText}>
                  {exchangedCount} exchanged
                </Text>
              </View>
            )}
          </View>
          <View style={styles.itemsList}>
            {(order.items || []).slice(0, 3).map((item, i) => {
              const isReturned = item.status === "RETURNED";
              const isExchanged = item.status === "EXCHANGED";
              return (
                <View
                  key={item._id || `order-item-${i}`}
                  style={[
                    styles.itemRow,
                    isReturned && styles.itemRowReturned,
                    isExchanged && styles.itemRowExchanged,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      isReturned
                        ? "undo"
                        : isExchanged
                          ? "swap-horizontal"
                          : "circle-small"
                    }
                    size={16}
                    color={
                      isReturned
                        ? "#EF4444"
                        : isExchanged
                          ? "#3B82F6"
                          : "#64748b"
                    }
                  />
                  <Text
                    style={[
                      styles.itemName,
                      (isReturned || isExchanged) && styles.itemNameAdjusted,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  <Text
                    style={[
                      styles.itemPrice,
                      (isReturned || isExchanged) && styles.itemPriceAdjusted,
                    ]}
                  >
                    ₱{(item.unitPrice * item.quantity).toFixed(2)}
                  </Text>
                  {isExchanged && (
                    <View style={styles.exchangedBadgeInline}>
                      <Text style={styles.exchangedBadgeInlineText}>
                        Exchanged
                      </Text>
                    </View>
                  )}
                  {isReturned && (
                    <View style={styles.returnedBadgeInline}>
                      <Text style={styles.returnedBadgeInlineText}>
                        Returned
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
            {(order.items || []).length > 3 && (
              <Text style={styles.moreItems}>
                +{order.items.length - 3} more items
              </Text>
            )}
          </View>
        </View>

        {/* Footer chips */}
        <View style={styles.orderFooter}>
          {totalDiscount > 0 ? (
            <View style={styles.chip}>
              <MaterialCommunityIcons name="tag" size={12} color="#00A86B" />
              <Text style={[styles.chipText, styles.discountChipText]}>
                Discount: {formatPrice(totalDiscount)}
              </Text>
            </View>
          ) : (
            <View style={styles.chip}>
              <MaterialCommunityIcons name="tag" size={12} color="#64748b" />
              <Text style={styles.chipText}>No discount</Text>
            </View>
          )}
          <View style={[styles.chip, styles.statusChip]}>
            <View style={[styles.statusDot, styles.completedDot]} />
            <Text style={styles.chipText}>
              {order.status?.toLowerCase() || "confirmed"}
            </Text>
          </View>
          <View style={styles.detailsButton}>
            <Text style={styles.detailsText}>Details</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={14}
              color="#00A86B"
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Action row: Download + Exchange ─────────────────────────────── */}
      <View style={styles.cardActions}>
        {/* Download receipt */}
        <TouchableOpacity
          style={[
            styles.cardActionBtn,
            isDownloading && styles.cardActionBtnActive,
          ]}
          onPress={() => onDownload(order._id, order.checkoutCode)}
          disabled={isDownloading}
          activeOpacity={0.75}
        >
          {isDownloading ? (
            <>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <MaterialCommunityIcons
                  name="loading"
                  size={16}
                  color="#00A86B"
                />
              </Animated.View>
              <Text style={styles.cardActionBtnText}>Saving…</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={16}
                color="#00A86B"
              />
              <Text style={styles.cardActionBtnText}>Receipt</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Return — only shown for confirmed orders with returnable items */}
        {order.status === "CONFIRMED" && hasReturnableItems && (
          <TouchableOpacity
            style={[styles.cardActionBtn, styles.cardActionBtnReturn]}
            onPress={() => onReturn(order)}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="undo" size={16} color="#EF4444" />
            <Text
              style={[styles.cardActionBtnText, styles.cardActionBtnReturnText]}
            >
              Return
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Order Details Modal ──────────────────────────────────────────────────────
const OrderDetailsModal = ({
  order,
  visible,
  onClose,
  onDownload,
  onReturnItem,
  downloadingId,
}) => {
  const slideY = useRef(new Animated.Value(700)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideY, {
          toValue: 0,
          bounciness: 3,
          speed: 16,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideY, {
        toValue: 700,
        duration: 240,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [onClose]);

  if (!visible) return null;

  const formatPrice = (n) => `₱${(n || 0).toFixed(2)}`;
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalDiscount =
    order.discountBreakdown?.total || order.seniorPwdDiscountAmount || 0;
  const bnpcDiscount =
    order.discountBreakdown?.bnpc || order.bnpcDiscount?.total || 0;
  const promoDiscount =
    order.discountBreakdown?.promo || order.promoDiscount?.amount || 0;
  const loyaltyDiscount =
    order.discountBreakdown?.loyalty || order.loyaltyDiscount?.amount || 0;
  const pointsUsed = order.loyaltyDiscount?.pointsUsed || 0;
  const pointsEarned =
    order.loyaltyDiscount?.pointsEarned || order.pointsEarned || 0;
  const isDownloading = downloadingId === order._id;
  const isConfirmed = order.status === "CONFIRMED";

  return (
    <View style={styles.modalOverlay} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdrop }]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[styles.modalContainer, { transform: [{ translateY: slideY }] }]}
      >
        <View style={styles.dragHandle} />

        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Order Details</Text>
            <Text style={styles.modalSubtitle}>#{order.checkoutCode}</Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info */}
          <View style={styles.modalSection}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={18}
                  color="#64748b"
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Date & Time</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(order.confirmedAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color="#00A86B"
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[styles.infoValue, styles.statusValue]}>
                    {order.status || "Confirmed"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Items — each has a Return button if eligible ── */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>
              Order Items ({(order.items || []).length})
            </Text>
            <View style={styles.modalItemsList}>
              {(order.items || []).map((item, i) => {
                const isExchanged = item.status === "EXCHANGED";
                const isReturned = item.status === "RETURNED";
                return (
                  <View
                    key={i}
                    style={[
                      styles.modalItemCard,
                      isExchanged && styles.modalItemCardExchanged,
                      isReturned && styles.modalItemCardReturned,
                    ]}
                  >
                    <View style={styles.modalItemIcon}>
                      <MaterialCommunityIcons
                        name={
                          isReturned
                            ? "undo-variant"
                            : isExchanged
                              ? "swap-horizontal-circle"
                              : "circle-small"
                        }
                        size={20}
                        color={
                          isReturned
                            ? "#EF4444"
                            : isExchanged
                              ? "#3B82F6"
                              : "#64748b"
                        }
                      />
                    </View>
                    <View style={styles.modalItemInfo}>
                      <View style={styles.modalItemNameRow}>
                        <Text
                          style={[
                            styles.modalItemName,
                            (isReturned || isExchanged) &&
                              styles.modalItemNameAdjusted,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {isReturned && (
                          <View style={styles.modalReturnedChip}>
                            <MaterialCommunityIcons
                              name="undo"
                              size={10}
                              color="#fff"
                            />
                            <Text style={styles.modalReturnedChipText}>
                              RETURNED
                            </Text>
                          </View>
                        )}
                        {isExchanged && (
                          <View style={styles.modalExchangedChip}>
                            <MaterialCommunityIcons
                              name="swap-horizontal"
                              size={10}
                              color="#fff"
                            />
                            <Text style={styles.modalExchangedChipText}>
                              EXCHANGED
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.modalItemDetails}>
                        <Text style={styles.modalItemQuantity}>
                          Qty: {item.quantity}
                        </Text>
                        <Text style={styles.modalItemUnitPrice}>
                          ₱{(item.unitPrice || 0).toFixed(2)} each
                        </Text>
                      </View>
                      {isExchanged && item.exchangeInfo?.replacementName && (
                        <Text style={styles.modalItemReplacement}>
                          → {item.exchangeInfo.replacementName}
                        </Text>
                      )}
                      {isReturned && item.returnInfo && (
                        <View style={styles.modalReturnInfo}>
                          <Text style={styles.modalReturnInfoText}>
                            {item.returnInfo.fulfillmentType === "LOYALTY"
                              ? `✓ Returned for loyalty points`
                              : `✓ Returned - Item swapped`}
                          </Text>
                          {item.returnInfo.completedAt && (
                            <Text style={styles.modalReturnInfoDate}>
                              on{" "}
                              {new Date(
                                item.returnInfo.completedAt,
                              ).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <Text style={styles.modalItemTotal}>
                        ₱{((item.unitPrice || 0) * item.quantity).toFixed(2)}
                      </Text>
                      {/* ── Per-item Return button ── */}
                      {isConfirmed && !isExchanged && !isReturned ? (
                        <TouchableOpacity
                          style={styles.itemReturnBtn}
                          onPress={() => {
                            handleClose();
                            setTimeout(() => onReturnItem(order, item), 280);
                          }}
                          activeOpacity={0.75}
                        >
                          <MaterialCommunityIcons
                            name="undo"
                            size={11}
                            color="#EF4444"
                          />
                          <Text style={styles.itemReturnBtnText}>Return</Text>
                        </TouchableOpacity>
                      ) : isExchanged ? (
                        <View style={styles.itemExchangedTag}>
                          <MaterialCommunityIcons
                            name="check"
                            size={10}
                            color="#3B82F6"
                          />
                          <Text style={styles.itemExchangedTagText}>
                            Exchanged
                          </Text>
                        </View>
                      ) : isReturned ? (
                        <View style={styles.itemReturnedTag}>
                          <MaterialCommunityIcons
                            name="check"
                            size={10}
                            color="#EF4444"
                          />
                          <Text style={styles.itemReturnedTagText}>
                            Returned
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Price Breakdown</Text>
            <View style={styles.pricingCard}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Base Amount</Text>
                <Text style={styles.pricingValue}>
                  {formatPrice(order.baseAmount)}
                </Text>
              </View>
              {order.bnpcEligibleSubtotal > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>BNPC Eligible</Text>
                  <Text style={styles.pricingValue}>
                    {formatPrice(order.bnpcEligibleSubtotal)}
                  </Text>
                </View>
              )}
              {bnpcDiscount > 0 && (
                <View style={styles.pricingRow}>
                  <View style={styles.discountRow}>
                    <MaterialCommunityIcons
                      name="tag"
                      size={14}
                      color="#00A86B"
                    />
                    <Text style={[styles.pricingLabel, styles.discountLabel]}>
                      BNPC Discount (5%)
                    </Text>
                  </View>
                  <Text style={[styles.pricingValue, styles.discountValue]}>
                    -{formatPrice(bnpcDiscount)}
                  </Text>
                </View>
              )}
              {promoDiscount > 0 && (
                <View style={styles.pricingRow}>
                  <View style={styles.discountRow}>
                    <MaterialCommunityIcons
                      name="sale"
                      size={14}
                      color="#FF9800"
                    />
                    <Text style={[styles.pricingLabel, styles.promoLabel]}>
                      Promo {order.promoDiscount?.code || ""}
                    </Text>
                  </View>
                  <Text style={[styles.pricingValue, styles.promoValue]}>
                    -{formatPrice(promoDiscount)}
                  </Text>
                </View>
              )}
              {loyaltyDiscount > 0 && (
                <View style={styles.pricingRow}>
                  <View style={styles.discountRow}>
                    <MaterialCommunityIcons
                      name="star"
                      size={14}
                      color="#B45309"
                    />
                    <Text style={[styles.pricingLabel, styles.loyaltyLabel]}>
                      Loyalty Points
                    </Text>
                  </View>
                  <Text style={[styles.pricingValue, styles.loyaltyValue]}>
                    -{formatPrice(loyaltyDiscount)}
                  </Text>
                </View>
              )}
              {totalDiscount > 0 && (
                <View style={styles.totalDiscountRow}>
                  <Text style={styles.totalDiscountLabel}>Total Discount</Text>
                  <Text style={styles.totalDiscountValue}>
                    -{formatPrice(totalDiscount)}
                  </Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(order.finalAmountPaid)}
                </Text>
              </View>
            </View>
          </View>

          {/* BNPC Caps */}
          {order.bnpcCaps && order.bnpcCaps.discountCap?.usedAfter > 0 && (
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>BNPC Weekly Caps</Text>
              <View style={styles.capsCard}>
                <View style={styles.capRow}>
                  <Text style={styles.capLabel}>Discount Used This Week</Text>
                  <Text style={styles.capValue}>
                    ₱{order.bnpcCaps.discountCap.usedAfter.toFixed(2)} / 125
                  </Text>
                </View>
                <View style={styles.capRow}>
                  <Text style={styles.capLabel}>Purchase Used This Week</Text>
                  <Text style={styles.capValue}>
                    ₱{order.bnpcCaps.purchaseCap.usedAfter.toFixed(2)} / 2500
                  </Text>
                </View>
                {order.bnpcCaps.weekEnd && (
                  <Text style={styles.capNote}>
                    Resets:{" "}
                    {new Date(order.bnpcCaps.weekEnd).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Loyalty Points */}
          {(pointsUsed > 0 || pointsEarned > 0) && (
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Loyalty Points</Text>
              <View style={styles.pointsCard}>
                {pointsUsed > 0 && (
                  <View style={styles.pointsRow}>
                    <MaterialCommunityIcons
                      name="star-minus"
                      size={20}
                      color="#DC2626"
                    />
                    <View style={styles.pointsInfo}>
                      <Text style={styles.pointsLabel}>Points Used</Text>
                      <Text
                        style={[styles.pointsValue, styles.pointsUsedValue]}
                      >
                        -{pointsUsed} points
                      </Text>
                    </View>
                  </View>
                )}
                {pointsEarned > 0 && (
                  <View style={styles.pointsRow}>
                    <MaterialCommunityIcons
                      name="star-plus"
                      size={20}
                      color="#00A86B"
                    />
                    <View style={styles.pointsInfo}>
                      <Text style={styles.pointsLabel}>Points Earned</Text>
                      <Text
                        style={[styles.pointsValue, styles.pointsEarnedValue]}
                      >
                        +{pointsEarned} points
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={{ height: 8 }} />
        </ScrollView>

        {/* ── Modal actions: Close + Download + Exchange all items ── */}
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={handleClose}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="close" size={18} color="#64748b" />
            <Text style={styles.closeModalText}>Close</Text>
          </TouchableOpacity>

          {/* Exchange button (full order → navigate, let exchange screen pick item) */}
          {isConfirmed &&
            order.items?.some((i) => i.status !== "EXCHANGED") && (
              <TouchableOpacity
                style={styles.exchangeModalButton}
                onPress={() => {
                  handleClose();
                  setTimeout(() => onExchangeItem(order, null), 280);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={18}
                  color="#3B82F6"
                />
                <Text style={styles.exchangeModalButtonText}>Exchange</Text>
              </TouchableOpacity>
            )}

          <TouchableOpacity
            style={[
              styles.downloadReceiptButton,
              isDownloading && styles.downloadReceiptButtonLoading,
            ]}
            onPress={() => onDownload(order._id, order.checkoutCode)}
            disabled={isDownloading}
            activeOpacity={0.8}
          >
            {isDownloading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.downloadReceiptButtonText}>Saving…</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.downloadReceiptButtonText}>Receipt</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const OrderHistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const filters = [
    { id: "all", label: "All" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "discount", label: "With Discount" },
    { id: "exchange", label: "Exchanged/Returned" },
  ];

  const fetchOrderList = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      // console.log("orders data:", data)
      setOrders(data || []);
    } catch {
      Alert.alert("Error", "Failed to load orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderList();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderList();
  };

  const handleDownloadReceipt = async (orderId, checkoutCode) => {
    setDownloadingId(orderId);
    try {
      const result = await downloadReceipt(orderId, checkoutCode);
      if (result.success)
        Alert.alert("Success", "Receipt downloaded successfully");
    } catch (err) {
      Alert.alert(
        "Error",
        err.message || "Failed to download receipt. Please try again.",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Navigate to ReturnScreen ──────────────────────────────────────────────
  const handleNavigateReturn = useCallback(
    (order, item = null) => {
      console.log(order);
      const params = { order }; // Pass the full order object
      // If a specific item was tapped, pass its _id
      if (item) params.itemId = item.product;
      navigation.navigate("Return", params);
    },
    [navigation],
  );

  const getFilteredOrders = useCallback(() => {
    if (!orders.length) return [];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (selectedFilter) {
      case "week":
        return orders.filter((o) => new Date(o.confirmedAt) >= startOfWeek);
      case "month":
        return orders.filter((o) => new Date(o.confirmedAt) >= startOfMonth);
      case "discount":
        return orders.filter(
          (o) =>
            (o.discountBreakdown?.total || 0) > 0 ||
            o.seniorPwdDiscountAmount > 0,
        );
      case "exchange":
        return orders.filter((o) =>
          o.items?.some(
            (i) => i.status === "EXCHANGED" || i.status === "RETURNED",
          ),
        );
      default:
        return orders;
    }
  }, [orders, selectedFilter]);

  const filteredOrders = getFilteredOrders();

  const formatPrice = (n) => `₱${(n || 0).toFixed(2)}`;
  const stats = {
    totalSpent: formatPrice(
      filteredOrders.reduce((s, o) => s + (o.finalAmountPaid || 0), 0),
    ),
    totalPoints: filteredOrders.reduce(
      (s, o) => s + (o.loyaltyDiscount?.pointsEarned || o.pointsEarned || 0),
      0,
    ),
    avgTransaction:
      filteredOrders.length > 0
        ? formatPrice(
            filteredOrders.reduce((s, o) => s + (o.finalAmountPaid || 0), 0) /
              filteredOrders.length,
          )
        : "₱0.00",
  };

  const openDetails = useCallback((order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  }, []);
  const closeDetails = useCallback(() => {
    setShowDetails(false);
  }, []);

  const networkState = useSelector((state) => state.network);

  // Local state to trigger re-renders when network state changes
  const [isOffline, setIsOffline] = useState(false);
  const [isServerDown, setIsServerDown] = useState(false);

  // Sync with Redux network state
  useEffect(() => {
    setIsOffline(networkState.isOffline);
    setIsServerDown(networkState.isServerDown);
  }, [networkState.isOffline, networkState.isServerDown]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        {isOffline || isServerDown ? (
          <OfflineIndicator />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00A86B" />
            <Text style={styles.loadingText}>Loading orders…</Text>
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
        <OfflineIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Order History</Text>
          <Text style={styles.headerSubtitle}>Purchase history & receipts</Text>
        </View>
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
        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { value: stats.totalSpent, label: "Total Spent" },
            {
              value: stats.totalPoints.toLocaleString(),
              label: "Points Earned",
            },
            { value: stats.avgTransaction, label: "Avg Order" },
          ].map((s, i) => (
            <View key={i} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {filters.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              isActive={selectedFilter === f.id}
              onPress={() => setSelectedFilter(f.id)}
            />
          ))}
        </ScrollView>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <Text style={styles.orderCount}>{filteredOrders.length} orders</Text>
        </View>

        {/* Order cards */}
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, i) => (
            <OrderCard
              key={order._id}
              order={order}
              index={i}
              onDetails={openDetails}
              onDownload={handleDownloadReceipt}
              onReturn={(order) => handleNavigateReturn(order, null)}
              downloadingId={downloadingId}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={64}
              color="#cbd5e1"
            />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === "all"
                ? "You haven't placed any orders yet"
                : `No orders found for ${filters.find((f) => f.id === selectedFilter)?.label.toLowerCase()} filter`}
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips card */}
        <View style={styles.tipsCard}>
          <MaterialCommunityIcons
            name="shield-check"
            size={24}
            color="#0f172a"
          />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.tipsTitle}>All orders verified</Text>
            <Text style={styles.tipsText}>
              Discounts and points are automatically calculated
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          visible={showDetails}
          onClose={closeDetails}
          onDownload={handleDownloadReceipt}
          onReturnItem={handleNavigateReturn}
          downloadingId={downloadingId}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 24, color: "#0f172a", fontWeight: "800" },
  headerSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
    fontWeight: "500",
  },
  scrollContent: { paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 14, color: "#64748b", marginTop: 12 },

  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 25,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  filterScroll: { marginBottom: 25 },
  filterContainer: { paddingHorizontal: 24 },
  filterChip: {
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  filterChipInner: { paddingHorizontal: 18, paddingVertical: 10 },
  filterChipText: { fontSize: 13, fontWeight: "700" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  orderCount: { fontSize: 13, color: "#64748b", fontWeight: "600" },

  orderCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  orderHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  storeBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  storeName: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  orderDate: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  amountText: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  pointsBadge: {
    fontSize: 11,
    color: "#00A86B",
    fontWeight: "800",
    marginTop: 4,
    backgroundColor: "rgba(0,168,107,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
    textAlign: "center",
  },

  itemsSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  itemsLabel: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  itemsReturnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  itemsReturnedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#EF4444",
  },
  itemsExchangedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59,130,246,0.1)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  itemsExchangedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#3B82F6",
  },
  itemsList: { gap: 8 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemRowReturned: {
    backgroundColor: "rgba(239,68,68,0.05)",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginHorizontal: -6,
  },
  itemRowExchanged: {
    backgroundColor: "rgba(59,130,246,0.05)",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginHorizontal: -6,
  },
  itemName: { flex: 1, fontSize: 14, color: "#334155" },
  itemNameAdjusted: {
    fontWeight: "600",
  },
  itemQuantity: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    minWidth: 40,
  },
  itemPrice: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  itemPriceAdjusted: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  moreItems: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 4,
  },

  returnedBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 2,
  },
  returnedBadgeInlineText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
  },
  exchangedBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 2,
  },
  exchangedBadgeInlineText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
  },

  orderFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusChip: { backgroundColor: "rgba(0,168,107,0.1)" },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginLeft: 6,
  },
  discountChipText: { color: "#00A86B" },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#94a3b8",
  },
  completedDot: { backgroundColor: "#00A86B" },
  detailsButton: { flexDirection: "row", alignItems: "center" },
  detailsText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00A86B",
    marginRight: 2,
  },

  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  cardActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardActionBtnActive: { backgroundColor: "#F0FDF8", borderColor: "#00A86B" },
  cardActionBtnReturn: {
    backgroundColor: "rgba(239,68,68,0.06)",
    borderColor: "rgba(239,68,68,0.2)",
  },
  cardActionBtnText: { fontSize: 12, fontWeight: "600", color: "#00A86B" },
  cardActionBtnReturnText: { color: "#EF4444" },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    marginHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  shopButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#00A86B",
    borderRadius: 12,
  },
  shopButtonText: { fontSize: 14, fontWeight: "700", color: "#fff" },

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
  tipsText: { fontSize: 12, color: "#64748b" },

  // ── Modal ──
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.75)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  modalSubtitle: { fontSize: 14, color: "#94a3b8", marginTop: 2 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { padding: 20 },
  modalSection: { marginBottom: 24 },

  infoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 2,
  },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  statusValue: { color: "#00A86B" },

  modalItemsList: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modalItemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalItemCardExchanged: {
    backgroundColor: "rgba(59,130,246,0.05)",
  },
  modalItemCardReturned: {
    backgroundColor: "rgba(239,68,68,0.05)",
  },
  modalItemIcon: { width: 32, alignItems: "center" },
  modalItemInfo: { flex: 1, marginLeft: 8 },
  modalItemNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  modalItemNameAdjusted: {
    flex: 1,
  },
  modalReturnedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  modalReturnedChipText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
  },
  modalExchangedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  modalExchangedChipText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
  },
  modalItemDetails: { flexDirection: "row", gap: 12 },
  modalItemQuantity: { fontSize: 12, color: "#64748b" },
  modalItemUnitPrice: { fontSize: 12, color: "#64748b" },
  modalItemTotal: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  modalItemReplacement: {
    fontSize: 11,
    color: "#3B82F6",
    marginTop: 4,
    fontStyle: "italic",
  },
  modalReturnInfo: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(239,68,68,0.1)",
  },
  modalReturnInfoText: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "600",
  },
  modalReturnInfoDate: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },

  itemReturnBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  itemReturnBtnText: { fontSize: 10, fontWeight: "700", color: "#EF4444" },
  itemExchangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59,130,246,0.1)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  itemExchangeBtnText: { fontSize: 10, fontWeight: "700", color: "#3B82F6" },
  itemReturnedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  itemReturnedTagText: { fontSize: 10, fontWeight: "700", color: "#EF4444" },
  itemExchangedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59,130,246,0.08)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  itemExchangedTagText: { fontSize: 10, fontWeight: "700", color: "#3B82F6" },

  pricingCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discountRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pricingLabel: { fontSize: 14, color: "#64748b" },
  pricingValue: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  discountLabel: { color: "#00A86B" },
  discountValue: { color: "#00A86B" },
  promoLabel: { color: "#FF9800" },
  promoValue: { color: "#FF9800" },
  loyaltyLabel: { color: "#B45309" },
  loyaltyValue: { color: "#B45309" },
  totalDiscountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalDiscountLabel: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  totalDiscountValue: { fontSize: 14, fontWeight: "700", color: "#059669" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  totalValue: { fontSize: 18, fontWeight: "800", color: "#0f172a" },

  capsCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  capRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  capLabel: { fontSize: 14, color: "#64748b" },
  capValue: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  capNote: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 4,
  },

  pointsCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  pointsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pointsInfo: { flex: 1 },
  pointsLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 2,
  },
  pointsValue: { fontSize: 14, fontWeight: "600" },
  pointsUsedValue: { color: "#DC2626" },
  pointsEarnedValue: { color: "#00A86B" },

  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  closeModalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    gap: 6,
  },
  closeModalText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  exchangeModalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "rgba(59,130,246,0.1)",
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.2)",
  },
  exchangeModalButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3B82F6",
  },
  downloadReceiptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#00A86B",
    borderRadius: 12,
    gap: 6,
  },
  downloadReceiptButtonLoading: { backgroundColor: "#059669" },
  downloadReceiptButtonText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});

export default OrderHistoryScreen;
