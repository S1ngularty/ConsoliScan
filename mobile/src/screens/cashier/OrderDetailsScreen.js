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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
// import api from '../../services/api';

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { checkoutData, checkoutCode } = route.params;
  
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState(checkoutData);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.get(`/checkout-queue/${checkoutCode}`);
      setOrder(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh order details');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLockOrder = async () => {
    setIsLoading(true);
    try {
      await api.post(`/checkout-queue/${checkoutCode}/lock`);
      
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
              await api.post(`/checkout-queue/${checkoutCode}/cancel`);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Order Details</Text>
          <Text style={styles.orderCode}>#{checkoutCode}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
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
        {/* Customer & Order Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#666" />
            <Text style={styles.infoTitle}>Customer Information</Text>
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
                <Text style={[styles.infoValue, { color: eligibility.color }]}>
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
        <View style={styles.itemsCard}>
          <View style={styles.itemsHeader}>
            <MaterialCommunityIcons name="cart" size={24} color="#666" />
            <Text style={styles.itemsTitle}>Order Items</Text>
            <Text style={styles.itemsCount}>({order.items?.length || 0})</Text>
          </View>
          
          {order.items?.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.itemDetails}>
                  {item.isBNPCEligible && (
                    <View style={styles.bnpcBadge}>
                      <Text style={styles.bnpcBadgeText}>BNPC</Text>
                    </View>
                  )}
                  <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                </View>
              </View>
              
              <View style={styles.itemRight}>
                <Text style={styles.itemPrice}>₱{item.unitPrice.toFixed(2)}</Text>
                <Text style={styles.itemQuantity}>× {item.quantity}</Text>
                <Text style={styles.itemTotal}>
                  ₱{(item.unitPrice * item.quantity).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Discount Information */}
        {order.discountSnapshot?.eligible && (
          <View style={styles.discountCard}>
            <View style={styles.discountHeader}>
              <MaterialCommunityIcons name="percent" size={24} color="#00A86B" />
              <Text style={styles.discountTitle}>BNPC Discount</Text>
            </View>
            
            <View style={styles.discountDetails}>
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>Eligible BNPC Items</Text>
                <Text style={styles.discountValue}>
                  {order.discountSnapshot.eligibleItemsCount || 0}
                </Text>
              </View>
              
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>BNPC Subtotal</Text>
                <Text style={styles.discountValue}>
                  ₱{(order.discountSnapshot.bnpcSubtotal || 0).toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>5% Discount</Text>
                <Text style={[styles.discountValue, styles.discountAmount]}>
                  -₱{(order.discountSnapshot.discountApplied || 0).toFixed(2)}
                </Text>
              </View>
              
              {/* Weekly Usage */}
              <View style={styles.weeklyUsage}>
                <View style={styles.weeklyItem}>
                  <MaterialCommunityIcons name="calendar-week" size={16} color="#666" />
                  <Text style={styles.weeklyLabel}>Weekly Purchase</Text>
                  <Text style={styles.weeklyValue}>
                    ₱{(order.weeklyUsageSnapshot?.bnpcAmountUsed || 0).toFixed(2)} / ₱2,500
                  </Text>
                </View>
                
                <View style={styles.weeklyItem}>
                  <MaterialCommunityIcons name="tag" size={16} color="#666" />
                  <Text style={styles.weeklyLabel}>Weekly Discount</Text>
                  <Text style={styles.weeklyValue}>
                    ₱{(order.weeklyUsageSnapshot?.discountUsed || 0).toFixed(2)} / ₱125
                  </Text>
                </View>
              </View>
              
              {/* Remaining Caps */}
              <View style={styles.capsContainer}>
                <View style={styles.capItem}>
                  <Text style={styles.capLabel}>Remaining Purchase Cap</Text>
                  <Text style={styles.capValue}>
                    ₱{calculateRemainingPurchase().toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.capItem}>
                  <Text style={styles.capLabel}>Remaining Discount Cap</Text>
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
          <View style={styles.voucherCard}>
            <View style={styles.voucherHeader}>
              <MaterialCommunityIcons name="ticket-percent" size={24} color="#FF9800" />
              <Text style={styles.voucherTitle}>Voucher Applied</Text>
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
        <View style={styles.summaryCard}>
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
              <MaterialCommunityIcons name="piggy-bank" size={16} color="#00A86B" />
              <Text style={styles.savingsText}>
                Total savings: ₱{(
                  (order.discountSnapshot?.discountApplied || 0) + 
                  (order.voucher?.discountAmount || 0)
                ).toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={handleCancelOrder}
          disabled={isLoading}
        >
          <MaterialCommunityIcons name="close-circle" size={20} color="#f44336" />
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.lockButton]}
          onPress={handleLockOrder}
          disabled={isLoading || order.status !== 'SCANNED'}
        >
          <MaterialCommunityIcons name="lock-check" size={20} color="#fff" />
          <Text style={styles.lockButtonText}>Lock & Proceed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  orderCode: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#f0f9f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00A86B',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00A86B',
    textTransform: 'uppercase',
  },
  // Info Card
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  customerType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Items Card
  itemsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 10,
  },
  itemsCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
    lineHeight: 20,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bnpcBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bnpcBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  itemSku: {
    fontSize: 12,
    color: '#999',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  // Discount Card
  discountCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0f2e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 10,
  },
  discountDetails: {
    gap: 8,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountLabel: {
    fontSize: 14,
    color: '#666',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  discountAmount: {
    color: '#00A86B',
  },
  weeklyUsage: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  weeklyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklyLabel: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  weeklyValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  capsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  capItem: {
    flex: 1,
    backgroundColor: '#f0f9f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  capLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  capValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00A86B',
  },
  // Voucher Card
  voucherCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fff3e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 10,
  },
  voucherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9800',
  },
  voucherAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9800',
  },
  // Summary Card
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  discountText: {
    color: '#00A86B',
    fontWeight: '700',
  },
  voucherText: {
    color: '#FF9800',
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00A86B',
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f9f5',
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '600',
  },
  // Action Bar
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#f44336',
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
  lockButton: {
    backgroundColor: '#00A86B',
  },
  lockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderDetailsScreen;