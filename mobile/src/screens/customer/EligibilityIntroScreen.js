import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const EligibilityIntroScreen = ({ navigation }) => {
  const benefits = [
    {
      id: 1,
      icon: 'tag',
      title: 'Up to 20% Discount',
      description: 'Get discounts on all eligible products',
      color: '#00A86B',
    },
    {
      id: 2,
      icon: 'clock-outline',
      title: 'Priority Service',
      description: 'Get faster checkout and support',
      color: '#2196F3',
    },
    {
      id: 3,
      icon: 'star',
      title: 'Exclusive Offers',
      description: 'Access special promotions and deals',
      color: '#FF9800',
    },
    {
      id: 4,
      icon: 'shield-check',
      title: 'Verified Status',
      description: 'Get verified badge on your profile',
      color: '#4CAF50',
    },
  ];

  const eligibilityTypes = [
    {
      id: 'pwd',
      title: 'PWD (Person with Disability)',
      description: 'Persons with visual, hearing, physical, or mental disabilities',
      icon: 'wheelchair-accessibility',
    },
    {
      id: 'senior',
      title: 'Senior Citizen',
      description: '60 years old and above',
      icon: 'account-clock',
    },
  ];

  const requirements = [
    'Valid PWD ID or Senior Citizen ID',
    'Clear photo of ID (front & back)',
    'Recent passport-sized photo',
    'Government-issued ID for verification',
  ];

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
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <MaterialCommunityIcons name="badge-account" size={60} color="#00A86B" />
          <Text style={styles.heroTitle}>Get Verified for Discounts</Text>
          <Text style={styles.heroDescription}>
            Apply for PWD or Senior Citizen eligibility to enjoy special discounts and benefits
          </Text>
        </View>

        {/* Benefits Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <View style={styles.benefitsGrid}>
            {benefits.map((benefit) => (
              <View key={benefit.id} style={styles.benefitCard}>
                <View style={[styles.benefitIcon, { backgroundColor: `${benefit.color}15` }]}>
                  <MaterialCommunityIcons name={benefit.icon} size={24} color={benefit.color} />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Eligibility Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who Can Apply?</Text>
          <View style={styles.typesContainer}>
            {eligibilityTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.typeCard}
                onPress={() => navigation.navigate('EligibilityApply', { type: type.id })}
                activeOpacity={0.8}
              >
                <View style={styles.typeHeader}>
                  <MaterialCommunityIcons name={type.icon} size={24} color="#00A86B" />
                  <Text style={styles.typeTitle}>{type.title}</Text>
                </View>
                <Text style={styles.typeDescription}>{type.description}</Text>
                <View style={styles.typeArrow}>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#00A86B" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <View style={styles.requirementsCard}>
            {requirements.map((requirement, index) => (
              <View key={index} style={styles.requirementItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#00A86B" />
                <Text style={styles.requirementText}>{requirement}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Process Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Submit Application</Text>
                <Text style={styles.stepDescription}>
                  Fill out the form and upload required documents
                </Text>
              </View>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Verification</Text>
                <Text style={styles.stepDescription}>
                  Our team will review your application (1-3 business days)
                </Text>
              </View>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Get Verified</Text>
                <Text style={styles.stepDescription}>
                  Enjoy discounts immediately after verification
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => navigation.navigate('EligibilityApply', { type: 'pwd' })}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="file-document-edit" size={22} color="#fff" />
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.learnMoreButton}>
            <Text style={styles.learnMoreText}>Learn More About Eligibility</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#00A86B" />
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
  heroCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  benefitCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  benefitDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  typesContainer: {
    gap: 12,
  },
  typeCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  typeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 36,
  },
  typeArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  requirementsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
    lineHeight: 20,
  },
  stepsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00A86B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: '#00A86B',
    marginLeft: 15,
    marginVertical: 4,
    opacity: 0.3,
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00A86B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  learnMoreText: {
    color: '#00A86B',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default EligibilityIntroScreen;