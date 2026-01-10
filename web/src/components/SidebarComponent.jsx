import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Box,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
} from "lucide-react";
import "../styles/admin/SidebarStyle.css";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={22} />,
      navigate: "/admin/dashboard",
    },
    { name: "Manage User", icon: <Users size={22} />, navigate: "/admin/user" },
    { name: "Manage Product", icon: <Box size={22} />, navigate: "/admin" },
    { name: "Settings", icon: <Settings size={22} />, navigate: "/admin" },
  ];

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
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
              strokeWidth="2.5">
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
          onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.name}
            className={`nav-item ${activeItem === item.name ? "active" : ""}`}
            onClick={() => {
              setActiveItem(item.name);
              navigate(item.navigate);
            }}>
            <div className="nav-icon">{item.icon}</div>
            {!isCollapsed && <span className="nav-label">{item.name}</span>}
            {isCollapsed && <div className="tooltip">{item.name}</div>}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="nav-item logout">
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
