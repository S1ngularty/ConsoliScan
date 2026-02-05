import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';

const EligibilityApplyScreen = ({ navigation, route }) => {
  const { type } = route.params || { type: 'pwd' }; // pwd or senior
  const user = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    idNumber: '',
    idType: type,
    dateIssued: new Date(),
    expiryDate: type === 'senior' ? null : new Date(),
    typeOfDisability: type === 'pwd' ? '' : null,
  });
  
  const [images, setImages] = useState({
    idFront: null,
    idBack: null,
    userPhoto: null,
  });

  const [showDateIssuedPicker, setShowDateIssuedPicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  const disabilityTypes = [
    { id: 'visual', label: 'Visual Impairment' },
    { id: 'hearing', label: 'Hearing Impairment' },
    { id: 'physical', label: 'Physical Disability' },
    { id: 'mental', label: 'Mental Disability' },
    { id: 'multiple', label: 'Multiple Disabilities' },
  ];

  useEffect(() => {
    // Request permissions
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to photos to upload images.');
      }
    })();
  }, []);

  const handlePickImage = async (imageType) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImages(prev => ({
          ...prev,
          [imageType]: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleDateChange = (event, selectedDate, dateType) => {
    const currentDate = selectedDate || (dateType === 'dateIssued' ? formData.dateIssued : formData.expiryDate);
    
    if (dateType === 'dateIssued') {
      setShowDateIssuedPicker(false);
      setFormData({ ...formData, dateIssued: currentDate });
    } else {
      setShowExpiryDatePicker(false);
      setFormData({ ...formData, expiryDate: currentDate });
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const validateForm = () => {
    if (!formData.idNumber.trim()) {
      Alert.alert('Error', 'Please enter your ID number');
      return false;
    }

    if (formData.idType === 'pwd' && !formData.typeOfDisability) {
      Alert.alert('Error', 'Please select type of disability');
      return false;
    }

    if (!images.idFront || !images.idBack) {
      Alert.alert('Error', 'Please upload both front and back of your ID');
      return false;
    }

    if (!images.userPhoto) {
      Alert.alert('Error', 'Please upload your passport-sized photo');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Here you would upload images to your server and submit the form
      // For now, we'll simulate an API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Application Submitted',
        'Your eligibility application has been submitted successfully. Our team will review it within 1-3 business days.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('EligibilityStatus'),
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderImageUpload = (label, imageType, required = true) => (
    <View style={styles.uploadSection}>
      <Text style={styles.uploadLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => handlePickImage(imageType)}
        activeOpacity={0.8}
      >
        {images[imageType] ? (
          <View style={styles.uploadedImage}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#00A86B" />
            <Text style={styles.uploadedText}>Image Uploaded</Text>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <MaterialCommunityIcons name="camera-plus" size={32} color="#ccc" />
            <Text style={styles.uploadPlaceholderText}>Tap to upload</Text>
          </View>
        )}
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>
          Apply for {type === 'pwd' ? 'PWD' : 'Senior Citizen'} Discount
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.formContainer}>
          {/* ID Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              ID Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.idNumber}
              onChangeText={(text) => setFormData({ ...formData, idNumber: text })}
              placeholder={`Enter ${type === 'pwd' ? 'PWD' : 'Senior Citizen'} ID number`}
              placeholderTextColor="#999"
            />
          </View>

          {/* Date Issued */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Date Issued <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDateIssuedPicker(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="calendar" size={20} color="#666" />
              <Text style={styles.dateText}>{formatDate(formData.dateIssued)}</Text>
            </TouchableOpacity>
            {showDateIssuedPicker && (
              <DateTimePicker
                value={formData.dateIssued}
                mode="date"
                display="default"
                onChange={(event, date) => handleDateChange(event, date, 'dateIssued')}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Expiry Date (optional for seniors) */}
          {type !== 'senior' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expiry Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowExpiryDatePicker(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#666" />
                <Text style={styles.dateText}>{formatDate(formData.expiryDate)}</Text>
              </TouchableOpacity>
              {showExpiryDatePicker && (
                <DateTimePicker
                  value={formData.expiryDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => handleDateChange(event, date, 'expiryDate')}
                  minimumDate={formData.dateIssued}
                />
              )}
            </View>
          )}

          {/* Disability Type (only for PWD) */}
          {type === 'pwd' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Type of Disability <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.disabilityGrid}>
                {disabilityTypes.map((disability) => (
                  <TouchableOpacity
                    key={disability.id}
                    style={[
                      styles.disabilityButton,
                      formData.typeOfDisability === disability.id && styles.disabilityButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, typeOfDisability: disability.id })}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.disabilityButtonText,
                      formData.typeOfDisability === disability.id && styles.disabilityButtonTextActive,
                    ]}>
                      {disability.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Image Uploads */}
          {renderImageUpload('ID Front Photo', 'idFront')}
          {renderImageUpload('ID Back Photo', 'idBack')}
          {renderImageUpload('Passport-sized Photo', 'userPhoto')}

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <MaterialCommunityIcons name="information" size={20} color="#666" />
            <Text style={styles.termsText}>
              By submitting this application, you agree that the information provided is accurate and authentic.
              False information may result in rejection of your application.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="send-check" size={22} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Application</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  disabilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  disabilityButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabilityButtonActive: {
    backgroundColor: '#00A86B',
    borderColor: '#00A86B',
  },
  disabilityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  disabilityButtonTextActive: {
    color: '#fff',
  },
  uploadSection: {
    marginBottom: 24,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadPlaceholderText: {
    color: '#999',
    marginTop: 8,
    fontSize: 14,
  },
  uploadedImage: {
    alignItems: 'center',
  },
  uploadedText: {
    color: '#00A86B',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 24,
    gap: 12,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00A86B',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default EligibilityApplyScreen;