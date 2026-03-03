import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Modal,
  Platform,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Welcome to ConsoliScan Support! 👋",
      subtext: "How can I help you today?",
      timestamp: new Date(),
    },
  ]);

  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const scrollViewRef = useRef(null);

  // Animation for FAB
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Subtle rotation animation for the robot head
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          // easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          // easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Pulse animation for attention
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          // easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          // easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  // FAQ Database (keeping the same as your original)
  const faqDatabase = {
    main: {
      title: "Main Menu",
      questions: [
        { id: "scan", text: "How do I scan items?", category: "scanning" },
        { id: "promo", text: "How do I apply promo codes?", category: "promo" },
        {
          id: "loyalty",
          text: "Tell me about Loyalty Points",
          category: "loyalty",
        },
        {
          id: "eligibility",
          text: "BNPC Eligibility & Discounts",
          category: "eligibility",
        },
        { id: "orders", text: "Order & Payment Info", category: "orders" },
        { id: "exchange", text: "Exchange Program", category: "exchange" },
        { id: "receipt", text: "Digital Receipts", category: "receipt" },
        { id: "account", text: "Account & Security", category: "account" },
        {
          id: "blockchain",
          text: "Blockchain Verification",
          category: "blockchain",
        },
        { id: "other", text: "Other Questions", category: "other" },
      ],
    },
    scanning: {
      title: "Barcode Scanning",
      icon: "barcode-scan",
      color: "#3B82F6",
      questions: [
        {
          id: "scan-1",
          text: "How do I start scanning items?",
          answer:
            'Open your cart by tapping the "Scan" button on the home screen. Point your camera at the product barcode and align it within the frame. Our scanner will automatically detect and add the item to your cart.',
        },
        {
          id: "scan-2",
          text: "What if the barcode won't scan?",
          answer:
            "Try these steps:\n• Ensure good lighting on the barcode\n• Move closer (5-10cm away)\n• Avoid shadows on the barcode\n• Clean your camera lens\n• Try different angles\n\nIf it still doesn't work, try scanning again or check product details manually.",
        },
        {
          id: "scan-3",
          text: "Can I adjust item quantity after scanning?",
          answer:
            "Yes! After scanning, go to your Cart. Tap the item and use the + and - buttons to adjust quantity. You can also remove items by swiping or tapping the trash icon.",
        },
        {
          id: "scan-4",
          text: "What formats does the scanner support?",
          answer:
            "Our scanner supports UPC/EAN barcodes, which are standard on most grocery products. This includes:\n• UPC-A (12 digits)\n• UPC-E (8 digits)\n• EAN-13 (13 digits)\n• EAN-8 (8 digits)",
        },
      ],
    },
    promo: {
      title: "Promo Codes",
      icon: "ticket-percent",
      color: "#FF9800",
      questions: [
        {
          id: "promo-1",
          text: "How do I apply a promo code?",
          answer:
            'In your Cart:\n1. Scroll to the "Apply Promo" section\n2. See all available promos with discount details\n3. Tap a promo to apply it\n4. See your savings instantly!\n\nYou only need to tap - no code typing required!',
        },
        {
          id: "promo-2",
          text: "Can I use multiple promo codes?",
          answer:
            "You can apply ONE promo code per checkout for maximum benefit. However, you can:\n• Combine promo with BNPC discounts\n• Combine promo with loyalty points\n• Stack these savings together!",
        },
        {
          id: "promo-3",
          text: "Why is a promo code invalid?",
          answer:
            "A promo might be invalid due to:\n• Expired or not yet active\n• Minimum purchase requirement not met\n• Usage limit reached\n• Promo excludes your products\n• Only applies to specific categories\n\nCheck the promo details in the list!",
        },
        {
          id: "promo-4",
          text: "Can I remove a promo code?",
          answer:
            'Yes! In your Cart, tap the applied promo and select "Remove". You can then apply a different promo if you want.',
        },
        {
          id: "promo-5",
          text: "Are there hidden promo codes?",
          answer:
            "No hidden codes needed! All available promos are displayed in your Cart with:\n• Promo name and code\n• Discount amount (% or fixed ₱)\n• Applicable scope (entire cart, products, or categories)\n\nJust select what's best for you!",
        },
      ],
    },
    loyalty: {
      title: "Loyalty Points",
      icon: "trophy",
      color: "#B45309",
      questions: [
        {
          id: "loyalty-1",
          text: "How do I earn loyalty points?",
          answer:
            "You earn loyalty points on every purchase:\n• ₱1 spent = points earned (varies by tier)\n• Points appear in your account after checkout\n• View your points in the Cart summary\n• Redeem for discounts on future purchases",
        },
        {
          id: "loyalty-2",
          text: "How do I use my loyalty points?",
          answer:
            'In your Cart:\n1. Scroll to "Loyalty Points" section\n2. View your available points balance\n3. Enter points to redeem (with conversion rate shown)\n4. Points apply to your final total\n5. Max redeem is 30% of order total',
        },
        {
          id: "loyalty-3",
          text: "What's the conversion rate?",
          answer:
            "Points are converted to discount based on:\n• Points-to-Currency Rate: 1 point = ₱1 (varies)\n• Max Redeem: 30% of order total\n• Example: 100 points = ₱100 off (up to 30% limit)\n\nCheck your Cart for exact rate!",
        },
        {
          id: "loyalty-4",
          text: "Do loyalty points expire?",
          answer:
            "Points are valid for:\n• 24 months from earning date\n• Regularly check your points balance\n• Use them before expiration to avoid losing them\n• Check your profile for expiration dates",
        },
        {
          id: "loyalty-5",
          text: "Can I see my points history?",
          answer:
            'Yes! In your Profile:\n1. Tap "Loyalty Points" or "My Rewards"\n2. View detailed transaction history\n3. See earning and redemption dates\n4. Track points balance over time\n5. Export as PDF for records',
        },
      ],
    },
    eligibility: {
      title: "BNPC Eligibility",
      icon: "shield-star",
      color: "#00A86B",
      questions: [
        {
          id: "elig-1",
          text: "Who qualifies for BNPC discount?",
          answer:
            "BNPC (Bagong Pamimuhay sa Negosyo at Konsyumer) discounts are for:\n• Senior Citizens (60+ years)\n• Persons with Disability (PWD)\n• Valid government ID required\n• 5% discount on eligible products",
        },
        {
          id: "elig-2",
          text: "How do I apply for verification?",
          answer:
            'In your Profile:\n1. Tap "Eligibility Discount"\n2. Choose your type (Senior/PWD)\n3. Upload required documents:\n   - Valid ID (front & back)\n   - Recent passport photo\n   - Government ID copy\n4. Submit for verification\n5. Get verified in 1-3 business days',
        },
        {
          id: "elig-3",
          text: "Which products get the discount?",
          answer:
            "Most grocery items are eligible:\n✓ Food & beverages\n✓ BNPC items (specially marked)\n✓ Essential goods\n\n✗ Excluded items:\n✗ Alcohol & tobacco\n✗ Non-essential luxury items\n✗ Medicine (needs separate discount)",
        },
        {
          id: "elig-4",
          text: "What's the weekly discount cap?",
          answer:
            "BNPC discounts have weekly limits:\n• Purchase cap: ₱2,500/week on eligible items\n• Discount cap: ₱125/week maximum discount\n• Resets every Sunday-Saturday\n• Check your Cart for remaining limit",
        },
        {
          id: "elig-5",
          text: "Can I share my discount with others?",
          answer:
            "No, your BNPC discount is:\n• Personal and non-transferable\n• Linked to your verified account\n• Only applicable for your purchases\n• Each eligible person needs their own account",
        },
        {
          id: "elig-6",
          text: "What if verification is rejected?",
          answer:
            "If rejected:\n• Check email for rejection reason\n• Resubmit with correct documents\n• Ensure photos are clear and unblurred\n• Verify ID is not expired\n• Contact support for assistance",
        },
      ],
    },
    orders: {
      title: "Orders & Payments",
      icon: "shopping-outline",
      color: "#2196F3",
      questions: [
        {
          id: "order-1",
          text: "What payment methods are accepted?",
          answer:
            "ConsoliScan accepts:\n• Cash on Delivery (COD)\n• GCash / Maya e-wallets\n• Credit/Debit Cards (Visa, Mastercard)\n• Bank transfers\n• Loyalty points (as partial payment)\n\nAll payments are secure & encrypted!",
        },
        {
          id: "order-2",
          text: "How do I checkout?",
          answer:
            "At checkout:\n1. Review items in Cart\n2. Apply promo codes (if desired)\n3. Apply loyalty points (if desired)\n4. Select delivery/pickup option\n5. Choose payment method\n6. Confirm order\n7. Scan QR code to complete payment",
        },
        {
          id: "order-3",
          text: "How do I track my order?",
          answer:
            'Track your order:\n1. Go to "Order History"\n2. Select the order\n3. View real-time status:\n   - Order Confirmed\n   - Preparing\n   - Ready for Delivery\n   - Completed\n4. See blockchain verification badge',
        },
        {
          id: "order-4",
          text: "Can I cancel an order?",
          answer:
            'Order cancellation policy:\n• Can cancel within 30 minutes\n• Go to Order History\n• Select order → "Cancel Order"\n• Refund processed within 3-5 days\n• After 30 min: contact support',
        },
        {
          id: "order-5",
          text: "How long does delivery take?",
          answer:
            "Standard delivery times:\n• Same-day (if ordered before 2 PM): 2-4 hours\n• Next-day: 24-48 hours\n• Weekend orders: Next business day\n• Remote areas: May take longer\n• Track in real-time!",
        },
      ],
    },
    exchange: {
      title: "Exchange Program",
      icon: "swap-horizontal-bold",
      color: "#9C27B0",
      questions: [
        {
          id: "exc-1",
          text: "What is the Exchange Program?",
          answer:
            "Exchange Program lets you:\n• Return unused/defective items\n• Get replacement items\n• Get credit for future purchases\n• No questions asked within period\n• Available on qualifying items",
        },
        {
          id: "exc-2",
          text: "How do I exchange an item?",
          answer:
            'To exchange:\n1. Go to "Exchange Program"\n2. Tap "Start Exchange"\n3. Scan the item barcode\n4. Take photo of item condition\n5. Select replacement or refund\n6. Complete the exchange\n7. Get digital receipt',
        },
        {
          id: "exc-3",
          text: "What's the exchange time limit?",
          answer:
            "Exchange windows:\n• Fresh items: Within 24 hours\n• Packaged items: Within 7 days\n• Electronics: Within 14 days\n• Non-consumables: Within 30 days\n• Original receipt required",
        },
        {
          id: "exc-4",
          text: "Can I exchange for something different?",
          answer:
            "Yes! You can:\n• Exchange for same product (different variant)\n• Upgrade to better quality (pay difference)\n• Downgrade for refund\n• Get store credit for future purchase\n• Limited by price parity",
        },
      ],
    },
    receipt: {
      title: "Digital Receipts",
      icon: "file-document",
      color: "#4CAF50",
      questions: [
        {
          id: "rec-1",
          text: "Where do I find my receipts?",
          answer:
            'Access your receipts:\n1. Go to "Order History"\n2. Select any past order\n3. Tap "View Receipt"\n4. Options to:\n   - View details\n   - Download as PDF\n   - Share via email\n   - Print (if available)',
        },
        {
          id: "rec-2",
          text: "Are receipts blockchain verified?",
          answer:
            "Yes! Each receipt includes:\n✓ Blockchain transaction hash\n✓ Verification timestamp\n✓ Immutable transaction record\n✓ Digital signature\n✓ Tamper-proof guarantee\n\nYou can verify authenticity anytime!",
        },
        {
          id: "rec-3",
          text: "How long are receipts stored?",
          answer:
            "Your receipts are stored:\n• Permanently in cloud\n• Accessible anytime in app\n• Downloadable as PDF\n• Searchable by date/amount\n• Backed up to blockchain",
        },
        {
          id: "rec-4",
          text: "Can I email my receipt?",
          answer:
            'Yes! For any receipt:\n1. Go to Order History\n2. Select order\n3. Tap "Share Receipt"\n4. Email to yourself/others\n5. PDF attached with details\n6. Valid for returns/exchanges',
        },
      ],
    },
    account: {
      title: "Account & Security",
      icon: "shield-lock",
      color: "#F44336",
      questions: [
        {
          id: "acc-1",
          text: "How do I update my profile?",
          answer:
            'Update your profile:\n1. Tap "Menu" → "Account"\n2. Edit your information:\n   - Full name\n   - Email address\n   - Phone number\n   - Address\n3. Tap "Save Changes"\n4. Changes apply immediately',
        },
        {
          id: "acc-2",
          text: "How do I change my password?",
          answer:
            'Change password (logged in users):\n1. Go to Menu → "Security"\n2. Tap "Change Password"\n3. Enter current password\n4. Create new strong password:\n   - 8+ characters\n   - Mix of letters, numbers, symbols\n5. Confirm new password\n6. Save changes',
        },
        {
          id: "acc-3",
          text: "How do I reset my password?",
          answer:
            'If you forgot your password:\n1. On login screen, tap "Forgot Password"\n2. Enter your email\n3. Check email for reset link\n4. Click link to set new password\n5. New password sent within 5 minutes\n6. Log in with new password',
        },
        {
          id: "acc-4",
          text: "Is my data secure?",
          answer:
            "Your data security:\n✓ All data encrypted (SSL/TLS)\n✓ Password encrypted with hashing\n✓ Blockchain verification for transactions\n✓ No sensitive data stored on device\n✓ Secure API endpoints\n✓ 2FA available on request",
        },
        {
          id: "acc-5",
          text: "Can I have multiple accounts?",
          answer:
            "Account policy:\n• One account per person\n• Each account linked to 1 email\n• Phone number verification required\n• Multiple accounts = suspension\n• Family members: separate accounts needed",
        },
        {
          id: "acc-6",
          text: "How do I delete my account?",
          answer:
            'To delete account:\n1. Go to Menu → "Account"\n2. Scroll to "Account Settings"\n3. Tap "Delete Account"\n4. Confirm deletion (30-day grace period)\n5. All data archived for 30 days\n6. Permanent deletion after 1 month\n\nContact support to restore!',
        },
      ],
    },
    blockchain: {
      title: "Blockchain Technology",
      icon: "link-variant",
      color: "#FF6B35",
      questions: [
        {
          id: "block-1",
          text: "How does blockchain help me?",
          answer:
            "Blockchain benefits:\n✓ Transaction verification impossible to fake\n✓ Permanent record of purchases\n✓ Prevents fraud and data tampering\n✓ Quick refund verification\n✓ Loyalty points backed by blockchain\n✓ Receipts impossible to modify",
        },
        {
          id: "block-2",
          text: "Can I verify my transaction?",
          answer:
            'Verify your transactions:\n1. View any Order Receipt\n2. Look for "Blockchain Hash"\n3. Tap to copy hash code\n4. Use blockchain explorer (optional)\n5. Enter hash to verify authenticity\n6. Receipt is verified instantly',
        },
        {
          id: "block-3",
          text: "What's a blockchain hash?",
          answer:
            "A blockchain hash is:\n• Unique 64-character code\n• Generated for every transaction\n• Impossible to duplicate\n• Timestamp included\n• Proves transaction authenticity\n• Part of immutable ledger\n\nIt's like a digital fingerprint!",
        },
        {
          id: "block-4",
          text: "Is blockchain safe?",
          answer:
            "Blockchain security:\n✓ Cryptographically secured\n✓ Distributed across multiple nodes\n✓ Cannot be hacked/modified\n✓ Each block linked to previous\n✓ Breaking 1 block breaks entire chain\n✓ Military-grade encryption\n\nYour data is extremely safe!",
        },
      ],
    },
    other: {
      title: "Other Questions",
      icon: "help-circle",
      color: "#607D8B",
      questions: [
        {
          id: "other-1",
          text: "What is ConsoliScan?",
          answer:
            "ConsoliScan is an intelligent grocery ecosystem that:\n• Lets you scan items for quick checkout\n• Provides automated discounts (BNPC)\n• Earns loyalty points on purchases\n• Uses blockchain for transaction security\n• Integrates loyalty programs\n• Supports PWD/Senior citizen discounts\n• Provides digital receipts",
        },
        {
          id: "other-2",
          text: "How do I contact support?",
          answer:
            "Contact us through:\n📞 Phone: Available 24/7 via app\n📧 Email: support@consoliscan.com\n💬 Live Chat: In-app messaging\n🕐 Response time: Within 2 hours\n📍 Visit store for immediate help",
        },
        {
          id: "other-3",
          text: "Is there a guest checkout?",
          answer:
            "Yes! Guest shopping:\n• No account required\n• Scan items as normal\n• Can apply promo codes\n• Can't use loyalty points\n• Can't use BNPC discount\n• Can pay and checkout\n• Receipt sent via SMS",
        },
        {
          id: "other-4",
          text: "How do I give feedback?",
          answer:
            'Share your feedback:\n1. Go to Help & Support\n2. Tap "Send Feedback"\n3. Rate your experience (1-5 stars)\n4. Write detailed message\n5. Submit feedback\n6. We read every suggestion!\n\nYour feedback helps us improve!',
        },
      ],
    },
  };

  // Initialize main menu questions
  useEffect(() => {
    setCurrentQuestions(faqDatabase.main.questions);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, currentQuestions, isOpen]);

  const handleQuestionSelect = (question) => {
    const newMessage = {
      id: messages.length + 1,
      type: "user",
      text: question.text,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setSessionHistory([...sessionHistory, question.id]);

    // Simulate bot thinking time
    setTimeout(() => {
      if (question.answer) {
        // Answer question - show back button
        const botReply = {
          id: messages.length + 2,
          type: "bot",
          text: question.answer,
          timestamp: new Date(),
          showBackButton: true,
        };
        setMessages((prev) => [...prev, botReply]);
        setCurrentQuestions([]);
      } else if (question.category) {
        // Go to subcategory
        const category = faqDatabase[question.category];
        const botReply = {
          id: messages.length + 2,
          type: "bot",
          text: `Let me help you with ${category.title}`,
          subtext: "Select a question below:",
          timestamp: new Date(),
          category: question.category,
        };
        setMessages((prev) => [...prev, botReply]);
        setCurrentQuestions(category.questions);
      }
    }, 300);
  };

  const handleBackToMenu = () => {
    const botReply = {
      id: messages.length + 1,
      type: "bot",
      text: "Back to main menu",
      subtext: "What else can I help you with?",
      timestamp: new Date(),
    };
    setMessages([...messages, botReply]);
    setCurrentQuestions(faqDatabase.main.questions);
  };

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-5deg", "5deg"],
  });

  const renderMessage = (message, index) => {
    const isBot = message.type === "bot";

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isBot ? styles.botMessageContainer : styles.userMessageContainer,
        ]}
      >
        {isBot && (
          <Animated.View
            style={[
              styles.botAvatar,
              {
                transform: [{ rotate: rotateInterpolation }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="robot"
              size={20}
              color="#fff"
            />
          </Animated.View>
        )}

        <View
          style={[
            styles.messageBubble,
            isBot ? styles.botBubble : styles.userBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isBot ? styles.botText : styles.userText,
            ]}
          >
            {message.text}
          </Text>
          {message.subtext && (
            <Text
              style={[
                styles.messageSubtext,
                isBot ? styles.botSubtext : styles.userSubtext,
              ]}
            >
              {message.subtext}
            </Text>
          )}
        </View>

        {isBot && message.showBackButton && (
          <TouchableOpacity
            style={styles.backButtonSmall}
            onPress={handleBackToMenu}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={16}
              color="#00A86B"
            />
            <Text style={styles.backButtonText}>Menu</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderQuestions = () => {
    if (currentQuestions.length === 0) return null;

    return (
      <View style={styles.questionsContainer}>
        {currentQuestions.map((question, index) => (
          <TouchableOpacity
            key={question.id}
            style={[
              styles.questionButton,
              index === currentQuestions.length - 1 &&
                styles.lastQuestionButton,
            ]}
            onPress={() => handleQuestionSelect(question)}
            activeOpacity={0.7}
          >
            <Text style={styles.questionButtonText}>{question.text}</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color="#94a3b8"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <>
      {/* Floating Action Button - Bot Style */}
      {!isOpen && (
        <Animated.View
          style={[
            styles.fabContainer,
            {
              transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setIsOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.robotHead}>
              <View style={styles.robotEyes}>
                <View style={styles.robotEye} />
                <View style={styles.robotEye} />
              </View>
              <View style={styles.robotAntenna} />
              <MaterialCommunityIcons
                name="robot"
                size={30}
                color="#00A86B"
                style={styles.robotIcon}
              />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setIsOpen(false)}
              >
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={28}
                  color="#0f172a"
                />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <View style={styles.headerTitleContainer}>
                  <MaterialCommunityIcons
                    name="robot"
                    size={20}
                    color="#00A86B"
                  />
                  <Text style={styles.headerTitle}>ConsoliBot</Text>
                </View>
                <Text style={styles.headerSubtitle}>AI Support Assistant</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message, index) => renderMessage(message, index))}
              {renderQuestions()}
            </ScrollView>

            {/* Footer Info */}
            <View style={styles.footer}>
              <MaterialCommunityIcons
                name="robot-happy"
                size={16}
                color="#94a3b8"
              />
              <Text style={styles.footerText}>
                I'm here to help! Ask me anything about ConsoliScan.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // FAB Styles - Bot Themed
  fabContainer: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 9999,
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00A86B",
    position: "relative",
  },
  robotHead: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00A86B",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  robotEyes: {
    flexDirection: "row",
    position: "absolute",
    top: 12,
    gap: 8,
  },
  robotEye: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  robotAntenna: {
    position: "absolute",
    top: -6,
    width: 4,
    height: 8,
    backgroundColor: "#00A86B",
    borderRadius: 2,
  },
  robotIcon: {
    position: "absolute",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#F9FAFB",
    height: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  // Chat Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
    marginLeft: 28,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00A86B",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00A86B",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  messageContainer: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  botMessageContainer: {
    justifyContent: "flex-start",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#00A86B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 2,
    borderColor: "rgba(0, 168, 107, 0.2)",
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#00A86B",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  botText: {
    color: "#0F172A",
  },
  userText: {
    color: "#FFFFFF",
  },
  messageSubtext: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  botSubtext: {
    color: "#94A3B8",
  },
  userSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  backButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00A86B",
  },
  questionsContainer: {
    marginTop: 8,
    gap: 10,
  },
  questionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  lastQuestionButton: {
    marginBottom: 20,
  },
  questionButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
    marginRight: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingBottom: Platform.OS === "ios" ? 34 : 12,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
});

export default FloatingChatbot;