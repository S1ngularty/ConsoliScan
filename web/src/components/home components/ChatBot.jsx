import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  ChevronRight,
  HelpCircle,
  ArrowLeft,
  Info,
} from "lucide-react";
import "../../styles/css/Chatbot.css";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Welcome to ConsoliScan Support! 👋",
      subtext: "How can I help you today?",
      timestamp: new Date(),
    },
  ]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeChat = (e) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // FAQ Database organized by categories (Mirrors mobile app)
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
            "Points are valid for:\n• 24 months from earning date\n• Regularly check your points balance\n• Use them before expration to avoid losing them\n• Check your profile for expiration dates",
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

  useEffect(() => {
    setCurrentQuestions(faqDatabase.main.questions);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentQuestions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuestionSelect = (question) => {
    const newMessage = {
      id: messages.length + 1,
      type: "user",
      text: question.text,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setSessionHistory([...sessionHistory, question.id]);

    setTimeout(() => {
      if (question.answer) {
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
    }, 500);
  };

  const handleBackToMenu = () => {
    const botReply = {
      id: messages.length + 1,
      type: "bot",
      text: "Back to main menu",
      subtext: "What else can I help you with?",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botReply]);
    setCurrentQuestions(faqDatabase.main.questions);
  };

  return (
    <div className="chatbot-container">
      {/* Floating Button */}
      {!isOpen && (
        <button className="floating-chat-btn" onClick={toggleChat}>
          <MessageSquare size={24} />
          <span className="chat-badge">1</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`chat-window ${isMinimized ? "minimized" : ""}`}>
          {/* Header */}
          <div className="chat-header" onClick={minimizeChat}>
            <div className="header-info">
              <h3>Support Assistant</h3>
              <div className="status-indicator">
                <span className="status-dot"></span>
                <span>Online</span>
              </div>
            </div>
            <div className="header-actions">
              <button className="minimize-btn" onClick={minimizeChat}>
                <ChevronRight
                  size={20}
                  style={{ transform: "rotate(90deg)" }}
                />
              </button>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area - Only show when not minimized */}
          {!isMinimized && (
            <>
              <div className="chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.type}`}>
                    {msg.type === "bot" && (
                      <div className="bot-avatar">
                        <MessageSquare size={16} />
                      </div>
                    )}
                    <div className="message-content">
                      <div className="bubble">
                        <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>
                        {msg.subtext && (
                          <span className="subtext">{msg.subtext}</span>
                        )}
                      </div>
                      {msg.showBackButton && (
                        <button
                          className="back-menu-btn"
                          onClick={handleBackToMenu}
                        >
                          <ArrowLeft size={14} /> Back to Menu
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Questions List */}
                {currentQuestions.length > 0 && (
                  <div className="questions-list">
                    {currentQuestions.map((q) => (
                      <button
                        key={q.id}
                        className="question-btn"
                        onClick={() => handleQuestionSelect(q)}
                      >
                        <span>{q.text}</span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer */}
              <div className="chat-footer">
                <Info size={14} />
                <span>Automated Support • Contact us for complex issues</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Chatbot;
