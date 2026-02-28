import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const EligibilityApplyScreen = ({ navigation, route }) => {
  const { type } = route.params || { type: "pwd" }; // pwd or senior
  const [images, setImages] = useState({
    idFront: null,
    idBack: null,
    userPhoto: null,
  });

  const handleStartCapture = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Start with ID Front capture
    navigation.navigate("CameraScreen", {
      captureType: "idFront",
      idType: type,
      images: images,
    });
  };

  const getTypeLabel = () => {
    return type === "pwd" ? "PWD (Person with Disability)" : "Senior Citizen";
  };

  const requirements = [
    "Valid PWD ID or Senior Citizen ID",
    "Clear photo of ID (front & back)",
    "Recent selfie photo",
    "Be in well-lit area",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply for Discount</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <MaterialCommunityIcons
            name={type === "pwd" ? "wheelchair-accessibility" : "account-clock"}
            size={64}
            color="#00A86B"
          />
          <Text style={styles.heroTitle}>Apply Now</Text>
          <Text style={styles.heroSubtitle}>
            Get verified as a {getTypeLabel()}
          </Text>
        </View>

        {/* What to Prepare */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You'll Need</Text>
          <View style={styles.requirementsCard}>
            {requirements.map((req, index) => (
              <View key={index} style={styles.requirementItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#00A86B"
                />
                <Text style={styles.requirementText}>{req}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Process</Text>
          <View style={styles.stepsCard}>
            <Step number={1} title="Capture ID Front" />
            <Step number={2} title="Capture ID Back" />
            <Step number={3} title="Capture Your Face" />
            <Step number={4} title="Fill Information" />
            <Step number={5} title="Submit" />
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <View style={styles.benefitsCard}>
            <BenefitItem
              icon="tag"
              title="5% Discount"
              desc="On eligible products"
            />
            <BenefitItem
              icon="star"
              title="Priority Service"
              desc="Faster checkout"
            />
            <BenefitItem
              icon="shield-check"
              title="Verified Badge"
              desc="On your profile"
            />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartCapture}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="camera" size={24} color="#fff" />
          <Text style={styles.startButtonText}>Start Application</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const Step = ({ number, title }) => (
  <View style={styles.stepItem}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <Text style={styles.stepTitle}>{title}</Text>
  </View>
);

const BenefitItem = ({ icon, title, desc }) => (
  <View style={styles.benefitItem}>
    <View style={styles.benefitIcon}>
      <MaterialCommunityIcons name={icon} size={24} color="#00A86B" />
    </View>
    <View style={styles.benefitContent}>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitDesc}>{desc}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  requirementsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  requirementText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  stepsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00A86B",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  benefitsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  benefitDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A86B",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default EligibilityApplyScreen;
