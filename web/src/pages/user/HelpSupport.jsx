import React, { useState } from "react";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Mail, 
  MessageSquare, 
  FileText, 
  ShieldCheck, 
  ShoppingBag, 
  HelpCircle,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import "../../styles/css/HelpSupport.css";

const HelpSupport = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  // FAQ Data (Mirrors mobile app)
  const faqSections = [
    {
      id: "eligibility",
      title: "Eligibility & Discounts",
      icon: <ShieldCheck size={24} />,
      color: "#00A86B",
      questions: [
        {
          id: "1",
          question: "How do I apply for PWD/Senior Citizen discount?",
          answer: "Go to Eligibility Discount in your profile, choose your eligibility type, upload required documents, and submit for verification. Processing takes 1-3 business days.",
        },
        {
          id: "2",
          question: "What documents do I need for verification?",
          answer: "Valid PWD/Senior Citizen ID, clear photos (front & back), recent passport photo, and government-issued ID for verification.",
        },
        {
          id: "3",
          question: "Which products are eligible for discounts?",
          answer: "Most grocery items are eligible. Exclusions include alcohol, tobacco, and non-essential items. BNPC items get priority discount.",
        },
      ],
    },
    {
      id: "orders",
      title: "Orders & Payments",
      icon: <ShoppingBag size={24} />,
      color: "#2196F3",
      questions: [
        {
          id: "4",
          question: "How can I track my order?",
          answer: "Go to Order History in your profile. Each order shows real-time status from confirmed to completed. You can also view blockchain verification.",
        },
        {
          id: "5",
          question: "What payment methods are accepted?",
          answer: "We accept cash on delivery, GCash, Maya, and major credit/debit cards. Some payment methods may have additional verification.",
        },
        {
          id: "6",
          question: "How do I cancel an order?",
          answer: "Orders can be cancelled within 30 minutes of placement from the Order History screen. After that, contact support for assistance.",
        },
      ],
    },
    {
      id: "account",
      title: "Account & Security",
      icon: <ShieldCheck size={24} />,
      color: "#FF9800",
      questions: [
        {
          id: "7",
          question: "How do I reset my password?",
          answer: 'Go to Security settings, tap "Change Password", enter your current password, then set a new secure password.',
        },
        {
          id: "8",
          question: "Is my personal information secure?",
          answer: "Yes, all data is encrypted and stored securely. We use blockchain verification for transactions and comply with data privacy laws.",
        },
        {
          id: "9",
          question: "Can I have multiple accounts?",
          answer: "Each user should have only one account. Multiple accounts for the same person may result in suspension.",
        },
      ],
    },
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const filteredFAQs = searchQuery.trim()
    ? faqSections
        .map((section) => ({
          ...section,
          questions: section.questions.filter(
            (q) =>
              q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              q.answer.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((section) => section.questions.length > 0)
    : faqSections;

  return (
    <div className="help-support-page">
      {/* Header */}
      <div className="help-header">
        <h1>Help & Support</h1>
        <p>Find answers to common questions or contact our team</p>
      </div>

      {/* Search Bar */}
      <div className="help-search-container">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search for help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="help-content-grid">
        {/* Left Column: FAQs */}
        <div className="faq-column">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((section) => (
              <div key={section.id} className="faq-section-card">
                <div className="faq-section-header">
                  <div className="section-icon" style={{ color: section.color, background: `${section.color}15` }}>
                    {section.icon}
                  </div>
                  <h3>{section.title}</h3>
                </div>
                <div className="faq-list">
                  {section.questions.map((item) => (
                    <div key={item.id} className={`faq-item ${expandedFAQ === item.id ? "expanded" : ""}`}>
                      <button className="faq-question-btn" onClick={() => toggleFAQ(item.id)}>
                        <span>{item.question}</span>
                        {expandedFAQ === item.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      {expandedFAQ === item.id && (
                        <div className="faq-answer">
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <HelpCircle size={48} />
              <h3>No results found</h3>
              <p>Try different keywords or browse our FAQ sections</p>
            </div>
          )}
        </div>

        {/* Right Column: Contact & Quick Links */}
        <div className="contact-column">
          {/* Quick Contact Card */}
          <div className="contact-card">
            <h3>Quick Contact</h3>
            <div className="contact-options">
              <div className="contact-option">
                <div className="option-icon phone">
                  <Phone size={20} />
                </div>
                <div className="option-info">
                  <h4>Call Support</h4>
                  <p>Available 24/7</p>
                </div>
                <button className="action-btn">Call</button>
              </div>
              
              <div className="contact-option">
                <div className="option-icon email">
                  <Mail size={20} />
                </div>
                <div className="option-info">
                  <h4>Email Support</h4>
                  <p>Response within 24h</p>
                </div>
                <button className="action-btn">Email</button>
              </div>

              <div className="contact-option">
                <div className="option-icon chat">
                  <MessageSquare size={20} />
                </div>
                <div className="option-info">
                  <h4>Live Chat</h4>
                  <p>Chat with support</p>
                </div>
                <button className="action-btn">Chat</button>
              </div>
            </div>
          </div>

          {/* Popular Articles */}
          <div className="articles-card">
            <div className="card-header">
              <h3>Popular Articles</h3>
              <a href="#" className="view-all">View all</a>
            </div>
            <div className="articles-list">
              <div className="article-item">
                <FileText size={16} className="article-icon" />
                <div className="article-info">
                  <h4>How to claim discounts</h4>
                  <span>2 min read</span>
                </div>
                <ChevronRight size={16} className="arrow-icon" />
              </div>
              <div className="article-item">
                <FileText size={16} className="article-icon" />
                <div className="article-info">
                  <h4>Blockchain verification guide</h4>
                  <span>5 min read</span>
                </div>
                <ChevronRight size={16} className="arrow-icon" />
              </div>
              <div className="article-item">
                <FileText size={16} className="article-icon" />
                <div className="article-info">
                  <h4>Setting up security</h4>
                  <span>3 min read</span>
                </div>
                <ChevronRight size={16} className="arrow-icon" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
