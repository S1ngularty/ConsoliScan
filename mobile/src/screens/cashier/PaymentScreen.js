// screens/cashier/PaymentScreen.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { payOrder } from '../../api/checkout.api';
const WEEKLY_CAP = 125;
const PURCHASE_CAP = 2500;

const PaymentScreen = ({ route, navigation }) => {
  const { checkoutData, checkoutCode, appUser=false } = route.params;
  console.log("PaymentScreen checkoutData:", checkoutData);
  console.log(appUser)
  // Extract user eligibility and verification from the scanned data
  const userEligibility = checkoutData?.userEligibility || {};
  const { isSenior = false, isPWD = false, verified = false } = userEligibility;
  const systemVerified = verified || checkoutData?.customerVerification?.verified || false;
  const systemVerificationType = checkoutData?.customerVerification?.type || null;
  
  // Get pre-calculated discount data
  const discountSnapshot = checkoutData?.discountSnapshot || {};
  const systemDiscountApplied = discountSnapshot.discountApplied || 0;
  const systemBnpcSubtotal = discountSnapshot.bnpcSubtotal || 0;
  const systemEligible = discountSnapshot.eligible || false;
  
  // Get weekly usage from system
  const weeklyUsageSnapshot = checkoutData?.weeklyUsageSnapshot || {};
  const systemBookletUsedBefore = weeklyUsageSnapshot.discountUsed || 0;
  
  // Get totals
  const subtotal = checkoutData?.totals?.subtotal || 0;
  const bnpcSubtotal = checkoutData?.totals?.bnpcSubtotal || checkoutData?.items
    ?.filter(item => item.isBNPCProduct)
    .reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) || 0;
  const voucher = checkoutData?.voucher?.discountAmount || 0;
  
  // Get BNPC products for display
  const bnpcProducts = checkoutData?.bnpcProducts || [];
  const hasBNPCProducts = bnpcProducts.length > 0;

  // State for cashier inputs
  const [bookletUsedInput, setBookletUsedInput] = useState(
    systemVerified && systemDiscountApplied > 0 ? systemBookletUsedBefore.toString() : '0'
  );
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  
  // Parse inputs
  const bookletUsed = Math.min(parseFloat(bookletUsedInput) || 0, WEEKLY_CAP);
  const cashReceived = parseFloat(cashReceivedInput) || 0;
  
  // Manual verification state (for cashier override) - Initialize based on system verification
  const [manualVerification, setManualVerification] = useState({
    verified: systemVerified,
    type: systemVerificationType, // 'senior', 'pwd', 'regular', or null
    override: false,
  });

  // Calculate 5% discount based on CURRENT verification status
  const fivePercentDiscount = useMemo(() => {
    // Determine current verification status
    const currentVerificationType = manualVerification.verified ? 
      manualVerification.type : systemVerificationType;
    
    const isEligibleForDiscount = (manualVerification.verified || systemVerified) && 
      (currentVerificationType === 'senior' || currentVerificationType === 'pwd');
    
    if (!isEligibleForDiscount || bnpcSubtotal === 0) return 0;
    
    const discountAmount = bnpcSubtotal * 0.05;
    const remainingDiscountCap = WEEKLY_CAP - bookletUsed;
    return Math.min(discountAmount, remainingDiscountCap);
  }, [manualVerification, systemVerified, systemVerificationType, bnpcSubtotal, bookletUsed]);
  
  // Calculate remaining caps
  const remainingDiscountCap = Math.max(WEEKLY_CAP - bookletUsed, 0);
  const remainingPurchaseCap = Math.max(PURCHASE_CAP - bnpcSubtotal, 0);
  
  // Final totals
  const finalTotal = Math.max(subtotal - fivePercentDiscount - voucher, 0);
  const changeDue = cashReceived - finalTotal;

  const handleManualVerify = (type) => {
    Alert.alert(
      `Verify ${type === 'senior' ? 'Senior Citizen' : 'PWD'}`,
      'Check ID and purchase booklet',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            // Don't reset if already verified by system
            if (!systemVerified) {
              setManualVerification({ verified: false, type: null, override: false });
            }
          }
        },
        {
          text: 'Confirm',
          onPress: () => {
            setManualVerification({
              verified: true,
              type: type,
              override: true, // Mark as manual override
            });
            
            if (!bookletUsedInput && bnpcSubtotal > 0) {
              setBookletUsedInput('0');
            }
          },
        },
      ]
    );
  };

  const handleSetRegular = () => {
    if (hasBNPCProducts) {
      Alert.alert(
        "No BNPC Discount",
        "This cart contains BNPC products. If customer is eligible for BNPC discounts, please verify as Senior or PWD.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue as Regular",
            onPress: () => {
              setManualVerification({
                verified: true,
                type: 'regular',
                override: true
              });
              
              // Clear booklet input for regular customers
              if (bookletUsedInput !== '') {
                setBookletUsedInput('');
              }
            }
          },
        ]
      );
    } else {
      setManualVerification({
        verified: true,
        type: 'regular',
        override: true
      });
      
      // Clear booklet input for regular customers
      if (bookletUsedInput !== '') {
        setBookletUsedInput('');
      }
    }
  };

  const handleCustomerTypeChange = () => {
    Alert.alert(
      'Change Customer Type',
      'Are you sure you want to change customer type?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Change',
          onPress: () => {
            setManualVerification({ 
              verified: false, 
              type: null, 
              override: true 
            });
            
            // Clear booklet input when resetting verification
            if (bookletUsedInput !== '') {
              setBookletUsedInput('');
            }
          },
        },
      ]
    );
  };

  const handleFinalize = async () => {
    try {
      if (cashReceived < finalTotal) {
        Alert.alert('Insufficient Cash', 'Cash received is less than total amount.');
        return;
      }

      // Determine final verification type
      const finalVerificationType = manualVerification.verified ? 
        manualVerification.type : systemVerificationType;
      
      // Only check BNPC limits for Senior/PWD
      if (finalVerificationType === 'senior' || finalVerificationType === 'pwd') {
        if (bookletUsed + fivePercentDiscount > WEEKLY_CAP) {
          Alert.alert('Discount Limit Exceeded', 'Total discount exceeds weekly cap of ₱125');
          return;
        }

        if (bnpcSubtotal > PURCHASE_CAP) {
          Alert.alert('Purchase Limit Exceeded', 'BNPC purchase exceeds weekly limit of ₱2,500');
          return;
        }
      }

      // Determine verification source
      const verificationSource = manualVerification.override ? 'manual' : 
        (systemVerified ? checkoutData?.customerVerification?.verificationSource || 'system' : 'manual');

      // Create transaction log
      const transactionLog = {
        timestamp: new Date().toISOString(),
        orderId: checkoutData?._id,
        checkoutCode,
        appUser: appUser,
        customerType: finalVerificationType || 'regular',
        verificationSource: verificationSource,
        amounts: {
          subtotal,
          bnpcSubtotal,
          discount: fivePercentDiscount,
          voucherDiscount: voucher,
          finalTotal,
          cashReceived,
          changeDue: Math.max(changeDue, 0),
        },
        caps: {
          bookletUsedBefore: bookletUsed,
          remainingDiscountCap,
          remainingPurchaseCap,
          bookletUsedAfter: bookletUsed + fivePercentDiscount,
          purchaseUsedAfter: bnpcSubtotal,
        },
        cashier: checkoutData?.cashier,
        items: checkoutData?.items?.length || 0,
        systemData: {
          systemVerified: systemVerified,
          systemVerificationType: systemVerificationType,
          systemDiscountApplied: systemDiscountApplied,
          userEligibility: userEligibility,
          manualOverride: manualVerification.override,
        },
      };

      console.log('TRANSACTION COMPLETED:', transactionLog);
      console.log(appUser)
      appUser && await payOrder(checkoutCode);
      
      // Navigate to receipt
      navigation.navigate('OrderSummary', {
        transactionData: transactionLog,
        orderDetails: checkoutData,
      });

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    }
  };

  // Determine if customer is verified for discount (uses current state)
  const isCustomerVerifiedForDiscount = manualVerification.verified ? 
    (manualVerification.type === 'senior' || manualVerification.type === 'pwd') :
    (systemVerified && (systemVerificationType === 'senior' || systemVerificationType === 'pwd'));

  // Determine if we should show verification options
  const showVerificationOptions = !manualVerification.verified || manualVerification.type === 'regular';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payment</Text>
          <Text style={styles.orderCode}>#{checkoutCode}</Text>
        </View>

        {/* BNPC Products Warning */}
        {hasBNPCProducts && !isCustomerVerifiedForDiscount && (
          <View style={styles.bnpcWarningSection}>
            <View style={styles.bnpcWarningHeader}>
              <Ionicons name="warning" size={18} color="#FF9800" />
              <Text style={styles.bnpcWarningTitle}>BNPC Products in Cart</Text>
            </View>
            
            <View style={styles.bnpcProductsList}>
              {bnpcProducts.slice(0, 3).map((product, index) => (
                <View key={index} style={styles.bnpcProductItem}>
                  <Text style={styles.bnpcProductName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.bnpcProductDetails}>
                    {product.quantity} × ₱{product.price.toFixed(2)}
                  </Text>
                </View>
              ))}
              {bnpcProducts.length > 3 && (
                <Text style={styles.bnpcMoreItems}>
                  +{bnpcProducts.length - 3} more BNPC items
                </Text>
              )}
            </View>
            
            <Text style={styles.bnpcWarningText}>
              Customer must present valid ID for BNPC discounts
            </Text>
          </View>
        )}

        {/* Customer Verification */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Customer Verification</Text>
            
            {isCustomerVerifiedForDiscount && !manualVerification.override && (
              <View style={styles.appVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.appVerifiedText}>System Verified</Text>
              </View>
            )}
          </View>
          
          {showVerificationOptions ? (
            <View style={styles.verificationBox}>
              <Text style={styles.verificationText}>
                {hasBNPCProducts
                  ? "Verify customer for BNPC discounts"
                  : "Select customer type"}
              </Text>
              <View style={styles.verificationButtons}>
                <TouchableOpacity
                  style={[styles.verifyButton, styles.seniorButton]}
                  onPress={() => handleManualVerify('senior')}
                >
                  <Text style={styles.verifyButtonText}>Senior Citizen</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.verifyButton, styles.pwdButton]}
                  onPress={() => handleManualVerify('pwd')}
                >
                  <Text style={styles.verifyButtonText}>PWD</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.verifyButton, styles.regularButton]}
                  onPress={handleSetRegular}
                >
                  <Text style={styles.regularButtonText}>Regular Customer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[
              styles.verifiedBox,
              manualVerification.type === 'regular' && styles.regularVerifiedBox
            ]}>
              <View style={styles.verifiedHeader}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={18} 
                  color={manualVerification.type === 'regular' ? "#6B7280" : "#10B981"} 
                />
                <Text style={[
                  styles.verifiedText,
                  manualVerification.type === 'regular' && styles.regularCustomerText
                ]}>
                  {manualVerification.type === 'senior' ? 'Senior Citizen' :
                   manualVerification.type === 'pwd' ? 'Person with Disability' :
                   'Regular Customer'} Verified
                  {!manualVerification.override && ' (via System)'}
                </Text>
                
                <TouchableOpacity
                  style={styles.changeTypeButton}
                  onPress={handleCustomerTypeChange}
                >
                  <Text style={styles.changeTypeText}>Change</Text>
                </TouchableOpacity>
              </View>
              
              {isCustomerVerifiedForDiscount && hasBNPCProducts && (
                <Text style={styles.verifiedNote}>
                  5% BNPC discount applies to eligible items
                </Text>
              )}
              
              {manualVerification.type === 'regular' && hasBNPCProducts && (
                <Text style={styles.regularWarning}>
                  ⚠️ BNPC products in cart - no discounts applied
                </Text>
              )}
            </View>
          )}
        </View>

        {/* BNPC Section - Only for verified Senior/PWD customers */}
        {isCustomerVerifiedForDiscount && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={18} color="#374151" />
              <Text style={styles.sectionTitle}>BNPC Discount</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Booklet Used This Week</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={bookletUsedInput}
                onChangeText={setBookletUsedInput}
                placeholder="0.00"
              />
            </View>
            
            <View style={styles.capsDisplay}>
              <View style={styles.capItem}>
                <Text style={styles.capLabel}>Remaining Discount Cap</Text>
                <Text style={styles.capValue}>₱{remainingDiscountCap.toFixed(2)}</Text>
              </View>
              <View style={styles.capDivider} />
              <View style={styles.capItem}>
                <Text style={styles.capLabel}>Remaining Purchase Cap</Text>
                <Text style={styles.capValue}>₱{remainingPurchaseCap.toFixed(2)}</Text>
              </View>
            </View>
            
            {fivePercentDiscount > 0 && (
              <View style={styles.discountAppliedBox}>
                <View style={styles.discountAppliedHeader}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.discountAppliedTitle}>5% Discount Applied</Text>
                </View>
                <Text style={styles.discountAppliedAmount}>-₱{fivePercentDiscount.toFixed(2)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Amounts Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Amount Summary</Text>
          </View>
          
          <View style={styles.amountsGrid}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Subtotal</Text>
              <Text style={styles.amountValue}>₱{subtotal.toFixed(2)}</Text>
            </View>
            
            {fivePercentDiscount > 0 && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>BNPC Discount (5%)</Text>
                <Text style={[styles.amountValue, styles.discountValue]}>
                  -₱{fivePercentDiscount.toFixed(2)}
                </Text>
              </View>
            )}
            
            {voucher > 0 && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Voucher</Text>
                <Text style={[styles.amountValue, styles.discountValue]}>
                  -₱{voucher.toFixed(2)}
                </Text>
              </View>
            )}
            
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₱{finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Cash Received */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Cash Payment</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cash Received</Text>
            <TextInput
              style={[styles.input, styles.cashInput]}
              keyboardType="decimal-pad"
              value={cashReceivedInput}
              onChangeText={setCashReceivedInput}
              placeholder="0.00"
              autoFocus={true}
            />
          </View>
          
          {cashReceived > 0 && (
            <View style={styles.changeBox}>
              <View style={styles.changeRow}>
                <Text style={styles.changeLabel}>Change Due</Text>
                <Text style={[
                  styles.changeValue,
                  changeDue >= 0 ? styles.changePositive : styles.changeNegative
                ]}>
                  {changeDue >= 0 ? '₱' + changeDue.toFixed(2) : 'Insufficient'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Finalize Button */}
        <TouchableOpacity
          style={[
            styles.finalizeButton,
            cashReceived < finalTotal && styles.finalizeButtonDisabled
          ]}
          onPress={handleFinalize}
          disabled={cashReceived < finalTotal}
        >
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          <Text style={styles.finalizeButtonText}>
            {cashReceived < finalTotal ? 'INSUFFICIENT CASH' : 'FINALIZE TRANSACTION'}
          </Text>
        </TouchableOpacity>
        
        {/* Compliance Note */}
        <Text style={styles.complianceNote}>
          Note: Update BNPC booklet manually after transaction
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  orderCode: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  bnpcWarningSection: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  bnpcWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bnpcWarningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
    marginLeft: 8,
  },
  bnpcProductsList: {
    backgroundColor: 'rgba(255, 248, 225, 0.7)',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  bnpcProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bnpcProductName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  bnpcProductDetails: {
    fontSize: 12,
    color: '#666',
  },
  bnpcMoreItems: {
    fontSize: 11,
    color: '#FF9800',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  bnpcWarningText: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  appVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  appVerifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  verificationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 12,
  },
  verificationText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationButtons: {
    gap: 8,
  },
  verifyButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  seniorButton: {
    backgroundColor: '#00A86B',
  },
  pwdButton: {
    backgroundColor: '#00A86B',
  },
  regularButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  regularButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  regularVerifiedBox: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
    flex: 1,
  },
  regularCustomerText: {
    color: '#6B7280',
  },
  changeTypeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
  },
  changeTypeText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  verifiedNote: {
    fontSize: 12,
    color: '#10B981',
  },
  regularWarning: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  cashInput: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
  capsDisplay: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  capItem: {
    flex: 1,
    alignItems: 'center',
  },
  capLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  capValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  capDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  discountAppliedBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
    padding: 12,
  },
  discountAppliedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  discountAppliedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  discountAppliedAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  amountsGrid: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  discountValue: {
    color: '#10B981',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  changeBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  changeValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  changePositive: {
    color: '#10B981',
  },
  changeNegative: {
    color: '#DC2626',
  },
  finalizeButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  finalizeButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  finalizeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  complianceNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default PaymentScreen;