import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const EligibilityStatusScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [eligibleData, setEligibleData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const fetchEligibilityData = async () => {
    try {
      setLoading(true);
      // Replace with your actual API call
      const response = await axios.get('/api/eligibility/status');
      setEligibleData(response.data);
    } catch (error) {
      console.error('Error fetching eligibility data:', error);
      // If no eligibility data found, set to null
      setEligibleData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/user/profile');
      setUserProfile(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEligibilityData();
      fetchUserProfile();
    }, [])
  );

  const handleRemoveEligibility = () => {
    Alert.alert(
      'Remove Eligibility',
      'Are you sure you want to remove your eligibility status? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete('/api/eligibility');
              Alert.alert('Success', 'Eligibility status removed successfully');
              fetchEligibilityData();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove eligibility status');
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return { icon: 'check-circle', color: '#4CAF50' };
      case 'pending':
        return { icon: 'clock', color: '#FF9800' };
      case 'rejected':
        return { icon: 'close-circle', color: '#F44336' };
      default:
        return { icon: 'account-question', color: '#9E9E9E' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Applied';
    }
  };

  const getEligibilityTypeText = (type) => {
    switch (type) {
      case 'pwd':
        return 'PWD (Person with Disability)';
      case 'senior':
        return 'Senior Citizen';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
          <Text style={styles.loadingText}>Loading eligibility status...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Eligibility Discount</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIconContainer}>
              {eligibleData ? (
                <>
                  <MaterialCommunityIcons
                    name={getStatusIcon(eligibleData.isVerified ? 'verified' : 'pending').icon}
                    size={40}
                    color={getStatusIcon(eligibleData.isVerified ? 'verified' : 'pending').color}
                  />
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {getStatusText(eligibleData.isVerified ? 'verified' : 'pending')}
                    </Text>
                  </View>
                </>
              ) : (
                <MaterialCommunityIcons
                  name={getStatusIcon().icon}
                  size={40}
                  color={getStatusIcon().color}
                />
              )}
            </View>
            <Text style={styles.statusTitle}>
              {eligibleData
                ? getEligibilityTypeText(eligibleData.idType)
                : 'Eligibility Status'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {eligibleData
                ? eligibleData.isVerified
                  ? 'You are eligible for discounts'
                  : 'Your application is under review'
                : 'Apply for eligibility discounts'}
            </Text>
          </View>

          {eligibleData ? (
            <>
              {/* Eligibility Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Eligibility Details</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ID Number</Text>
                  <Text style={styles.detailValue}>{eligibleData.idNumber}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ID Type</Text>
                  <Text style={styles.detailValue}>
                    {getEligibilityTypeText(eligibleData.idType)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Date Issued</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(eligibleData.dateIssued)}
                  </Text>
                </View>
                {eligibleData.expiryDate && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Expiry Date</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(eligibleData.expiryDate)}
                    </Text>
                  </View>
                )}
                {eligibleData.typeOfDisability && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Type of Disability</Text>
                    <Text style={styles.detailValue}>
                      {eligibleData.typeOfDisability.charAt(0).toUpperCase() +
                        eligibleData.typeOfDisability.slice(1)}
                    </Text>
                  </View>
                )}
                {eligibleData.verifiedAt && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Verified On</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(eligibleData.verifiedAt)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                {!eligibleData.isVerified && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('EligibilityApply', { data: eligibleData })}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color="#00A86B" />
                    <Text style={styles.actionButtonText}>Update Application</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={handleRemoveEligibility}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#F44336" />
                  <Text style={[styles.actionButtonText, styles.removeButtonText]}>
                    Remove Eligibility
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* No Eligibility State */
            <View style={styles.noEligibilityContainer}>
              <MaterialCommunityIcons
                name="badge-account-horizontal-outline"
                size={60}
                color="#9E9E9E"
              />
              <Text style={styles.noEligibilityTitle}>No Eligibility Status</Text>
              <Text style={styles.noEligibilityText}>
                Apply for PWD or Senior Citizen eligibility to enjoy special discounts and benefits
              </Text>
              <TouchableOpacity
                style={styles.applyNowButton}
                onPress={() => navigation.navigate('EligibilityIntro')}
              >
                <Text style={styles.applyNowButtonText}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Benefits Section */}
        {eligibleData?.isVerified && (
          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>Current Benefits</Text>
            <View style={styles.benefitsCard}>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="tag" size={24} color="#00A86B" />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>20% Discount</Text>
                  <Text style={styles.benefitDescription}>
                    Applied automatically to eligible products
                  </Text>
                </View>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="star" size={24} color="#FF9800" />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Exclusive Offers</Text>
                  <Text style={styles.benefitDescription}>
                    Special promotions for eligible members
                  </Text>
                </View>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="shield-check" size={24} color="#4CAF50" />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Verified Badge</Text>
                  <Text style={styles.benefitDescription}>
                    Verified status on your profile
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <TouchableOpacity style={styles.helpCard}>
            <MaterialCommunityIcons name="help-circle" size={24} color="#2196F3" />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>FAQ & Support</Text>
              <Text style={styles.helpDescription}>
                Find answers to common questions
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
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
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  statusHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  detailsSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  actionsContainer: {
    padding: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#00A86B',
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00A86B',
  },
  removeButton: {
    borderColor: '#F44336',
  },
  removeButtonText: {
    color: '#F44336',
  },
  noEligibilityContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noEligibilityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  noEligibilityText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  applyNowButton: {
    backgroundColor: '#00A86B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  applyNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  benefitsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  benefitContent: {
    flex: 1,
    marginLeft: 16,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666',
  },
  helpSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  helpContent: {
    flex: 1,
    marginLeft: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default EligibilityStatusScreen;