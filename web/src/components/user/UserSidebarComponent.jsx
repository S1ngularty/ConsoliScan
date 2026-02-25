import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  User,
  ShoppingBag,
  Heart,
  Star,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import "../../styles/css/SidebarStyle.css";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ConfirmModalComponent from "../common/ConfirmModalComponent";

const UserSidebar = ({ breadcrumb }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const allItems = menuItems.flatMap((section) => section.items);
    const currentItem = allItems.find((item) => item.navigate === path);
    if (currentItem) {
      setActiveItem(currentItem.name);
    }
  }, [location.pathname]);

  async function logout() {
    try {
      const isLogout = await axios.post(
        `${import.meta.env.VITE_APP_API}api/v1/logout`,
        {},
        { withCredentials: true }
      );
      if (isLogout.data.success) {
        sessionStorage.removeItem("isLogin");
        navigate("/login"); // Redirect to login page
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handleNavigation = (item) => {
    setActiveItem(item.name);
    if (item.navigate) {
        if(breadcrumb) breadcrumb(item.name); // Simplified breadcrumb for user
        navigate(item.navigate);
    }
  };

  const menuItems = [
    {
      section: "Account",
      items: [
        {
          name: "Dashboard",
          icon: <LayoutDashboard size={22} />,
          navigate: "/user/dashboard",
        },
        {
          name: "My Profile",
          icon: <User size={22} />,
          navigate: "/user/profile",
        },
        {
          name: "Order History",
          icon: <ShoppingBag size={22} />,
          navigate: "/user/orders",
        },
        {
          name: "Saved Items",
          icon: <Heart size={22} />,
          navigate: "/user/saved",
        },
        {
          name: "Loyalty Points",
          icon: <Star size={22} />,
          navigate: "/user/loyalty",
        },
      ],
    },
  ];

  const renderSection = (sectionData, index) => (
    <div key={index} className="sidebar-section">
      {!isCollapsed && (
        <div className="section-header">
          <span className="section-label">{sectionData.section}</span>
        </div>
      )}
      {sectionData.items.map((item) => (
        <div
          key={item.name}
          className={`nav-item ${activeItem === item.name ? "active" : ""}`}
          onClick={() => handleNavigation(item)}
          data-tooltip={item.name}
        >
          <div className="nav-icon">{item.icon}</div>
          {!isCollapsed && <span className="nav-label">{item.name}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {showConfirmModal && (
        <ConfirmModalComponent
          isOpen={showConfirmModal}
          title="Do you want to Logout?"
          onConfirm={logout}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      <div className="sidebar-header">
        <div className="logo-container">
          <div className="cart-icon-bg">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          {!isCollapsed && (
            <span className="logo-text">
              <span className="brand-c">C</span>onsoliScan
            </span>
          )}
        </div>
        <button
          className="toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(renderSection)}
      </nav>

      <div className="sidebar-footer">
        <div
          className="nav-item logout"
          onClick={() => setShowConfirmModal(true)}
          data-tooltip="Logout"
        >
          <div className="nav-icon">
            <LogOut size={22} />
          </div>
          {!isCollapsed && <span className="nav-label">Logout</span>}
        </div>
      </div>
    </div>
  );
};

export default UserSidebar;
