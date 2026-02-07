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

const WEEKLY_CAP = 125;
const PURCHASE_CAP = 2500;

const PaymentScreen = ({ route, navigation }) => {
  const { checkoutData, checkoutCode } = route.params;
  
  // Extract user eligibility from the scanned data
  const { isSenior = false, isPWD = false } = checkoutData?.userEligibility || {};
  const userIsEligible = isSenior || isPWD;
  
  // Check if system has already verified and calculated BNPC
  const hasSystemVerification = checkoutData?.discountSnapshot?.eligible !== undefined;
  const systemVerifiedEligible = checkoutData?.discountSnapshot?.eligible || false;
  
  // Use pre-calculated data if available
  const preCalculated = checkoutData?.discountSnapshot || {};
  
  const subtotal = checkoutData?.totals?.subtotal || 0;
  const voucher = checkoutData?.voucher?.discountAmount || 0;
  
  // Calculate eligible subtotal
  const eligibleSubtotal = useMemo(() => {
    if (systemVerifiedEligible && preCalculated.bnpcSubtotal !== undefined) {
      return preCalculated.bnpcSubtotal;
    }
    return checkoutData?.items
      ?.filter(i => i.isBNPCEligible)
      .reduce(( sum, i) => sum + i.unitPrice * i.quantity, 0) || 0;
  }, [checkoutData?.items, preCalculated.bnpcSubtotal, systemVerifiedEligible]);

  // Initial values from system
  const initialBookletUsed = preCalculated.weeklyDiscountUsed || 0;
  const initialPurchaseUsed = preCalculated.weeklyPurchaseUsed || 0;
  
  // State for cashier inputs
  const [bookletUsedInput, setBookletUsedInput] = useState(
    systemVerifiedEligible ? initialBookletUsed.toString() : ''
  );
  const [additionalAppliedInput, setAdditionalAppliedInput] = useState('');
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  
  // Parse inputs
  const bookletUsed = Math.min(parseFloat(bookletUsedInput) || 0, WEEKLY_CAP);
  const purchaseUsed = Math.min(initialPurchaseUsed, PURCHASE_CAP);
  const additionalApplied = parseFloat(additionalAppliedInput) || 0;
  const cashReceived = parseFloat(cashReceivedInput) || 0;
  
  // Calculate remaining caps
  const remainingDiscountCap = Math.max(WEEKLY_CAP - bookletUsed, 0);
  const remainingPurchaseCap = Math.max(PURCHASE_CAP - purchaseUsed, 0);
  
  // AUTO-CALCULATE MAXIMUM DISCOUNT (system suggestion)
  const autoCalculatedDiscount = useMemo(() => {
    if (!userIsEligible && !systemVerifiedEligible) return 0;
    
    // Maximum is the smallest of: remaining discount cap, remaining purchase cap, eligible subtotal
    const maxPossible = Math.min(
      remainingDiscountCap,
      remainingPurchaseCap,
      eligibleSubtotal
    );
    
    // Calculate 20% discount on eligible items
    const twentyPercentDiscount = eligibleSubtotal * 0.20;
    
    // Return the smaller of 20% discount or max possible
    return Math.min(twentyPercentDiscount, maxPossible);
  }, [userIsEligible, systemVerifiedEligible, remainingDiscountCap, remainingPurchaseCap, eligibleSubtotal]);
  
  // Total discount (auto-calculated + additional cashier input)
  const totalDiscount = autoCalculatedDiscount + additionalApplied;
  
  // Final total calculation
  const finalTotal = Math.max(subtotal - totalDiscount - voucher, 0);
  
  // Change calculation
  const changeDue = cashReceived - finalTotal;
  
  // Handle manual verification
  const [manualVerification, setManualVerification] = useState({
    verified: false,
    type: '', // 'senior' or 'pwd'
  });

  const handleManualVerify = (type) => {
    Alert.alert(
      'Manual Verification',
      `Verify ${type === 'senior' ? 'Senior Citizen' : 'PWD'} ID`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setManualVerification({ verified: true, type });
            // Auto-fill booklet used with typical starting value if empty
            if (!bookletUsedInput) {
              setBookletUsedInput('0');
            }
          },
        },
      ]
    );
  };

  const handleFinalize = () => {
    if (cashReceived < finalTotal) {
      Alert.alert('Insufficient Cash', 'Cash received is less than total amount.');
      return;
    }

    // Validation for BNPC limits
    if (totalDiscount > Math.min(remainingDiscountCap, remainingPurchaseCap, eligibleSubtotal)) {
      Alert.alert(
        'Discount Limit Exceeded',
        'Total discount exceeds maximum allowed. Please adjust.'
      );
      return;
    }

    // Create transaction log
    const transactionLog = {
      timestamp: new Date().toISOString(),
      orderId: checkoutData?._id,
      checkoutCode,
      customerType: manualVerification.verified 
        ? manualVerification.type 
        : (isSenior ? 'senior' : isPWD ? 'pwd' : 'none'),
      verificationSource: manualVerification.verified ? 'manual' : 'system',
      amounts: {
        subtotal,
        eligibleSubtotal,
        autoDiscount: autoCalculatedDiscount,
        additionalDiscount: additionalApplied,
        totalDiscount,
        voucherDiscount: voucher,
        finalTotal,
        cashReceived,
        changeDue: Math.max(changeDue, 0),
      },
      caps: {
        bookletUsedBefore: bookletUsed,
        purchaseUsedBefore: purchaseUsed,
        remainingDiscountCap,
        remainingPurchaseCap,
        bookletUsedAfter: bookletUsed + totalDiscount,
        purchaseUsedAfter: purchaseUsed + eligibleSubtotal,
      },
      cashier: checkoutData?.cashier,
      items: checkoutData?.items?.length || 0,
    };

    console.log('TRANSACTION COMPLETED:', transactionLog);
    
    // Navigate to receipt
    navigation.navigate('OrderSummary', {
      transactionData: transactionLog,
      orderDetails: checkoutData,
    });
  };

  // Auto-focus cash input on mount
  const cashInputRef = React.useRef();

  // Determine if BNPC section should be shown
  const showBNPCSection = userIsEligible || systemVerifiedEligible || manualVerification.verified;

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

        {/* Customer Status Badge */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons 
              name={systemVerifiedEligible ? "checkmark-circle" : "person-circle"} 
              size={20} 
              color={systemVerifiedEligible ? "#10B981" : "#6B7280"} 
            />
            <Text style={styles.statusText}>
              {systemVerifiedEligible 
                ? `Verified ${isSenior ? 'Senior Citizen' : 'PWD'}`
                : userIsEligible
                ? `Eligible ${isSenior ? 'Senior Citizen' : 'PWD'}`
                : 'Regular Customer'
              }
            </Text>
          </View>
          
          {!systemVerifiedEligible && !userIsEligible && (
            <View style={styles.manualVerifySection}>
              <Text style={styles.manualVerifyLabel}>Manual Verification:</Text>
              <View style={styles.verifyButtons}>
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    manualVerification.type === 'senior' && styles.verifyButtonActive
                  ]}
                  onPress={() => handleManualVerify('senior')}
                >
                  <Text style={styles.verifyButtonText}>Senior</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    manualVerification.type === 'pwd' && styles.verifyButtonActive
                  ]}
                  onPress={() => handleManualVerify('pwd')}
                >
                  <Text style={styles.verifyButtonText}>PWD</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* BNPC Section - Only show if eligible */}
        {showBNPCSection && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={18} color="#374151" />
              <Text style={styles.sectionTitle}>BNPC Booklet</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Used this week (from booklet)</Text>
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
            
            {/* Auto-calculated discount display */}
            {autoCalculatedDiscount > 0 && (
              <View style={styles.autoDiscountBox}>
                <View style={styles.autoDiscountHeader}>
                  <Ionicons name="calculator" size={16} color="#059669" />
                  <Text style={styles.autoDiscountTitle}>Auto-calculated Discount</Text>
                </View>
                <Text style={styles.autoDiscountAmount}>₱{autoCalculatedDiscount.toFixed(2)}</Text>
                <Text style={styles.autoDiscountNote}>
                  (20% of eligible items: ₱{eligibleSubtotal.toFixed(2)})
                </Text>
              </View>
            )}
            
            {/* Additional discount input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional discount (if any)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={additionalAppliedInput}
                onChangeText={setAdditionalAppliedInput}
                placeholder="0.00"
              />
            </View>
            
            {/* Validation warning */}
            {totalDiscount > Math.min(remainingDiscountCap, remainingPurchaseCap, eligibleSubtotal) && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={16} color="#DC2626" />
                <Text style={styles.warningText}>Total discount exceeds maximum allowed</Text>
              </View>
            )}
          </View>
        )}

        {/* Amounts Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Amounts</Text>
          </View>
          
          <View style={styles.amountsGrid}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Subtotal</Text>
              <Text style={styles.amountValue}>₱{subtotal.toFixed(2)}</Text>
            </View>
            
            {totalDiscount > 0 && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>BNPC Discount</Text>
                <Text style={[styles.amountValue, styles.discountValue]}>
                  -₱{totalDiscount.toFixed(2)}
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
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₱{finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Cash Received */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Cash</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cash Received</Text>
            <TextInput
              ref={cashInputRef}
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
            (cashReceived < finalTotal || 
             totalDiscount > Math.min(remainingDiscountCap, remainingPurchaseCap, eligibleSubtotal)
            ) && styles.finalizeButtonDisabled
          ]}
          onPress={handleFinalize}
          disabled={cashReceived < finalTotal || 
            totalDiscount > Math.min(remainingDiscountCap, remainingPurchaseCap, eligibleSubtotal)}
        >
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          <Text style={styles.finalizeButtonText}>
            {cashReceived < finalTotal ? 'INSUFFICIENT CASH' : 'FINALIZE TRANSACTION'}
          </Text>
        </TouchableOpacity>
        
        {/* Compliance Note */}
        <Text style={styles.complianceNote}>
          Note: BNPC booklet must be updated manually after transaction
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
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  manualVerifySection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  manualVerifyLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  verifyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  verifyButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  verifyButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  verifyButtonText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
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
  autoDiscountBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  autoDiscountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  autoDiscountTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 6,
  },
  autoDiscountAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 2,
  },
  autoDiscountNote: {
    fontSize: 11,
    color: '#059669',
    opacity: 0.8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 6,
    fontWeight: '500',
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
    color: '#059669',
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
    color: '#059669',
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