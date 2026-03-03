import React, { useState, useEffect } from "react";
import { Save, User as UserIcon, Mail, Shield } from "lucide-react";
import { getMe } from "../../services/userService"; // Adjust path as needed
import "../../styles/admin/AdminProfileStyle.css"; // Adjust path as needed

const AdminProfile = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getMe();
        if (userData) {
          setFormData({ name: userData.name || "", email: userData.email || "" });
          setRole(userData.role === "super_admin" ? "Super Admin" : "Admin User");
        }
      } catch (error) {
        console.error("Failed to fetch profile details", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    // TODO: Add your Axios PUT request here to save data to the DB
    console.log("Submitting profile update:", formData);
    
    // Simulating a successful save
    setSuccessMessage("Profile updated successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  if (isLoading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="admin-profile-page">
      <div className="profile-page-header">
        <h2>My Profile</h2>
        <p>Manage your account settings and personal information.</p>
      </div>

      <div className="profile-content-grid">
        {/* Left Side: Avatar Card */}
        <div className="profile-avatar-card">
          <div className="avatar-large">
            {formData.name ? formData.name.charAt(0).toUpperCase() : "A"}
          </div>
          <h3 className="avatar-name">{formData.name || "Admin Name"}</h3>
          <span className="avatar-role">{role}</span>
        </div>

        {/* Right Side: Edit Form Card */}
        <div className="profile-form-card">
          <h3>Personal Information</h3>
          
          {successMessage && <div className="alert-success">{successMessage}</div>}

          <form onSubmit={handleUpdate}>
            <div className="form-group-row">
              <div className="form-group">
                <label><UserIcon size={14} /> Full Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="form-group-row">
              <div className="form-group">
                <label><Mail size={14} /> Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label><Shield size={14} /> Account Role (Read-only)</label>
                <input 
                  type="text" 
                  value={role} 
                  disabled
                  className="input-disabled"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;