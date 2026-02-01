// screens/cashier/OrderDetailsScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
// import api from '../../services/api';

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Mock data based on your schema
  const mockCheckoutData = {
    status: "SCANNED",
    items: [
      {
        product: "product_1",
        name: "Milk - Fresh Cow 1L",
        sku: "MILK-001",
        quantity: 2,
        unitPrice: 89.50,
        categoryType: "Dairy",
        isBNPCEligible: true
      },
      {
        product: "product_2",
        name: "Rice - Jasmine 1kg",
        sku: "RICE-002",
        quantity: 1,
        unitPrice: 65.00,
        categoryType: "Grains",
        isBNPCEligible: true
      },
      {
        product: "product_3",
        name: "Coca-Cola 1.5L",
        sku: "DRINK-003",
        quantity: 3,
        unitPrice: 75.00,
        categoryType: "Beverages",
        isBNPCEligible: false
      },
      {
        product: "product_4",
        name: "Eggs - Large (30pcs)",
        sku: "EGG-004",
        quantity: 1,
        unitPrice: 210.00,
        categoryType: "Dairy",
        isBNPCEligible: true
      },
      {
        product: "product_5",
        name: "Bread - Whole Wheat",
        sku: "BREAD-005",
        quantity: 2,
        unitPrice: 45.00,
        categoryType: "Bakery",
        isBNPCEligible: false
      }
    ],
    totals: {
      subtotal: 684.00,
      discountTotal: 18.23,
      finalTotal: 665.77
    },
    discountSnapshot: {
      eligible: true,
      eligibleItemsCount: 3,
      bnpcSubtotal: 364.50,
      cappedBNPCAmount: 364.50,
      discountApplied: 18.23,
      weeklyDiscountUsed: 45.00,
      weeklyPurchaseUsed: 900.00,
      remainingDiscountCap: 80.00,
      remainingPurchaseCap: 1600.00
    },
    userEligibility: {
      isPWD: true,
      isSenior: false
    },
    voucher: {
      code: "SAVE50",
      discountAmount: 50.00
    },
    weeklyUsageSnapshot: {
      bnpcAmountUsed: 900.00,
      discountUsed: 45.00
    },
    scannedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 45 * 60000).toISOString()
  };

  const { checkoutData = mockCheckoutData, checkoutCode = 'ABC123XYZ' } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState(checkoutData);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // const response = await api.get(`/checkout-queue/${checkoutCode}`);
      // setOrder(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh order details');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLockOrder = async () => {
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // await api.post(`/checkout-queue/${checkoutCode}/lock`);
      
      Alert.alert(
        'Order Locked',
        'Order is now locked. Proceed with payment.',
        [
          {
            text: 'Proceed to Payment',
            onPress: () => navigation.navigate('Payment', {
              checkoutCode,
              orderData: order
            })
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to lock order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // await api.post(`/checkout-queue/${checkoutCode}/cancel`);
              Alert.alert(
                'Order Cancelled',
                'The order has been cancelled.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order');
            }
          }
        }
      ]
    );
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateRemainingDiscount = () => {
    return order.discountSnapshot?.remainingDiscountCap || 0;
  };

  const calculateRemainingPurchase = () => {
    return order.discountSnapshot?.remainingPurchaseCap || 0;
  };

  const getEligibilityIcon = () => {
    if (order.userEligibility?.isPWD) {
      return { icon: 'account-heart', color: '#2196F3', label: 'PWD' };
    }
    if (order.userEligibility?.isSenior) {
      return { icon: 'account-star', color: '#FF9800', label: 'Senior' };
    }
    return { icon: 'account', color: '#666', label: 'Regular' };
  };

  const eligibility = getEligibilityIcon();
  const statusColor = order.status === 'SCANNED' ? '#00A86B' : 
                     order.status === 'LOCKED' ? '#FF9800' : 
                     order.status === 'PAID' ? '#2196F3' : '#64748B';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.orderCode}>#{checkoutCode}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {order.status}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00A86B"
          />
        }
      >
        {/* Customer & Order Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account-circle-outline" size={22} color="#64748B" />
            <Text style={styles.cardTitle}>Customer Information</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Customer Type</Text>
              <View style={styles.customerType}>
                <MaterialCommunityIcons 
                  name={eligibility.icon} 
                  size={16} 
                  color={eligibility.color} 
                />
                <Text style={[styles.infoValue, { color: eligibility.color, fontWeight: '600' }]}>
                  {eligibility.label}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Items Count</Text>
              <Text style={styles.infoValue}>
                {order.items?.length || 0} items
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Scanned At</Text>
              <Text style={styles.infoValue}>
                {formatTime(order.scannedAt)}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Expires At</Text>
              <Text style={styles.infoValue}>
                {formatTime(order.expiresAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="cart-outline" size={22} color="#64748B" />
            <Text style={styles.cardTitle}>Order Items</Text>
            <Text style={styles.itemsCount}>({order.items?.length || 0})</Text>
          </View>
          
          <View style={styles.itemsList}>
            {order.items?.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.itemDetails}>
                    {item.isBNPCEligible && (
                      <View style={styles.bnpcBadge}>
                        <MaterialCommunityIcons name="tag" size={10} color="#FFFFFF" />
                        <Text style={styles.bnpcBadgeText}>BNPC</Text>
                      </View>
                    )}
                    <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                  </View>
                </View>
                
                <View style={styles.itemRight}>
                  <View style={styles.priceRow}>
                    <Text style={styles.itemPrice}>₱{item.unitPrice.toFixed(2)}</Text>
                    <Text style={styles.itemQuantity}>× {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    ₱{(item.unitPrice * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Discount Information */}
        {order.discountSnapshot?.eligible && (
          <View style={[styles.card, styles.discountCard]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="percent" size={22} color="#00A86B" />
              <Text style={styles.cardTitle}>BNPC Discount</Text>
            </View>
            
            <View style={styles.discountDetails}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Eligible BNPC Items</Text>
                <Text style={styles.summaryValue}>
                  {order.discountSnapshot.eligibleItemsCount || 0}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>BNPC Subtotal</Text>
                <Text style={styles.summaryValue}>
                  ₱{(order.discountSnapshot.bnpcSubtotal || 0).toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>5% Discount</Text>
                <Text style={[styles.summaryValue, styles.discountAmount]}>
                  -₱{(order.discountSnapshot.discountApplied || 0).toFixed(2)}
                </Text>
              </View>
              
              {/* Weekly Usage */}
              <View style={styles.weeklyUsage}>
                <View style={styles.weeklyItem}>
                  <View style={styles.weeklyIcon}>
                    <MaterialCommunityIcons name="calendar-week" size={14} color="#64748B" />
                  </View>
                  <View style={styles.weeklyContent}>
                    <Text style={styles.weeklyLabel}>Weekly Purchase</Text>
                    <Text style={styles.weeklyValue}>
                      ₱{(order.weeklyUsageSnapshot?.bnpcAmountUsed || 0).toFixed(2)} / ₱2,500
                    </Text>
                  </View>
                </View>
                
                <View style={styles.weeklyItem}>
                  <View style={styles.weeklyIcon}>
                    <MaterialCommunityIcons name="tag" size={14} color="#64748B" />
                  </View>
                  <View style={styles.weeklyContent}>
                    <Text style={styles.weeklyLabel}>Weekly Discount</Text>
                    <Text style={styles.weeklyValue}>
                      ₱{(order.weeklyUsageSnapshot?.discountUsed || 0).toFixed(2)} / ₱125
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Remaining Caps */}
              <View style={styles.capsContainer}>
                <View style={styles.capItem}>
                  <Text style={styles.capLabel}>Remaining Purchase</Text>
                  <Text style={styles.capValue}>
                    ₱{calculateRemainingPurchase().toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.capItem}>
                  <Text style={styles.capLabel}>Remaining Discount</Text>
                  <Text style={styles.capValue}>
                    ₱{calculateRemainingDiscount().toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Voucher Information */}
        {order.voucher?.code && (
          <View style={[styles.card, styles.voucherCard]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="ticket-percent" size={22} color="#FF9800" />
              <Text style={styles.cardTitle}>Voucher Applied</Text>
            </View>
            
            <View style={styles.voucherDetails}>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherCode}>{order.voucher.code}</Text>
                <Text style={styles.voucherAmount}>
                  -₱{(order.voucher.discountAmount || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ₱{(order.totals?.subtotal || 0).toFixed(2)}
            </Text>
          </View>
          
          {order.discountSnapshot?.discountApplied > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>BNPC Discount</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>
                -₱{(order.discountSnapshot.discountApplied || 0).toFixed(2)}
              </Text>
            </View>
          )}
          
          {order.voucher?.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Voucher Discount</Text>
              <Text style={[styles.summaryValue, styles.voucherText]}>
                -₱{(order.voucher.discountAmount || 0).toFixed(2)}
              </Text>
            </View>
          )}
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              ₱{(order.totals?.finalTotal || 0).toFixed(2)}
            </Text>
          </View>
          
          {(order.discountSnapshot?.discountApplied > 0 || order.voucher?.discountAmount > 0) && (
            <View style={styles.savingsContainer}>
              <MaterialCommunityIcons name="piggy-bank-outline" size={16} color="#00A86B" />
              <Text style={styles.savingsText}>
                Total savings: ₱{(
                  (order.discountSnapshot?.discountApplied || 0) + 
                  (order.voucher?.discountAmount || 0)
                ).toFixed(2)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={handleCancelOrder}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close-circle-outline" size={20} color="#EF4444" />
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.lockButton]}
          onPress={handleLockOrder}
          disabled={isLoading || order.status !== 'SCANNED'}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="lock-check" size={20} color="#FFFFFF" />
              <Text style={styles.lockButtonText}>Lock & Proceed</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A86B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderCode: {
    fontSize: 12,
    color: '#E8F5EF',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8F5EF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 10,
  },
  itemsCount: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
  },
  customerType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemsList: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
    lineHeight: 20,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bnpcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    gap: 4,
  },
  bnpcBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  itemSku: {
    fontSize: 12,
    color: '#94A3B8',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 6,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#94A3B8',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  discountCard: {
    borderColor: '#E8F5EF',
  },
  discountDetails: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  discountAmount: {
    color: '#00A86B',
  },
  weeklyUsage: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 12,
  },
  weeklyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyIcon: {
    width: 24,
    alignItems: 'center',
  },
  weeklyContent: {
    flex: 1,
    marginLeft: 8,
  },
  weeklyLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  weeklyValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  capsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  capItem: {
    flex: 1,
    backgroundColor: '#F0F9F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  capLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'center',
  },
  capValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00A86B',
  },
  voucherCard: {
    borderColor: '#FFEDD5',
  },
  voucherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
  },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
  voucherAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
  summaryCard: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  discountText: {
    color: '#00A86B',
    fontWeight: '600',
  },
  voucherText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E8F5EF',
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00A86B',
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F9F5',
    borderRadius: 8,
    gap: 8,
  },
  savingsText: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8F5EF',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  lockButton: {
    backgroundColor: '#00A86B',
  },
  lockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderDetailsScreen;