import React, { useState, useRef, useEffect } from "react";
import "../../styles/css/chatBot.css";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hi there! 👋 How can I help you today?" }
  ]);
  const [showTooltip, setShowTooltip] = useState(true);
  const messagesEndRef = useRef(null);

  const predefinedQuestions = [
    {
      id: 1,
      question: "What is ConsoliScan?",
      answer: "ConsoliScan is your smart companion for sustainable grocery shopping. We help you track items, manage waste, and make eco-friendly choices!"
    },
    {
      id: 2,
      question: "How do I download the app?",
      answer: "You can download the ConsoliScan app from both the Apple App Store and Google Play Store. Check out the download section on our homepage!"
    },
    {
      id: 3,
      question: "How do I use the scanner?",
      answer: "It's easy! Open the app, tap the 'Scan' button, and point your camera at any product barcode. We'll instantly provide you with sustainability details."
    },
    {
      id: 4,
      question: "Is the app free?",
      answer: "Yes, ConsoliScan is completely free to download and use for all your basic sustainable shopping needs."
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (showTooltip) setShowTooltip(false);
  };

  const handleQuestionClick = (q) => {
    // Add user message
    setMessages(prev => [...prev, { type: "user", text: q.question }]);

    // Simulate bot thinking delay
    setTimeout(() => {
      setMessages(prev => [...prev, { type: "bot", text: q.answer }]);
    }, 600);
  };

  return (
    <div className="chatbot-container">
      {/* Tooltip "Can I help?" */}
      {showTooltip && !isOpen && (
        <div className="chatbot-tooltip">
          <div className="tooltip-content">
            <span className="tooltip-text">Can I help?</span>
            <button 
              className="tooltip-close" 
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button className={`chatbot-toggle ${isOpen ? "open" : ""}`} onClick={toggleChat} aria-label="Toggle Chat">
        {isOpen ? (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
          </svg>
        )}
        {!isOpen && <span className="notification-badge">1</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="header-info">
              <div className="bot-avatar">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <div>
                <h3>ConsoliScan Bot</h3>
                <span className="status-indicator">Online</span>
              </div>
            </div>
            <button className="header-close" onClick={toggleChat}>&times;</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                <div className="message-bubble">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-options">
            <p className="options-title">Frequently Asked Questions:</p>
            <div className="options-list">
              {predefinedQuestions.map((q) => (
                <button 
                  key={q.id} 
                  className="option-btn" 
                  onClick={() => handleQuestionClick(q)}
                >
                  {q.question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
