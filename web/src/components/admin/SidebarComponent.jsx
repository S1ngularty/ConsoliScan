import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BadgeCheck,
  Users,
  Box,
  Layers,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  ChevronDown,
  Home,
  Database,
  Shield,
  FileText,
  BarChart3,
  ShoppingBag,
  Tag,
  Package,
  ShoppingCart,
} from "lucide-react";
import "../../styles/css/SidebarStyle.css";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ConfirmModalComponent from "../common/ConfirmModalComponent";

const Sidebar = ({ breadcrumb }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("");
  const [openDropdowns, setOpenDropdowns] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize active item based on current route
  useEffect(() => {
    const path = location.pathname;

    // Find which item corresponds to the current path
    const allItems = [
      ...menuItems.flatMap((section) => section.items),
      ...managementItems.flatMap((section) =>
        section.items.flatMap((item) => (item.dropdown ? item.dropdown : [])),
      ),
      ...otherItems.flatMap((section) => section.items),
    ];

    const currentItem = allItems.find((item) => item.navigate === path);
    if (currentItem) {
      setActiveItem(currentItem.name);

      // Open parent dropdown if it exists
      if (currentItem.parent) {
        setOpenDropdowns((prev) => [...new Set([...prev, currentItem.parent])]);
      }
    }
  }, [location.pathname]);

  async function logout() {
    try {
      const isLogout = await axios.post(
        `${import.meta.env.VITE_APP_API}api/v1/logout`,
        {},
        { withCredentials: true },
      );
      if (isLogout.data.success) navigate("/");
    } catch (error) {
      console.log(error);
    }
  }

  const toggleDropdown = (dropdownName) => {
    setOpenDropdowns((prev) =>
      prev.includes(dropdownName)
        ? prev.filter((name) => name !== dropdownName)
        : [...prev, dropdownName],
    );
  };

  const handleNavigation = (item) => {
    setActiveItem(item.name);
    if (item.navigate) {
      breadcrumb(item.location)
      navigate(item.navigate);
    }
  };

  // Grouped menu items
  const menuItems = [
    {
      section: "Main",
      items: [
        {
          name: "Dashboard",
          icon: <LayoutDashboard size={22} />,
          navigate: "/admin/dashboard",
        },
      ],
    },
  ];

  const managementItems = [
    {
      section: "Management",
      items: [
        {
          name: "User Management",
          icon: <Users size={22} />,
          hasDropdown: true,
          dropdown: [
            {
              name: "All Users",
              icon: <Users size={18} />,
              navigate: "/admin/users",
              location: "Admin / Users",
            },
            {
              name: "Roles & Permissions",
              icon: <Shield size={18} />,
              navigate: "/admin/users/roles",
              location: "Admin / Users / Roles",
            },
             {
              name: "Eligible Members",
              icon: <BadgeCheck size={18} />,
              navigate: "/admin/users/beneficiary",
              location: "Admin / Users / Beneficiary",
            },
            {
              name: "Activity Logs",
              icon: <FileText size={18} />,
              navigate: "/admin/users/activity",
              location: "Admin / Users / Activity",
            },
          ],
        },
        {
          name: "Product Management",
          icon: <Package size={22} />,
          hasDropdown: true,
          dropdown: [
            {
              name: "All Products",
              icon: <ShoppingBag size={18} />,
              navigate: "/admin/products",
              location: "Admin / Products ",
            },
            {
              name: "Inventory",
              icon: <Database size={18} />,
              navigate: "/admin/products/inventory",
              location: "Admin / Products / Inventory ",
            },
          ],
        },
        {
          name: "Category Management",
          icon: <Layers size={22} />,
          hasDropdown: true,
          dropdown: [
            {
              name: "All Categories",
              icon: <Tag size={18} />,
              navigate: "/admin/categories",
              location: "Admin / Categories ",
            },
          ],
        },
        {
          name: "Order Management",
          icon: <ShoppingCart size={22} />,
          hasDropdown: true,
          dropdown: [
            {
              name: "All Orders",
              icon: <ShoppingBag size={18} />,
              navigate: "/admin/orders",
            },
            {
              name: "Pending Orders",
              icon: <BarChart3 size={18} />,
              navigate: "/admin/orders/pending",
            },
          ],
        },
      ],
    },
  ];

  const otherItems = [
    {
      section: "Other",
      items: [
        {
          name: "Settings",
          icon: <Settings size={22} />,
          navigate: "/admin/settings",
        },
        {
          name: "Analytics",
          icon: <BarChart3 size={22} />,
          navigate: "/admin/analytics",
        },
        {
          name: "Reports",
          icon: <FileText size={22} />,
          navigate: "/admin/reports",
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
      {sectionData.items.map((item) => {
        if (item.hasDropdown) {
          const isOpen = openDropdowns.includes(item.name);

          return (
            <div
              key={item.name}
              className={`nav-item has-dropdown ${isOpen ? "dropdown-open" : ""}`}
              data-tooltip={item.name}
            >
              <div
                className="dropdown-header"
                onClick={() => toggleDropdown(item.name)}
              >
                <div className="nav-icon">{item.icon}</div>
                {!isCollapsed && (
                  <>
                    <span className="nav-label">{item.name}</span>
                    <ChevronDown size={16} className="chevron-icon" />
                  </>
                )}
                {isCollapsed && (
                  <div className="collapsed-badge">{item.dropdown.length}</div>
                )}
              </div>

              <div className="dropdown-menu">
                {item.dropdown.map((subItem, subIndex) => (
                  <div
                    key={subIndex}
                    className={`dropdown-item ${activeItem === subItem.name ? "active" : ""}`}
                    onClick={() => handleNavigation(subItem)}
                    data-tooltip={subItem.name}
                  >
                    <div className="nav-icon">{subItem.icon}</div>
                    {!isCollapsed && (
                      <span className="nav-label">{subItem.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.name}
            className={`nav-item ${activeItem === item.name ? "active" : ""}`}
            onClick={() => handleNavigation(item)}
            data-tooltip={item.name}
          >
            <div className="nav-icon">{item.icon}</div>
            {!isCollapsed && <span className="nav-label">{item.name}</span>}
          </div>
        );
      })}
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

      {/* Sidebar Header */}
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

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {/* Main Section */}
        {menuItems.map(renderSection)}

        {/* Management Section */}
        {managementItems.map(renderSection)}

        {/* Other Section */}
        {otherItems.map(renderSection)}
      </nav>

      {/* Sidebar Footer */}
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

export default Sidebar;
