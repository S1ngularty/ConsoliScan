// screens/cashier/ManualEntryScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getCheckoutDetails } from '../../api/checkout.api';
const ManualEntryScreen = () => {
  const navigation = useNavigation();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a checkout code');
      return;
    }
    // if (!/^[A-Z0-9]{8,12}$/i.test(code)) {
    //   Alert.alert('Error', 'Invalid code format. Must be 8-12 alphanumeric characters');
    //   return;
    // }

    setIsLoading(true);
    try {
      const data = await getCheckoutDetails(code)
          if(!data) throw new Error("cannot find the order")

      // Mark as scanned - comment this out when using real API
      
      navigation.navigate('OrderDetails', {
        checkoutData: data,
        checkoutCode: code.trim().toUpperCase()
      });

      
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to validate checkout code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Manual Entry</Text>
            <Text style={styles.subtitle}>Enter checkout code</Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="keyboard-outline" size={48} color="#00A86B" />
              </View>
            </View>

            <View style={styles.instructionContainer}>
              <Text style={styles.instruction}>
                Ask customer for checkout code
              </Text>
              <Text style={styles.example}>Example: ABC123XYZ</Text>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons name="barcode" size={22} color="#64748B" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 8-12 digit code"
                  placeholderTextColor="#94A3B8"
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                  maxLength={12}
                  autoFocus
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!code.trim() || isLoading) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!code.trim() || isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle" size={22} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Validate Code</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scanInsteadButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={18} color="#64748B" />
                <Text style={styles.scanInsteadText}>Scan QR code instead</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Help Section */}
        <View style={styles.helpContainer}>
          <View style={styles.helpHeader}>
            <MaterialCommunityIcons name="information-outline" size={18} color="#64748B" />
            <Text style={styles.helpTitle}>Note</Text>
          </View>
          <Text style={styles.helpText}>
            The checkout code is displayed on the customer's device after they confirm their order
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
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
  headerRightPlaceholder: {
    width: 44,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#E8F5EF',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  instruction: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  example: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  inputSection: {
    width: '100%',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8F5EF',
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '500',
    height: '100%',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00A86B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scanInsteadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  scanInsteadText: {
    color: '#64748B',
    fontSize: 14,
    marginLeft: 8,
  },
  helpContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F5EF',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 6,
  },
  helpText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});

export default ManualEntryScreen;