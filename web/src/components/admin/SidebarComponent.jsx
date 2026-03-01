import React, { useState, useEffect, useMemo } from "react";
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
  Percent,
  Package,
  ShoppingCart,
  PercentCircle,
  Tags,
  Coins,
  CoinsIcon,
  HandCoins,
  Warehouse,
  ClipboardList,
  Truck,
  Heart,
  LineChart,
} from "lucide-react";
import "../../styles/css/SidebarStyle.css";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ConfirmModalComponent from "../common/ConfirmModalComponent";
import { getMe } from "../../services/userService";

const Sidebar = ({ breadcrumb }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("");
  const [openDropdowns, setOpenDropdowns] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = await getMe();
        if (user) {
          setUserRole(user.role);
        }
      } catch (error) {
        console.error("Failed to fetch user role", error);
      }
    };
    fetchUserRole();
  }, []);

  // Initialize active item based on current route
  useEffect(() => {
    const path = location.pathname;

    // Find which item corresponds to the current path
    const allItems = [
      ...menuItems.flatMap((section) => section.items),
      ...filteredManagementItems.flatMap((section) =>
        section.items.flatMap((item) => (item.dropdown ? item.dropdown : [])),
      ),
      ...filteredOtherItems.flatMap((section) => section.items),
    ];

    const currentItem = allItems.find((item) => item.navigate === path);
    if (currentItem) {
      setActiveItem(currentItem.name);

      // Open parent dropdown if it exists
      if (currentItem.parent) {
        setOpenDropdowns((prev) => [...new Set([...prev, currentItem.parent])]);
      }
    }
  }, [location.pathname, userRole]);

  async function logout() {
    try {
      const isLogout = await axios.post(
        `${import.meta.env.VITE_APP_API}api/v1/logout`,
        {},
        { withCredentials: true },
      );
      if (isLogout.data.success) navigate("/");
    } catch (error) {
      console.error(error);
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
      breadcrumb(item.location);
      navigate(item.navigate);
    }
  };

  const filteredManagementItems = useMemo(() => {
    if (userRole === "super_admin") return managementItems;

    if (userRole === "admin") {
      return managementItems.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          if (item.name === "User Management") {
            return {
              ...item,
              dropdown: item.dropdown.filter(
                (d) => d.name !== "Roles & Permissions",
              ),
            };
          }
          return item;
        }),
      }));
    }

    // Return managementItems by default (while loading or for other roles)
    return managementItems;
  }, [userRole]);

  const filteredOtherItems = useMemo(() => {
    if (userRole === "super_admin") return otherItems;

    if (userRole === "admin") {
      return otherItems.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.name !== "Settings"),
      }));
    }

    // Return otherItems by default (while loading or for other roles)
    return otherItems;
  }, [userRole]);

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
        {filteredManagementItems.map(renderSection)}

        {/* Other Section */}
        {filteredOtherItems.map(renderSection)}
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

// Static Data
const menuItems = [
  {
    section: "Main",
    items: [
      {
        name: "Dashboard",
        icon: <LayoutDashboard size={22} />,
        navigate: "/admin/dashboard",
        location: "Admin / Dashboard",
      },
    ],
  },
];

const managementItems = [
  {
    section: "ERP Modules",
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
            icon: <ClipboardList size={18} />,
            navigate: "/admin/users/activity",
            location: "Admin / Users / Activity",
          },
        ],
      },
      {
        name: "Inventory Control",
        icon: <Warehouse size={22} />,
        hasDropdown: true,
        dropdown: [
          {
            name: "Item Master",
            icon: <Package size={18} />,
            navigate: "/admin/products",
            location: "Admin / Inventory / Items ",
          },
          {
            name: "Stock Status",
            icon: <Database size={18} />,
            navigate: "/admin/products/inventory",
            location: "Admin / Inventory / Status ",
          },
          {
            name: "Categories",
            icon: <Layers size={18} />,
            navigate: "/admin/categories",
            location: "Admin / Inventory / Categories ",
          },
        ],
      },
      {
        name: "Sales & Distribution",
        icon: <ShoppingCart size={22} />,
        hasDropdown: true,
        dropdown: [
          {
            name: "Sales Transactions",
            icon: <FileText  size={18} />,
            navigate: "/admin/orders",
            location: "Admin / Sales / Transactions ",
          },
        ],
      },
      {
        name: "CRM & Marketing",
        icon: <Heart size={22} />,
        hasDropdown: true,
        dropdown: [
          {
            name: "Promotions",
            icon: <Tags size={18} />,
            navigate: "/admin/discount/promo",
            location: "Admin / CRM / Promo ",
          },
          {
            name: "Loyalty Program",
            icon: <Coins size={18} />,
            navigate: "/admin/discount/loyalty",
            location: "Admin / CRM / Loyalty ",
          },
        ],
      },
    ],
  },
];

const otherItems = [
  {
    section: "System",
    items: [
      {
        name: "Business Reports",
        icon: <LineChart size={22} />,
        navigate: "/admin/reports",
        location: "Admin / Reports",
      },
      {
        name: "Settings",
        icon: <Settings size={22} />,
        navigate: "/admin/settings",
        location: "Admin / Settings",
      },
    ],
  },
];

export default Sidebar;
