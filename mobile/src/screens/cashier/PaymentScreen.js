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
import { CheckBox } from 'react-native-elements';

const WEEKLY_CAP = 125;
const PURCHASE_CAP = 2500;

const PaymentScreen = ({ route, navigation }) => {
  const { checkoutData, checkoutCode, appUser=false } = route.params;
  console.log("PaymentScreen checkoutData:", checkoutData);
  console.log(appUser)
  
  // Extract all data from checkout payload
  const userEligibility = checkoutData?.userEligibility || {};
  const { 
    isSenior = false, 
    isPWD = false, 
    verified = false, 
    discountScope = null, 
    currentUsage = {},
    eligibilityStatus = null,
    eligibilityExpiry = null,
    verificationId = null
  } = userEligibility;
  
  // Customer verification from multiple sources
  const customerVerification = checkoutData?.customerVerification || {};
  const systemVerified = verified || customerVerification?.verified || false;
  const systemVerificationType = discountScope || customerVerification?.type || null;
  const systemVerificationSource = customerVerification?.verificationSource || 'system';
  
  // DETERMINE USER ELIGIBILITY FOR APP USERS
  const userEligibilityType = useMemo(() => {
    if (!appUser) return null; // Not an app user, cashier will verify manually
    
    // Check if user is eligible from the checkout data
    if (isSenior || discountScope === 'SENIOR') return 'senior';
    if (isPWD || discountScope === 'PWD') return 'pwd';
    
    // If user data has eligibility status field
    if (eligibilityStatus === 'senior') return 'senior';
    if (eligibilityStatus === 'pwd') return 'pwd';
    
    return 'regular'; // Default to regular if no eligibility found
  }, [appUser, isSenior, isPWD, discountScope, eligibilityStatus]);
  
  // Get pre-calculated discount data from server
  const discountSnapshot = checkoutData?.discountSnapshot || {};
  const systemDiscountApplied = discountSnapshot.discountApplied || 0;
  const systemBnpcEligibleSubtotal = discountSnapshot.bnpcEligibleSubtotal || 0;
  const systemEligible = discountSnapshot.eligible || false;
  const systemCappedBNPCAmount = discountSnapshot.cappedBNPCAmount || 0;
  const systemRemainingPurchaseCap = discountSnapshot.remainingPurchaseCap || PURCHASE_CAP;
  const systemRemainingDiscountCap = discountSnapshot.remainingDiscountCap || WEEKLY_CAP;
  const systemWeeklyPurchaseUsed = discountSnapshot.weeklyPurchaseUsed || 0;
  const systemWeeklyDiscountUsed = discountSnapshot.weeklyDiscountUsed || 0;
  const systemWeekStart = discountSnapshot.weekStart;
  const systemWeekEnd = discountSnapshot.weekEnd;
  
  // Get weekly usage from system
  const weeklyUsageSnapshot = checkoutData?.weeklyUsageSnapshot || {};
  const systemBookletUsedBefore = weeklyUsageSnapshot.discountUsed || currentUsage?.discountUsed || 0;
  const systemPurchaseUsedBefore = weeklyUsageSnapshot.bnpcAmountUsed || currentUsage?.purchasedUsed || 0;
  const systemWeekStartUsage = weeklyUsageSnapshot.weekStart || currentUsage?.weekStart;
  const systemWeekEndUsage = weeklyUsageSnapshot.weekEnd || currentUsage?.weekEnd;
  
  // Get totals from server calculation
  const totals = checkoutData?.totals || {};
  const subtotal = totals.subtotal || 0;
  const bnpcEligibleSubtotal = totals.bnpcEligibleSubtotal || systemBnpcEligibleSubtotal || 0;
  const bnpcDiscount = totals.bnpcDiscount || 0;
  const promoDiscount = totals.promoDiscount || 0;
  const loyaltyDiscount = totals.loyaltyDiscount || 0;
  const finalTotalFromServer = totals.finalTotal || subtotal;
  
  // Get discount breakdown
  const discountBreakdown = checkoutData?.discountBreakdown || {};
  const serverBnpcDiscount = discountBreakdown.bnpcDiscount || bnpcDiscount;
  const serverPromoDiscount = discountBreakdown.promoDiscount || promoDiscount;
  const serverLoyaltyDiscount = discountBreakdown.loyaltyDiscount || loyaltyDiscount;
  
  // Get promo data
  const promoData = checkoutData?.promo || {};
  const hasPromo = promoData && Object.keys(promoData).length > 0;
  const promoCode = promoData?.code || '';
  const promoDiscountAmount = promoData?.discountAmount || serverPromoDiscount;
  
  // Get loyalty points data
  const loyaltyPointsData = checkoutData?.loyaltyPoints || {};
  const hasLoyaltyPoints = loyaltyPointsData && Object.keys(loyaltyPointsData).length > 0;
  const loyaltyPointsUsed = loyaltyPointsData?.pointsUsed || 0;
  const loyaltyDiscountAmount = loyaltyPointsData?.discountAmount || serverLoyaltyDiscount;
  
  const pointsEarned = checkoutData?.pointsEarned || 0;
  
  // Get BNPC products for display
  const bnpcProducts = checkoutData?.bnpcProducts || [];
  const hasBNPCProducts = bnpcProducts.length > 0;
  
  // Get voucher (legacy)
  const voucher = checkoutData?.voucher?.discountAmount || 0;

  // State for cashier inputs
  const [bookletUsedInput, setBookletUsedInput] = useState(
    (systemVerified && (systemDiscountApplied > 0 || serverBnpcDiscount > 0)) 
      ? systemBookletUsedBefore.toString() 
      : '0'
  );
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  const [bookletUpdated, setBookletUpdated] = useState(false); // New checkbox state
  
  // Parse inputs
  const bookletUsed = Math.min(parseFloat(bookletUsedInput) || 0, WEEKLY_CAP);
  const cashReceived = parseFloat(cashReceivedInput) || 0;
  
  // Manual verification state (for cashier override) - AUTO SET FOR APP USERS
  const [manualVerification, setManualVerification] = useState({
    verified: appUser ? true : systemVerified, // Auto-verify app users
    type: appUser ? userEligibilityType : systemVerificationType, // Auto-set type for app users
    scope: appUser ? 
      (userEligibilityType === 'senior' ? 'SENIOR' : userEligibilityType === 'pwd' ? 'PWD' : null) 
      : discountScope,
    override: false, // Not an override if auto-set
  });

  // Effect to auto-apply eligibility when appUser changes or eligibility data loads
  useEffect(() => {
    if (appUser && userEligibilityType) {
      setManualVerification({
        verified: true,
        type: userEligibilityType,
        scope: userEligibilityType === 'senior' ? 'SENIOR' : 
               userEligibilityType === 'pwd' ? 'PWD' : null,
        override: false, // Not an override, it's the actual user data
      });
      
      // Auto-set booklet input based on user's previous usage
      if (userEligibilityType !== 'regular' && bnpcEligibleSubtotal > 0) {
        setBookletUsedInput(systemBookletUsedBefore.toString() || '0');
      } else {
        setBookletUsedInput('0');
      }
      
      console.log(`Auto-set user eligibility: ${userEligibilityType}`);
    }
  }, [appUser, userEligibilityType, bnpcEligibleSubtotal, systemBookletUsedBefore]);

  // Calculate 5% discount based on CURRENT verification status
  const fivePercentDiscount = useMemo(() => {
    // Determine current verification status
    const currentVerificationType = manualVerification.verified ? 
      manualVerification.type : systemVerificationType;
    
    const isEligibleForDiscount = (manualVerification.verified || systemVerified) && 
      (currentVerificationType === 'senior' || currentVerificationType === 'pwd');
    
    if (!isEligibleForDiscount || bnpcEligibleSubtotal === 0) return 0;
    
    const discountAmount = bnpcEligibleSubtotal * 0.05;
    const remainingDiscountCap = WEEKLY_CAP - bookletUsed;
    return Math.min(discountAmount, remainingDiscountCap);
  }, [manualVerification, systemVerified, systemVerificationType, bnpcEligibleSubtotal, bookletUsed]);
  
  // Calculate remaining caps
  const remainingDiscountCap = Math.max(WEEKLY_CAP - bookletUsed, 0);
  const remainingPurchaseCap = Math.max(PURCHASE_CAP - bnpcEligibleSubtotal, 0);
  
  // Final totals
  const finalTotal = Math.max(subtotal - fivePercentDiscount - promoDiscountAmount - loyaltyDiscountAmount - voucher, 0);
  const changeDue = cashReceived - finalTotal;

  const handleManualVerify = (type) => {
    // For app users, show confirmation but keep the type
    if (appUser && manualVerification.verified) {
      Alert.alert(
        'App User Already Verified',
        `This customer is already verified as ${manualVerification.type === 'senior' ? 'Senior' : 'PWD'} through the app.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      `Verify ${type === 'senior' ? 'Senior Citizen' : 'PWD'}`,
      'Check ID and purchase booklet',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            // Don't reset if already verified by system
            if (!systemVerified && !appUser) {
              setManualVerification({ verified: false, type: null, scope: null, override: false });
            }
          }
        },
        {
          text: 'Confirm',
          onPress: () => {
            setManualVerification({
              verified: true,
              type: type,
              scope: type === 'senior' ? 'SENIOR' : 'PWD',
              override: true, // Mark as manual override
            });
            
            // Set default booklet input if empty
            if (!bookletUsedInput && bnpcEligibleSubtotal > 0) {
              setBookletUsedInput(systemBookletUsedBefore.toString() || '0');
            }
          },
        },
      ]
    );
  };

  const handleSetRegular = () => {
    // For app users, check if they're actually eligible
    if (appUser && userEligibilityType !== 'regular') {
      Alert.alert(
        'Eligible Customer',
        `This customer is verified as ${userEligibilityType === 'senior' ? 'Senior' : 'PWD'} in the app. Setting as regular will remove their BNPC discount.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Set as Regular Anyway',
            onPress: () => {
              setManualVerification({
                verified: true,
                type: 'regular',
                scope: null,
                override: true
              });
              setBookletUsedInput('0');
            }
          }
        ]
      );
      return;
    }
    
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
                scope: null,
                override: true
              });
              
              // Set booklet to zero for regular customers
              if (bookletUsedInput !== '0') {
                setBookletUsedInput('0');
              }
            }
          },
        ]
      );
    } else {
      setManualVerification({
        verified: true,
        type: 'regular',
        scope: null,
        override: true
      });
      
      // Set booklet to zero for regular customers
      if (bookletUsedInput !== '0') {
        setBookletUsedInput('0');
      }
    }
  };

  const handleCustomerTypeChange = () => {
    Alert.alert(
      'Change Customer Type',
      appUser && userEligibilityType !== 'regular' 
        ? 'This customer has verified eligibility in the app. Changing will override their app status.'
        : 'Are you sure you want to change customer type?',
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
              scope: null,
              override: true 
            });
            
            // Reset booklet input
            if (bookletUsedInput !== systemBookletUsedBefore.toString()) {
              setBookletUsedInput(systemBookletUsedBefore.toString() || '0');
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

      // Check if booklet was updated for eligible customers
      const finalVerificationType = manualVerification.verified ? 
        manualVerification.type : systemVerificationType;
      
      if ((finalVerificationType === 'senior' || finalVerificationType === 'pwd') && !bookletUpdated) {
        Alert.alert(
          'Booklet Not Updated',
          'Please confirm that you have updated the physical BNPC booklet before finalizing.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue Anyway', onPress: proceedWithPayment }
          ]
        );
        return;
      }
      
      proceedWithPayment();
      
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    }
  };

  const proceedWithPayment = async () => {
    try {
      // Determine final verification type
      const finalVerificationType = manualVerification.verified ? 
        manualVerification.type : systemVerificationType;
      const finalVerificationScope = manualVerification.verified ?
        manualVerification.scope : discountScope;
      
      // Only check BNPC limits for Senior/PWD
      if (finalVerificationType === 'senior' || finalVerificationType === 'pwd') {
        if (bookletUsed + fivePercentDiscount > WEEKLY_CAP) {
          Alert.alert('Discount Limit Exceeded', 'Total discount exceeds weekly cap of ₱125');
          return;
        }

        if (bnpcEligibleSubtotal > PURCHASE_CAP) {
          Alert.alert('Purchase Limit Exceeded', 'BNPC purchase exceeds weekly limit of ₱2,500');
          return;
        }
      }

      // Determine verification source
      const verificationSource = manualVerification.override ? 'manual' : 
        (systemVerified ? systemVerificationSource : 
         appUser ? 'app_auto' : 'manual');

      // Calculate updated weekly usage (for booklet)
      const newDiscountUsed = systemBookletUsedBefore + (fivePercentDiscount > 0 ? fivePercentDiscount : 0);
      const newPurchaseUsed = systemPurchaseUsedBefore + (bnpcEligibleSubtotal || 0);

      // Create comprehensive transaction log
      const transactionLog = {
        timestamp: new Date().toISOString(),
        orderId: checkoutData?._id,
        checkoutCode,
        appUser: appUser,
        
        // Customer information
        customerType: finalVerificationType || 'regular',
        customerScope: finalVerificationScope,
        verificationSource: verificationSource,
        systemVerified: systemVerified,
        systemVerificationType: systemVerificationType,
        manualOverride: manualVerification.override,
        appAutoVerified: appUser && !manualVerification.override,
        
        // Booklet tracking
        bookletUpdated: bookletUpdated, // Track if booklet was physically updated
        bookletAmountEntered: bookletUsed,
        
        // Amounts
        amounts: {
          subtotal,
          bnpcEligibleSubtotal,
          bnpcDiscount: fivePercentDiscount,
          serverBnpcDiscount: serverBnpcDiscount,
          promoDiscount: promoDiscountAmount,
          promoCode: promoCode,
          loyaltyDiscount: loyaltyDiscountAmount,
          loyaltyPointsUsed: loyaltyPointsUsed,
          voucherDiscount: voucher,
          totalDiscount: fivePercentDiscount + promoDiscountAmount + loyaltyDiscountAmount + voucher,
          finalTotal,
          cashReceived,
          changeDue: Math.max(changeDue, 0),
        },
        
        // Weekly caps and usage
        caps: {
          bookletUsedBefore: systemBookletUsedBefore,
          purchaseUsedBefore: systemPurchaseUsedBefore,
          bookletUsedAfter: newDiscountUsed,
          purchaseUsedAfter: newPurchaseUsed,
          remainingDiscountCap,
          remainingPurchaseCap,
          weekStart: systemWeekStartUsage || systemWeekStart,
          weekEnd: systemWeekEndUsage || systemWeekEnd,
        },
        
        // Server calculations
        serverCalculations: {
          discountSnapshot,
          weeklyUsageSnapshot,
          totals,
        },
        
        // Promo details
        promo: hasPromo ? {
          code: promoCode,
          discountAmount: promoDiscountAmount,
        } : null,
        
        // Loyalty details
        loyalty: hasLoyaltyPoints ? {
          pointsUsed: loyaltyPointsUsed,
          discountAmount: loyaltyDiscountAmount,
          pointsEarned,
        } : null,
        
        // BNPC products
        bnpcProducts: bnpcProducts.map(p => ({
          name: p.name,
          quantity: p.quantity,
          price: p.price,
        })),
        
        // Cashier info
        cashier: checkoutData?.cashier,
      };

      console.log('TRANSACTION COMPLETED:', JSON.stringify(transactionLog, null, 2));
      
      // Call payOrder API if appUser
      if (appUser) {
        await payOrder(checkoutCode);
      }
      
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

  // Show app user badge with eligibility
  const renderAppUserBadge = () => {
    if (!appUser) return null;
    
    return (
      <View style={[
        styles.appUserBadge,
        userEligibilityType !== 'regular' && styles.appUserEligibleBadge
      ]}>
        <Ionicons 
          name={userEligibilityType !== 'regular' ? "checkmark-circle" : "person"} 
          size={16} 
          color={userEligibilityType !== 'regular' ? "#10B981" : "#6B7280"} 
        />
        <Text style={[
          styles.appUserBadgeText,
          userEligibilityType !== 'regular' && styles.appUserEligibleText
        ]}>
          App User: {userEligibilityType === 'senior' ? 'Senior Citizen' :
                     userEligibilityType === 'pwd' ? 'PWD' : 'Regular Customer'}
        </Text>
      </View>
    );
  };

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

        {/* App User Badge - Auto eligibility status */}
        {renderAppUserBadge()}

        {/* System Verification Badge (if applicable) */}
        {systemVerified && !manualVerification.override && !appUser && (
          <View style={styles.systemVerifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.systemVerifiedText}>
              System verified as {systemVerificationType === 'senior' ? 'Senior' : 
                systemVerificationType === 'pwd' ? 'PWD' : 'Regular'}
            </Text>
          </View>
        )}

        {/* Auto-verified badge for app users */}
        {appUser && manualVerification.verified && !manualVerification.override && (
          <View style={styles.autoVerifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.autoVerifiedText}>
              Auto-verified from app: {manualVerification.type === 'senior' ? 'Senior' : 
                manualVerification.type === 'pwd' ? 'PWD' : 'Regular'}
            </Text>
          </View>
        )}

        {/* Promo Badge */}
        {hasPromo && (
          <View style={styles.promoBadge}>
            <Ionicons name="pricetag" size={16} color="#FF9800" />
            <Text style={styles.promoBadgeText}>
              Promo {promoCode}: -₱{promoDiscountAmount.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Loyalty Badge */}
        {hasLoyaltyPoints && (
          <View style={styles.loyaltyBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.loyaltyBadgeText}>
              {loyaltyPointsUsed} points used: -₱{loyaltyDiscountAmount.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Points Earned Badge */}
        {pointsEarned > 0 && (
          <View style={styles.pointsEarnedBadge}>
            <Ionicons name="gift" size={16} color="#FFD700" />
            <Text style={styles.pointsEarnedBadgeText}>
              Earn {pointsEarned} points
            </Text>
          </View>
        )}

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
            
            {isCustomerVerifiedForDiscount && !manualVerification.override && !appUser && (
              <View style={styles.appVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.appVerifiedText}>App</Text>
              </View>
            )}
            
            {appUser && manualVerification.verified && !manualVerification.override && (
              <View style={styles.appVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.appVerifiedText}>Auto</Text>
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
                  {!manualVerification.override && appUser ? ' (Auto)' : 
                   !manualVerification.override && ' (App)'}
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
                  5% BNPC discount applies
                </Text>
              )}
              
              {manualVerification.type === 'regular' && hasBNPCProducts && (
                <Text style={styles.regularWarning}>
                  ⚠️ No BNPC discount applied
                </Text>
              )}
            </View>
          )}
        </View>

        {/* BNPC Section - WITH CHECKBOX */}
        {isCustomerVerifiedForDiscount && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={18} color="#374151" />
              <Text style={styles.sectionTitle}>BNPC Discount</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Booklet Used This Week (₱)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={bookletUsedInput}
                onChangeText={setBookletUsedInput}
                placeholder="0.00"
                editable={true} // Always editable for cashier input
              />
              {appUser && (
                <Text style={styles.inputNote}>
                  Previous usage: ₱{systemBookletUsedBefore.toFixed(2)}
                </Text>
              )}
            </View>
            
            {/* Booklet Updated Checkbox */}
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setBookletUpdated(!bookletUpdated)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                bookletUpdated && styles.checkboxChecked
              ]}>
                {bookletUpdated && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                I have updated the physical BNPC booklet
              </Text>
            </TouchableOpacity>
            
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
            
            {/* Show system calculated discount for reference */}
            {serverBnpcDiscount > 0 && fivePercentDiscount !== serverBnpcDiscount && (
              <Text style={styles.systemReferenceText}>
                System calculated: ₱{serverBnpcDiscount.toFixed(2)}
              </Text>
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
            
            {bnpcEligibleSubtotal > 0 && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>BNPC Eligible</Text>
                <Text style={styles.amountValue}>₱{bnpcEligibleSubtotal.toFixed(2)}</Text>
              </View>
            )}
            
            {fivePercentDiscount > 0 && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>BNPC Discount (5%)</Text>
                <Text style={[styles.amountValue, styles.discountValue]}>
                  -₱{fivePercentDiscount.toFixed(2)}
                </Text>
              </View>
            )}
            
            {promoDiscountAmount > 0 && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Promo {promoCode}</Text>
                <Text style={[styles.amountValue, styles.discountValue]}>
                  -₱{promoDiscountAmount.toFixed(2)}
                </Text>
              </View>
            )}
            
            {loyaltyDiscountAmount > 0 && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Loyalty Points</Text>
                <Text style={[styles.amountValue, styles.discountValue]}>
                  -₱{loyaltyDiscountAmount.toFixed(2)}
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
          Note: Always update the physical BNPC booklet and check the box above
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
  appUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  appUserEligibleBadge: {
    backgroundColor: '#F0FDF4',
  },
  appUserBadgeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  appUserEligibleText: {
    color: '#10B981',
    fontWeight: '600',
  },
  autoVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  autoVerifiedText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 6,
  },
  systemVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  systemVerifiedText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 6,
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  promoBadgeText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 6,
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  loyaltyBadgeText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 6,
  },
  pointsEarnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 16,
  },
  pointsEarnedBadgeText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 6,
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
  inputNote: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#00A86B',
    borderColor: '#00A86B',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
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
  systemReferenceText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
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