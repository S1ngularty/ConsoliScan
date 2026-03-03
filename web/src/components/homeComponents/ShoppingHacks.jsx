import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Lightbulb, Sparkles, ArrowRight, ShoppingBag, Zap, Leaf } from "lucide-react";
import "../../styles/css/ShoppingHacks.css";

const hacks = [
  {
    icon: <ShoppingBag size={32} />,
    title: "Never Shop Hungry",
    text: "Shopping on an empty stomach leads to impulse buying. Eat a snack before you go!",
    color: "#EF4444"
  },
  {
    icon: <Zap size={32} />,
    title: "The Eye-Level Trap",
    text: "Supermarkets place the most expensive items at eye level. Look up and down for better deals!",
    color: "#F59E0B"
  },
  {
    icon: <Leaf size={32} />,
    title: "Buy Seasonal",
    text: "Fruits and vegetables in season are cheaper, fresher, and tastier.",
    color: "#10B981"
  },
  {
    icon: <Sparkles size={32} />,
    title: "Generic vs. Brand",
    text: "Compare ingredients! Generic brands are often made in the same factory as name brands.",
    color: "#8B5CF6"
  },
  {
    icon: <Lightbulb size={32} />,
    title: "Unit Price is King",
    text: "Don't look at the final price. Check the price per unit (oz, g, kg) to find the real value.",
    color: "#3B82F6"
  }
];

const ShoppingHacks = ({ isOpen, onClose }) => {
  const [currentHack, setCurrentHack] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Random start
      setCurrentHack(Math.floor(Math.random() * hacks.length));
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const nextHack = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentHack((prev) => (prev + 1) % hacks.length);
      setIsAnimating(false);
    }, 300);
  };

  if (!isOpen) return null;

  const hack = hacks[currentHack];

  return ReactDOM.createPortal(
    <div className="hacks-overlay" onClick={onClose}>
      <div className="hacks-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="hacks-header">
          <div className="hacks-badge">
            <Sparkles size={16} />
            <span>Daily Shopping Hack</span>
          </div>
        </div>

        <div className={`hacks-content ${isAnimating ? "fade-out" : "fade-in"}`}>
          <div className="hack-icon-wrapper" style={{ backgroundColor: `${hack.color}20`, color: hack.color }}>
            {hack.icon}
          </div>
          
          <h2 style={{ color: hack.color }}>{hack.title}</h2>
          <p>{hack.text}</p>
        </div>

        <div className="hacks-footer">
          <button className="next-btn" onClick={nextHack}>
            <span>Next Tip</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Decorative elements */}
        <div className="confetti c1"></div>
        <div className="confetti c2"></div>
        <div className="confetti c3"></div>
      </div>
    </div>,
    document.body
  );
};

export default ShoppingHacks;
