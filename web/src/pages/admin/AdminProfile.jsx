import React, { useState, useEffect } from "react";
import { Save, User as UserIcon, Mail, Shield } from "lucide-react";
import { getMe, updateProfile } from "../../services/userService"; // Adjusted imports
import "../../styles/admin/AdminProfileStyle.css";

const AdminProfile = () => {
  const [userId, setUserId] = useState(null); // Added to track the user ID
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [role, setRole] = useState("");
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getMe();
        if (userData) {
          // Store the ID (assuming your backend uses _id or id)
          setUserId(userData._id || userData.id); 
          setFormData({ name: userData.name || "", email: userData.email || "" });
          setRole(userData.role === "super_admin" ? "Super Admin" : "Admin User");
        }
      } catch (error) {
        console.error("Failed to fetch profile details", error);
        setErrorMessage("Could not load profile data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!userId) {
      setErrorMessage("User ID is missing. Cannot update.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Call the service with the stored ID and the form data
      const result = await updateProfile(userId, formData);
      
      // Since your service returns the error on catch, we check if it failed
      if (result instanceof Error) {
        setErrorMessage(result.response?.data?.message || "Failed to update profile. Please try again.");
      } else {
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
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
          
          {/* Status Messages */}
          {successMessage && <div className="alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert-error" style={{ color: 'red', marginBottom: '10px' }}>{errorMessage}</div>}

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
              <button type="submit" className="save-btn" disabled={isSaving}>
                <Save size={18} /> {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;