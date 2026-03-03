import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Settings, LogOut, LayoutDashboard, ChevronLeft, Save } from "lucide-react"; 

import Sidebar from "../components/admin/SidebarComponent";
import ConfirmModalComponent from "../components/common/ConfirmModalComponent"; 
import { getMe } from "../services/userService"; 
import "../styles/admin/AdminLayoutStyle.css";

function AdminLayout() {  
  const [path, setPath] = useState('Admin / Dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false); 
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [user, setUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "" });

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getMe();
        if (userData) {
          setUser(userData);
          setEditFormData({ name: userData.name || "", email: userData.email || "" });
        }
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
        setTimeout(() => setIsEditingProfile(false), 200); 
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (isDropdownOpen) setIsEditingProfile(false); 
  };

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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    console.log("Saving new profile data:", editFormData);
    setUser((prev) => ({ ...prev, name: editFormData.name, email: editFormData.email }));
    setIsEditingProfile(false); 
  };

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
            
            {/* --- CLICKABLE PROFILE HEADER (Replaces Hamburger) --- */}
            <div className="admin-profile" onClick={toggleDropdown}>
              <span className="admin-profile-name">{user?.name || displayRole}</span>
              <div className="profile-badge-small">{userInitial}</div>
              <span className="dropdown-caret">&#9662;</span>
            </div>

            {/* --- DROPDOWN MENU / PROFILE EDITOR --- */}
            {isDropdownOpen && (
              <div className={`hamburger-dropdown-menu ${isEditingProfile ? 'expanded' : ''}`}>
                
                {/* Dropdown Header Info */}
                <div className="dropdown-user-info">
                  <div className="profile-badge-large">{userInitial}</div>
                  <div className="user-details">
                    <span className="user-name">{user?.name || displayRole}</span>
                    <span className="user-role">{displayRole}</span>
                  </div>
                </div>

                {/* Editor vs Menu Toggle */}
                {isEditingProfile ? (
                  <form className="profile-editor-form" onSubmit={handleProfileUpdate}>
                    <div className="form-header">
                      <button type="button" className="back-btn" onClick={() => setIsEditingProfile(false)}>
                        <ChevronLeft size={16} /> Back
                      </button>
                      <span>Edit Profile</span>
                    </div>
                    
                    <div className="form-group">
                      <label>Name</label>
                      <input 
                        type="text" 
                        value={editFormData.name} 
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input 
                        type="email" 
                        value={editFormData.email} 
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <button type="submit" className="save-profile-btn">
                      <Save size={16} /> Save Changes
                    </button>
                  </form>
                ) : (
                  <ul className="dropdown-list">
                    <li>
                      <Link to="/admin/dashboard" onClick={() => setIsDropdownOpen(false)}>
                        <LayoutDashboard size={18} /> Dashboard
                      </Link>
                    </li>
                    <li>
                      <button className="menu-action-btn" onClick={() => setIsEditingProfile(true)}>
                        <User size={18} /> Edit Profile
                      </button>
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
                )}
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