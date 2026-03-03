import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Settings, LogOut, LayoutDashboard } from "lucide-react"; 

import Sidebar from "../components/admin/SidebarComponent";
import ConfirmModalComponent from "../components/common/ConfirmModalComponent"; 
import { getMe } from "../services/userService"; 
import "../styles/admin/AdminLayoutStyle.css";

function AdminLayout() {  
  const [path, setPath] = useState('Admin / Dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [user, setUser] = useState(null);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getMe();
        if (userData) setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  async function handleLogout() {
    try {
      const isLogout = await axios.post(
        `${import.meta.env.VITE_APP_API}api/v1/logout`,
        {},
        { withCredentials: true }
      );
      if (isLogout.data.success) navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const displayRole = user && user.role === "super_admin" ? "Super Admin" : "Admin User";
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "A";

  return (
    <div className="admin-layout-wrapper">
      <Sidebar breadcrumb={setPath} />

      {showConfirmModal && (
        <ConfirmModalComponent
          isOpen={showConfirmModal}
          title="Do you want to Logout?"
          onConfirm={handleLogout}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      <div className="admin-main-container">
        <header className="admin-top-nav">
          <div className="breadcrumb">{path}</div>
          
          <div className="admin-hamburger-container" ref={dropdownRef}>
            
            <div className="admin-profile" onClick={toggleDropdown}>
              <span className="admin-profile-name">{user?.name || displayRole}</span>
              <div className="profile-badge-small">{userInitial}</div>
              <span className="dropdown-caret">&#9662;</span>
            </div>

            {isDropdownOpen && (
              <div className="hamburger-dropdown-menu">
                <div className="dropdown-user-info">
                  <div className="profile-badge-large">{userInitial}</div>
                  <div className="user-details">
                    <span className="user-name">{user?.name || displayRole}</span>
                    <span className="user-role">{displayRole}</span>
                  </div>
                </div>

                <ul className="dropdown-list">
                  <li>
                    <Link to="/admin/dashboard" onClick={() => setIsDropdownOpen(false)}>
                      <LayoutDashboard size={18} /> Dashboard
                    </Link>
                  </li>
                  <li>
                    {/* Now links directly to the new actual page */}
                    <Link to="/admin/profile" onClick={() => setIsDropdownOpen(false)}>
                      <User size={18} /> Edit Profile
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/settings" onClick={() => setIsDropdownOpen(false)}>
                      <Settings size={18} /> Settings
                    </Link>
                  </li>
                  <li className="logout-item">
                    <button className="menu-action-btn logout-text" onClick={() => {
                      setIsDropdownOpen(false);
                      setShowConfirmModal(true);
                    }}>
                      <LogOut size={18} /> Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </header>

        <main className="admin-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;