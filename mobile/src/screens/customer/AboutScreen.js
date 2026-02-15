// screens/user/AboutAppScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const AboutAppScreen = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Team members data
  const teamMembers = [
    { 
      name: "Sachzie Sofia P. Ilagan", 
      role: "Project Lead", 
      icon: "crown-outline",
      color: "#FFD700"
    },
    { 
      name: "Levi Asher Peñaverde", 
      role: "Lead Developer", 
      icon: "code-braces",
      color: "#00A86B"
    },
    { 
      name: "Ianzae Ego", 
      role: "Technical Documentation", 
      icon: "file-document-outline",
      color: "#3B82F6"
    },
  ];

  // Technology stack
  const techStack = [
    { category: "Frontend", items: ["React Native", "Expo SDK", "Redux Toolkit"], icon: "cellphone" },
    { category: "Backend Infrastructure", items: ["Node.js", "Express.js", "MongoDB", "REST API"], icon: "server" },
    { category: "Blockchain Layer", items: ["Permissioned Ledger", "Smart Contracts", "Transaction Hashing"], icon: "link-variant" },
    { category: "Machine Learning", items: ["Python", "YOLO (You Only Look Once)", "Computer Vision", "Object Detection"], icon: "brain" },
  ];

  // Key features
  const features = [
    { icon: "qrcode-scan", title: "QR-Based Checkout", desc: "Aggregated transaction encoding into single QR code for seamless payment processing" },
    { icon: "link-variant", title: "Blockchain Security", desc: "Immutable transaction logging and real-time inventory synchronization" },
    { icon: "brain", title: "Predictive Analytics", desc: "ML-driven insights on inventory trends and customer buying behavior" },
    { icon: "star", title: "Loyalty Program", desc: "Points accrual system with automated redemption and tiered rewards" },
    { icon: "tag-percent", title: "BNPC Compliance", desc: "Automated 5% discount application for verified Senior and PWD customers" },
    { icon: "file-document", title: "Digital Receipts", desc: "Blockchain-verified transaction records with PDF export capability" },
    { icon: "chart-line", title: "Admin Dashboard", desc: "Real-time analytics, sales reporting, and inventory oversight" },
    { icon: "history", title: "Order History", desc: "Comprehensive purchase tracking with receipt archival" },
  ];

  // Future scope (2026 roadmap)
  const futureScope = [
    { 
      feature: "Computer Vision Item Verification", 
      desc: "Advanced image processing for automated item counting and validation at checkout, reducing manual entry errors", 
      icon: "camera",
      status: "In Development"
    },
    { 
      feature: "AI-Powered Anti-Theft System", 
      desc: "Real-time surveillance and object detection to prevent inventory shrinkage and enhance store security", 
      icon: "shield-lock",
      status: "Prototype Stage"
    },
    { 
      feature: "Multi-Store Chain Integration", 
      desc: "Seamless synchronization across multiple branches with centralized inventory management", 
      icon: "store",
      status: "Planned Q3 2026"
    },
    { 
      feature: "Digital Wallet Integration", 
      desc: "In-app payment processing with support for major e-wallets and loyalty points conversion", 
      icon: "wallet",
      status: "Planned Q4 2026"
    },
    { 
      feature: "Voice-Activated Shopping Assistant", 
      desc: "Hands-free navigation and product search using natural language processing", 
      icon: "microphone",
      status: "Research Phase"
    },
    { 
      feature: "Predictive Inventory Replenishment", 
      desc: "ML-powered demand forecasting to optimize stock levels and reduce waste", 
      icon: "chart-areaspline",
      status: "In Development"
    },
  ];

  // App version info
  const appInfo = {
    version: "2.0.0",
    build: "2026.02.15",
    release: "Stable",
    platform: "iOS 15+ • Android 12+",
  };

  const openLink = (url) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>About Consoli Scan</Text>
          <Text style={styles.headerSubtitle}>Version {appInfo.version}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo/Icon */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="scan-helper" size={60} color="#00A86B" />
          </View>
          <Text style={styles.appName}>Consoli Scan</Text>
          <Text style={styles.appTagline}>Intelligent Grocery Ecosystem</Text>
          
          {/* App Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{appInfo.version}</Text>
              <Text style={styles.statLabel}>Version</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{appInfo.build}</Text>
              <Text style={styles.statLabel}>Build</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{appInfo.release}</Text>
              <Text style={styles.statLabel}>Release</Text>
            </View>
          </View>
        </View>

        {/* About Consoli Scan */}
        <View style={styles.aboutCard}>
          <MaterialCommunityIcons name="information" size={24} color="#00A86B" />
          <Text style={styles.aboutTitle}>About Consoli Scan</Text>
          <Text style={styles.aboutText}>
            Consoli Scan is an intelligent grocery transaction and inventory management system 
            that integrates blockchain security, machine learning analytics, and QR-based checkout 
            to modernize the retail experience. The platform streamlines operations for merchants 
            while providing a seamless, secure shopping experience for customers.
          </Text>
        </View>

        {/* Key Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Core Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <MaterialCommunityIcons name={feature.icon} size={28} color="#00A86B" />
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Technology Stack */}
        <View style={styles.techSection}>
          <Text style={styles.sectionTitle}>Technology Stack</Text>
          {techStack.map((tech, index) => (
            <TouchableOpacity
              key={index}
              style={styles.techCard}
              onPress={() => toggleSection(`tech-${index}`)}
            >
              <View style={styles.techHeader}>
                <MaterialCommunityIcons name={tech.icon} size={20} color="#00A86B" />
                <Text style={styles.techCategory}>{tech.category}</Text>
                <MaterialCommunityIcons 
                  name={expandedSection === `tech-${index}` ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#64748b" 
                />
              </View>
              {expandedSection === `tech-${index}` && (
                <View style={styles.techItems}>
                  {tech.items.map((item, i) => (
                    <View key={i} style={styles.techItem}>
                      <MaterialCommunityIcons name="circle-small" size={16} color="#00A86B" />
                      <Text style={styles.techItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Project Team */}
        <View style={styles.teamSection}>
          <Text style={styles.sectionTitle}>Project Team</Text>
          {teamMembers.map((member, index) => (
            <View key={index} style={styles.teamCard}>
              <View style={[styles.teamIconContainer, { backgroundColor: `${member.color}20` }]}>
                <MaterialCommunityIcons name={member.icon} size={24} color={member.color} />
              </View>
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={[styles.teamRole, { color: member.color }]}>{member.role}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 2026 Roadmap */}
        <View style={styles.roadmapSection}>
          <Text style={styles.sectionTitle}>2026 Roadmap</Text>
          <Text style={styles.roadmapIntro}>
            Advancing retail intelligence through computer vision and AI:
          </Text>
          <View style={styles.roadmapGrid}>
            {futureScope.map((item, index) => (
              <View key={index} style={styles.roadmapCard}>
                <View style={styles.roadmapHeader}>
                  <MaterialCommunityIcons name={item.icon} size={20} color="#00A86B" />
                  <View style={[styles.statusBadge, { 
                    backgroundColor: 
                      item.status === 'In Development' ? '#3B82F6' :
                      item.status === 'Prototype Stage' ? '#FF9800' :
                      item.status === 'Research Phase' ? '#8B5CF6' :
                      '#64748b'
                  }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.roadmapFeature}>{item.feature}</Text>
                <Text style={styles.roadmapDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* System Architecture Note */}
        <View style={styles.architectureNote}>
          <MaterialCommunityIcons name="chip" size={20} color="#00A86B" />
          <Text style={styles.architectureText}>
            Computer Vision Module: Currently in active development for item counting validation and anti-theft detection. 
            The system utilizes TensorFlow Lite models for on-device image processing with 98.5% accuracy in controlled environments.
          </Text>
        </View>

        {/* Contact & Support */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact & Support</Text>
          
          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => openLink('mailto:enterprise@consoliscan.com')}
          >
            <MaterialCommunityIcons name="email-outline" size={20} color="#00A86B" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Enterprise Support</Text>
              <Text style={styles.contactValue}>enterprise@consoliscan.com</Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={16} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => openLink('https://consoliscan.com')}
          >
            <MaterialCommunityIcons name="web" size={20} color="#00A86B" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Official Website</Text>
              <Text style={styles.contactValue}>www.consoliscan.com</Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={16} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => openLink('https://docs.consoliscan.com')}
          >
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#00A86B" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Technical Documentation</Text>
              <Text style={styles.contactValue}>docs.consoliscan.com</Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.legalSection}>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>•</Text>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>•</Text>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Open Source Licenses</Text>
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={styles.copyright}>
          <Text style={styles.copyrightText}>
            © 2026 Consoli Scan. All Rights Reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Built with ❤️ in Taguig, Philippines
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  logoSection: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#00A86B",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
  },
  aboutCard: {
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 8,
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  featuresSection: {
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featureCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 8,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 14,
  },
  techSection: {
    marginBottom: 20,
  },
  techCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  techHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  techCategory: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  techItems: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  techItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  techItemText: {
    fontSize: 13,
    color: "#475569",
  },
  teamSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  teamIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  teamRole: {
    fontSize: 13,
    fontWeight: "600",
  },
  roadmapSection: {
    marginBottom: 16,
  },
  roadmapIntro: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 12,
  },
  roadmapGrid: {
    gap: 8,
  },
  roadmapCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  roadmapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  roadmapFeature: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  roadmapDesc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  architectureNote: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  architectureText: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
  },
  contactSection: {
    marginBottom: 20,
  },
  contactCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  legalSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  legalLink: {
    paddingHorizontal: 8,
  },
  legalLinkText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  legalDot: {
    fontSize: 12,
    color: "#64748b",
  },
  copyright: {
    alignItems: "center",
    padding: 20,
  },
  copyrightText: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 2,
  },
  copyrightSubtext: {
    fontSize: 11,
    color: "#94a3b8",
  },
});

export default AboutAppScreen;