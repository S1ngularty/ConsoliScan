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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// import api from '../../services/api';

const ManualEntryScreen = () => {
  const navigation = useNavigation();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a checkout code');
      return;
    }

    if (!/^[A-Z0-9]{8,12}$/i.test(code)) {
      Alert.alert('Error', 'Invalid code format. Must be 8-12 alphanumeric characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/checkout-queue/${code.trim().toUpperCase()}/validate`);
      
      if (response.data.status === 'SCANNED') {
        throw new Error('This code has already been scanned');
      }

      if (response.data.status === 'PAID') {
        throw new Error('This order has already been paid');
      }

      if (response.data.status === 'CANCELLED') {
        throw new Error('This order has been cancelled');
      }

      if (response.data.status === 'EXPIRED') {
        throw new Error('This checkout code has expired');
      }

      // Mark as scanned
      await api.post(`/checkout-queue/${code}/scan`);
      
      navigation.navigate('OrderDetails', {
        checkoutData: response.data,
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
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Manual Entry</Text>
            <Text style={styles.subtitle}>Enter customer's checkout code</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="keyboard" size={80} color="#00A86B" />
          </View>

          <Text style={styles.instruction}>
            Ask the customer for their checkout code
          </Text>

          <Text style={styles.example}>Example: ABC123XYZ</Text>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="qrcode" size={24} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Enter checkout code"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              maxLength={12}
              autoFocus
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (!code.trim() || isLoading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!code.trim() || isLoading}
          >
            {isLoading ? (
              <MaterialCommunityIcons name="loading" size={24} color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>Validate Code</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scanInsteadButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#666" />
            <Text style={styles.scanInsteadText}>Scan QR code instead</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <MaterialCommunityIcons name="information" size={16} color="#666" />
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
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 30,
  },
  instruction: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  example: {
    fontSize: 14,
    color: '#666',
    marginBottom: 40,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#00A86B',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#000',
    marginLeft: 12,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00A86B',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanInsteadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  scanInsteadText: {
    color: '#666',
    fontSize: 14,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 20,
    backgroundColor: '#f8f8f8',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default ManualEntryScreen;