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
import { MaterialIcons } from '@expo/vector-icons';
import { payOrder } from '../../api/checkout.api';

const WEEKLY_CAP = 125;
const PURCHASE_CAP = 2500;

const PaymentScreen = ({ route, navigation }) => {
  const { checkoutData, checkoutCode } = route.params;
  
  // Customer verification state
  const [customerVerification, setCustomerVerification] = useState({
    isSenior: false,
    isPWD: false,
    verified: false,
    type: null
  });
  
  // Input states
  const [bookletUsedInput, setBookletUsedInput] = useState('');
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  
  // Parse inputs
  const bookletUsed = Math.min(parseFloat(bookletUsedInput) || 0, WEEKLY_CAP);
  const cashReceived = parseFloat(cashReceivedInput) || 0;
  
  // Extract data
  const subtotal = checkoutData?.totals?.subtotal || 0;
  const voucher = checkoutData?.voucher?.discountAmount || 0;
  const bnpcSubtotal = checkoutData?.totals?.bnpcSubtotal || 0;
  
  // Calculate 5% discount only for Senior/PWD
  const fivePercentDiscount = useMemo(() => {
    // Only apply if verified as senior or pwd
    const isEligibleForDiscount = customerVerification.verified && 
      (customerVerification.type === 'senior' || customerVerification.type === 'pwd');
    
    if (!isEligibleForDiscount || bnpcSubtotal === 0) return 0;
    
    const discountAmount = bnpcSubtotal * 0.05;
    const remainingDiscountCap = WEEKLY_CAP - bookletUsed;
    return Math.min(discountAmount, remainingDiscountCap);
  }, [customerVerification.verified, customerVerification.type, bnpcSubtotal, bookletUsed]);
  
  // Calculate remaining caps
  const remainingDiscountCap = Math.max(WEEKLY_CAP - bookletUsed, 0);
  const remainingPurchaseCap = Math.max(PURCHASE_CAP - bnpcSubtotal, 0);
  
  // Final totals
  const finalTotal = Math.max(subtotal - fivePercentDiscount - voucher, 0);
  const changeDue = cashReceived - finalTotal;
  
  // Auto-fill booklet when verified as Senior/PWD
  useEffect(() => {
    if (customerVerification.verified && 
        (customerVerification.type === 'senior' || customerVerification.type === 'pwd') && 
        !bookletUsedInput && 
        bnpcSubtotal > 0) {
      setBookletUsedInput('0');
    }
    
    // Clear booklet input when switching to regular
    if (customerVerification.verified && 
        customerVerification.type === 'regular' && 
        bookletUsedInput !== '') {
      setBookletUsedInput('');
    }
  }, [customerVerification.verified, customerVerification.type, bnpcSubtotal, bookletUsedInput]);

  const handleCustomerVerify = (type) => {
    Alert.alert(
      `Verify ${type === 'senior' ? 'Senior Citizen' : 'PWD'}`,
      'Check ID and purchase booklet',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            setCustomerVerification({ isSenior: false, isPWD: false, verified: false, type: null });
          }
        },
        {
          text: 'Confirm',
          onPress: () => {
            setCustomerVerification({
              isSenior: type === 'senior',
              isPWD: type === 'pwd',
              verified: true,
              type: type
            });
            
            if (type !== 'regular' && !bookletUsedInput) setBookletUsedInput('0');
          },
        },
      ]
    );
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
            // Reset verification state
            setCustomerVerification({ 
              isSenior: false, 
              isPWD: false, 
              verified: false, 
              type: null 
            });
            // Clear booklet input when changing type
            setBookletUsedInput('');
          },
        },
      ]
    );
  };

  const handleFinalize = async () => {
    try {
      if (!customerVerification.verified) {
        Alert.alert('Customer Not Verified', 'Please verify customer type first.');
        return;
      }

      // Only check BNPC limits for Senior/PWD
      if (customerVerification.type === 'senior' || customerVerification.type === 'pwd') {
        if (bookletUsed + fivePercentDiscount > WEEKLY_CAP) {
          Alert.alert('Discount Limit Exceeded', 'Total discount exceeds weekly cap of ₱125');
          return;
        }

        if (bnpcSubtotal > PURCHASE_CAP) {
          Alert.alert('Purchase Limit Exceeded', 'BNPC purchase exceeds weekly limit of ₱2,500');
          return;
        }
      }

      if (cashReceived < finalTotal) {
        Alert.alert('Insufficient Cash', 'Cash received is less than total amount.');
        return;
      }

      const transactionLog = {
        timestamp: new Date().toISOString(),
        orderId: checkoutData?._id,
        checkoutCode,
        customerType: customerVerification.type || 'none',
        verificationSource: 'manual',
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
      };

      console.log('TRANSACTION COMPLETED:', transactionLog);

      const result = transactionLog.verificationSource !=="manual" && await payOrder(checkoutCode);
      
      navigation.navigate('OrderSummary', {
        transactionData: transactionLog,
        orderDetails: checkoutData,
      });

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Payment</Text>
            <Text style={styles.headerSubtitle}>#{checkoutCode}</Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        {/* Customer Verification */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Customer Verification</Text>
            
            {customerVerification.verified && (
              <TouchableOpacity
                style={styles.changeTypeButton}
                onPress={handleCustomerTypeChange}
              >
                <MaterialIcons name="edit" size={16} color="#3B82F6" />
                <Text style={styles.changeTypeText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {!customerVerification.verified ? (
            <View style={styles.verificationBox}>
              <Text style={styles.verificationText}>
                Verify customer for BNPC discounts
              </Text>
              <View style={styles.verificationButtons}>
                <TouchableOpacity
                  style={[styles.verifyButton, styles.seniorButton]}
                  onPress={() => handleCustomerVerify('senior')}
                >
                  <MaterialIcons name="elderly" size={20} color="#FFFFFF" />
                  <Text style={styles.verifyButtonText}>Senior Citizen</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.verifyButton, styles.pwdButton]}
                  onPress={() => handleCustomerVerify('pwd')}
                >
                  <MaterialIcons name="accessible" size={20} color="#FFFFFF" />
                  <Text style={styles.verifyButtonText}>Person with Disability</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.verifyButton, styles.regularButton]}
                  onPress={() => setCustomerVerification({
                    isSenior: false, isPWD: false, verified: true, type: 'regular'
                  })}
                >
                  <MaterialIcons name="person-outline" size={20} color="#374151" />
                  <Text style={styles.regularButtonText}>Regular Customer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.verifiedBox}>
              <View style={styles.verifiedHeader}>
                <MaterialIcons 
                  name="check-circle" 
                  size={20} 
                  color={customerVerification.type === 'regular' ? "#6B7280" : "#059669"} 
                />
                <Text style={[
                  styles.verifiedText,
                  customerVerification.type === 'regular' && styles.regularCustomerText
                ]}>
                  {customerVerification.type === 'senior' ? 'Senior Citizen' :
                   customerVerification.type === 'pwd' ? 'Person with Disability' :
                   'Regular Customer'} Verified
                </Text>
              </View>
              
              {(customerVerification.type === 'senior' || customerVerification.type === 'pwd') && (
                <Text style={styles.verifiedNote}>
                  5% BNPC discount auto-applies to eligible items
                </Text>
              )}
              
              {customerVerification.type === 'regular' && (
                <Text style={styles.regularCustomerNote}>
                  No BNPC discounts apply
                </Text>
              )}
            </View>
          )}
        </View>

        {/* BNPC Section - Only for Seniors/PWDs */}
        {customerVerification.verified && 
          (customerVerification.type === 'senior' || customerVerification.type === 'pwd') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="discount" size={20} color="#374151" />
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
                  <MaterialIcons name="check-circle" size={16} color="#059669" />
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
            <MaterialIcons name="receipt" size={20} color="#374151" />
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
            <MaterialIcons name="cash" size={20} color="#374151" />
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
            (!customerVerification.verified || cashReceived < finalTotal) && styles.finalizeButtonDisabled
          ]}
          onPress={handleFinalize}
          disabled={!customerVerification.verified || cashReceived < finalTotal}
        >
          <MaterialIcons name="check-circle" size={22} color="#FFFFFF" />
          <Text style={styles.finalizeButtonText}>
            {!customerVerification.verified ? 'VERIFY CUSTOMER FIRST' :
             cashReceived < finalTotal ? 'INSUFFICIENT CASH' :
             'FINALIZE TRANSACTION'}
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
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  headerSubtitle: { fontSize: 14, color: "#64748B", marginTop: 2 },
  headerRight: { width: 40 },
  section: {
    backgroundColor: "#FFFFFF", borderRadius: 12,
    padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16, fontWeight: "600", color: "#111827",
    marginLeft: 8,
    flex: 1,
  },
  changeTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
  },
  changeTypeText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  verificationBox: {
    backgroundColor: "#F8FAFC", borderRadius: 8, padding: 16,
  },
  verificationText: {
    fontSize: 14, color: "#6B7280",
    marginBottom: 16, textAlign: "center",
  },
  verificationButtons: { gap: 12 },
  verifyButton: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", paddingVertical: 14,
    paddingHorizontal: 16, borderRadius: 8, gap: 8,
  },
  seniorButton: { backgroundColor: "#00A86B" },
  pwdButton: { backgroundColor: "#00A86B" },
  regularButton: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1, borderColor: "#D1D5DB",
  },
  verifyButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  regularButtonText: { color: "#374151", fontSize: 15, fontWeight: "600" },
  verifiedBox: {
    backgroundColor: "#F0FDF4", borderRadius: 8, padding: 16,
    borderWidth: 1, borderColor: "#BBF7D0",
  },
  verifiedHeader: {
    flexDirection: "row", alignItems: "center", marginBottom: 8,
  },
  verifiedText: {
    fontSize: 15, fontWeight: "600", color: "#059669",
    marginLeft: 8,
  },
  regularCustomerText: {
    color: "#6B7280",
  },
  verifiedNote: {
    fontSize: 13, color: "#059669",
  },
  regularCustomerNote: {
    fontSize: 13, color: "#6B7280",
    fontStyle: 'italic',
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 13, color: "#6B7280", marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#F9FAFB", borderWidth: 1,
    borderColor: "#D1D5DB", borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 16, color: "#111827",
  },
  cashInput: {
    fontSize: 18, fontWeight: "600",
    textAlign: "center", paddingVertical: 12,
  },
  capsDisplay: {
    flexDirection: "row", backgroundColor: "#F8FAFC",
    borderRadius: 6, padding: 12, marginBottom: 16,
  },
  capItem: { flex: 1, alignItems: "center" },
  capLabel: { fontSize: 11, color: "#6B7280", marginBottom: 4 },
  capValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  capDivider: { width: 1, backgroundColor: "#E5E7EB" },
  discountAppliedBox: {
    backgroundColor: "#F0FDF4", borderWidth: 1,
    borderColor: "#BBF7D0", borderRadius: 6, padding: 12,
  },
  discountAppliedHeader: {
    flexDirection: "row", alignItems: "center", marginBottom: 4,
  },
  discountAppliedTitle: {
    fontSize: 13, fontWeight: "600", color: "#059669",
    marginLeft: 6,
  },
  discountAppliedAmount: {
    fontSize: 20, fontWeight: "700", color: "#059669",
  },
  amountsGrid: {
    backgroundColor: "#F9FAFB", borderRadius: 6, padding: 12,
  },
  amountRow: {
    flexDirection: "row", justifyContent: "space-between",
    marginBottom: 8,
  },
  amountLabel: { fontSize: 14, color: "#6B7280" },
  amountValue: { fontSize: 14, color: "#374151", fontWeight: "500" },
  discountValue: { color: "#059669", fontWeight: "700" },
  divider: {
    height: 1, backgroundColor: "#E5E7EB", marginVertical: 10,
  },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 16, fontWeight: "600", color: "#111827" },
  totalValue: { fontSize: 20, fontWeight: "700", color: "#111827" },
  changeBox: {
    backgroundColor: "#F9FAFB", borderRadius: 6,
    padding: 12, marginTop: 8,
  },
  changeRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center",
  },
  changeLabel: { fontSize: 14, color: "#6B7280" },
  changeValue: { fontSize: 18, fontWeight: "700" },
  changePositive: { color: "#059669" },
  changeNegative: { color: "#DC2626" },
  finalizeButton: {
    backgroundColor: "#111827", borderRadius: 8,
    padding: 18, flexDirection: "row",
    justifyContent: "center", alignItems: "center",
    marginTop: 8,
  },
  finalizeButtonDisabled: { backgroundColor: "#9CA3AF" },
  finalizeButtonText: {
    color: "#FFFFFF", fontSize: 16, fontWeight: "700",
    marginLeft: 8,
  },
  complianceNote: {
    textAlign: "center", fontSize: 12, color: "#6B7280",
    marginTop: 16, fontStyle: "italic",
  },
});

export default PaymentScreen;