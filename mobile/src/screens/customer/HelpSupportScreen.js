import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const HelpSupportScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  // FAQ Data
  const faqSections = [
    {
      id: "eligibility",
      title: "Eligibility & Discounts",
      icon: "tag",
      color: "#00A86B",
      questions: [
        {
          id: "1",
          question: "How do I apply for PWD/Senior Citizen discount?",
          answer:
            "Go to Eligibility Discount in your profile, choose your eligibility type, upload required documents, and submit for verification. Processing takes 1-3 business days.",
        },
        {
          id: "2",
          question: "What documents do I need for verification?",
          answer:
            "Valid PWD/Senior Citizen ID, clear photos (front & back), recent passport photo, and government-issued ID for verification.",
        },
        {
          id: "3",
          question: "Which products are eligible for discounts?",
          answer:
            "Most grocery items are eligible. Exclusions include alcohol, tobacco, and non-essential items. BNPC items get priority discount.",
        },
      ],
    },
    {
      id: "orders",
      title: "Orders & Payments",
      icon: "shopping",
      color: "#2196F3",
      questions: [
        {
          id: "4",
          question: "How can I track my order?",
          answer:
            "Go to Order History in your profile. Each order shows real-time status from confirmed to completed. You can also view blockchain verification.",
        },
        {
          id: "5",
          question: "What payment methods are accepted?",
          answer:
            "We accept cash on delivery, GCash, Maya, and major credit/debit cards. Some payment methods may have additional verification.",
        },
        {
          id: "6",
          question: "How do I cancel an order?",
          answer:
            "Orders can be cancelled within 30 minutes of placement from the Order History screen. After that, contact support for assistance.",
        },
      ],
    },
    {
      id: "account",
      title: "Account & Security",
      icon: "shield-account",
      color: "#FF9800",
      questions: [
        {
          id: "7",
          question: "How do I reset my password?",
          answer:
            'Go to Security settings, tap "Change Password", enter your current password, then set a new secure password.',
        },
        {
          id: "8",
          question: "Is my personal information secure?",
          answer:
            "Yes, all data is encrypted and stored securely. We use blockchain verification for transactions and comply with data privacy laws.",
        },
        {
          id: "9",
          question: "Can I have multiple accounts?",
          answer:
            "Each user should have only one account. Multiple accounts for the same person may result in suspension.",
        },
      ],
    },
  ];

  // Contact options
  const contactOptions = [
    {
      id: "phone",
      title: "Call Support",
      subtitle: "Available 24/7",
      icon: "phone",
      color: "#00A86B",
      action: () => Linking.openURL("tel:+6321234567"),
    },
    {
      id: "email",
      title: "Email Support",
      subtitle: "response within 24h",
      icon: "email",
      color: "#2196F3",
      action: () => Linking.openURL("mailto:support@bnpcstore.ph"),
    },
    {
      id: "chat",
      title: "Live Chat",
      subtitle: "chat with support",
      icon: "message-text",
      color: "#FF9800",
      action: () => navigation.navigate("Chatbot"),
    },
  ];

  // Popular articles
  const popularArticles = [
    {
      id: "1",
      title: "How to claim your discount at checkout",
      category: "Discounts",
      readTime: "2 min read",
    },
    {
      id: "2",
      title: "Understanding BNPC price ceilings",
      category: "BNPC",
      readTime: "3 min read",
    },
    {
      id: "3",
      title: "Setting up biometric authentication",
      category: "Security",
      readTime: "4 min read",
    },
    {
      id: "4",
      title: "Guide to blockchain receipts",
      category: "Technology",
      readTime: "5 min read",
    },
  ];

  const toggleFAQ = (faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const filteredFAQs = searchQuery.trim()
    ? faqSections
        .map((section) => ({
          ...section,
          questions: section.questions.filter(
            (q) =>
              q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter((section) => section.questions.length > 0)
    : faqSections;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSubtitle}>How can we help you today?</Text>
        </View>
        <TouchableOpacity
          style={styles.filterIcon}
          onPress={() => navigation.navigate("Chatbot")}
        >
          <MaterialCommunityIcons
            name="robot-happy"
            size={22}
            color="#00A86B"
          />
        </TouchableOpacity>
      </View>

      {/* --- SEARCH BAR --- */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help topics..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color="#94a3b8"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- CONTACT OPTIONS --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactGrid}>
          {contactOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.contactCard}
              onPress={option.action}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.contactIcon,
                  { backgroundColor: `${option.color}15` },
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={24}
                  color={option.color}
                />
              </View>
              <Text style={styles.contactTitle}>{option.title}</Text>
              <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- POPULAR ARTICLES --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Articles</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.articlesContainer}>
          {popularArticles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("ArticleDetail", { article })}
            >
              <View style={styles.articleHeader}>
                <Text style={styles.articleCategory}>{article.category}</Text>
                <Text style={styles.articleTime}>{article.readTime}</Text>
              </View>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <View style={styles.articleFooter}>
                <Text style={styles.articleRead}>Read article</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color="#00A86B"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- FAQ SECTIONS --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery.trim()
              ? "Search Results"
              : "Frequently Asked Questions"}
          </Text>
          {searchQuery.trim() && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.seeAll}>Clear search</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((section) => (
            <View key={section.id} style={styles.faqSection}>
              <View style={styles.faqSectionHeader}>
                <View style={styles.faqSectionTitleRow}>
                  <View
                    style={[
                      styles.faqIcon,
                      { backgroundColor: `${section.color}15` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={section.icon}
                      size={20}
                      color={section.color}
                    />
                  </View>
                  <Text style={styles.faqSectionTitle}>{section.title}</Text>
                </View>
                <Text style={styles.faqCount}>
                  {section.questions.length} questions
                </Text>
              </View>

              <View style={styles.faqList}>
                {section.questions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.faqItem,
                      expandedFAQ === item.id && styles.faqItemExpanded,
                    ]}
                    onPress={() => toggleFAQ(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.faqQuestionRow}>
                      <Text style={styles.faqQuestion}>{item.question}</Text>
                      <MaterialCommunityIcons
                        name={
                          expandedFAQ === item.id
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={20}
                        color="#64748b"
                      />
                    </View>

                    {expandedFAQ === item.id && (
                      <View style={styles.faqAnswer}>
                        <Text style={styles.faqAnswerText}>{item.answer}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noResults}>
            <MaterialCommunityIcons
              name="help-circle"
              size={48}
              color="#cbd5e1"
            />
            <Text style={styles.noResultsTitle}>No results found</Text>
            <Text style={styles.noResultsText}>
              Try different keywords or browse our FAQ sections
            </Text>
          </View>
        )}

        {/* --- SUPPORT TIPS --- */}
        <View style={styles.tipsCard}>
          <MaterialCommunityIcons
            name="lightbulb-on"
            size={24}
            color="#0f172a"
          />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.tipsTitle}>Need urgent assistance?</Text>
            <Text style={styles.tipsText}>
              Our support team is available 24/7. Tap any contact option above
              to get immediate help.
            </Text>
          </View>
        </View>

        {/* --- SUPPORT FORM --- */}
        <TouchableOpacity
          style={styles.supportFormCard}
          onPress={() => navigation.navigate("ContactForm")}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="form-textbox"
            size={28}
            color="#00A86B"
          />
          <View style={styles.supportFormContent}>
            <Text style={styles.supportFormTitle}>
              Submit a Support Request
            </Text>
            <Text style={styles.supportFormText}>
              Can't find what you're looking for? Send us a detailed message.
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#00A86B"
          />
        </TouchableOpacity>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    color: "#0f172a",
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
    fontWeight: "500",
  },
  filterIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Search Bar
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "500",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  seeAll: {
    color: "#00A86B",
    fontWeight: "700",
    fontSize: 13,
  },

  // Contact Grid
  contactGrid: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  contactCard: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
    textAlign: "center",
  },
  contactSubtitle: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    textAlign: "center",
  },

  // Articles Container
  articlesContainer: {
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  articleCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  articleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  articleCategory: {
    fontSize: 11,
    color: "#00A86B",
    fontWeight: "800",
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  articleTime: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
    lineHeight: 22,
  },
  articleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  articleRead: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00A86B",
    marginRight: 4,
  },

  // FAQ Sections
  faqSection: {
    marginBottom: 24,
  },
  faqSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  faqSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  faqIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  faqSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  faqCount: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  faqList: {
    paddingHorizontal: 24,
  },
  faqItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  faqItemExpanded: {
    borderColor: "#00A86B",
    borderWidth: 1.5,
  },
  faqQuestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginRight: 12,
    lineHeight: 20,
  },
  faqAnswer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },

  // No Results
  noResults: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },

  // Tips Card
  tipsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  tipsText: {
    fontSize: 12,
    color: "#64748b",
  },

  // Support Form Card
  supportFormCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginTop: 20,
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#00A86B",
    borderStyle: "dashed",
  },
  supportFormContent: {
    flex: 1,
    marginLeft: 16,
  },
  supportFormTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  supportFormText: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
});

export default HelpSupportScreen;
