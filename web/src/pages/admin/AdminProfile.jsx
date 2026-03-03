import React, { useState, useEffect, useRef } from "react";
import { Save, User as UserIcon, Mail, Shield, Camera } from "lucide-react";
import { getMe, updateProfile, updateAvatar } from "../../services/userService"; // Links to your exact service file
import "../../styles/admin/AdminProfileStyle.css"; 

const AdminProfile = () => {
  const [userId, setUserId] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [role, setRole] = useState("");
  
  // Avatar states
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getMe();
        // Check if we actually got data and not an Error object back from the service
        if (userData && !(userData instanceof Error)) {
          // Store the ID so we can pass it to the update functions
          setUserId(userData._id || userData.id); 
          setFormData({ name: userData.name || "", email: userData.email || "" });
          setRole(userData.role === "super_admin" ? "Super Admin" : "Admin User");
          
          // If your backend returns an avatar URL, set it here for the preview
          if (userData.avatar?.url) {
            setAvatarPreview(userData.avatar.url);
          }
        } else {
          setMessage({ type: "error", text: "Could not load user data." });
        }
      } catch (error) {
        console.error("Failed to fetch profile details", error);
        setMessage({ type: "error", text: "Failed to load profile data." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a local preview URL so the user sees the image immediately
      setAvatarPreview(URL.createObjectURL(file)); 
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!userId) {
      setMessage({ type: "error", text: "User ID is missing. Cannot update." });
      return;
    }

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // 1. Update text profile info
      const profileResult = await updateProfile(userId, formData);
      
      // Since your service returns the error object, we check for it
      if (profileResult instanceof Error) {
        throw profileResult; 
      }

      // 2. Update avatar if a new file was selected
      if (selectedFile) {
        const avatarResult = await updateAvatar(selectedFile, userId);
        if (avatarResult instanceof Error) {
          setMessage({ type: "error", text: "Profile updated, but avatar upload failed." });
          setIsSaving(false);
          return;
        }
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      
    } catch (error) {
      console.error("Profile update error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to update profile. Please try again.";
      setMessage({ type: "error", text: errorMsg });
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
          <div 
            className="avatar-large" 
            style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
            onClick={() => fileInputRef.current.click()}
          >
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
              />
            ) : (
              formData.name ? formData.name.charAt(0).toUpperCase() : "A"
            )}
            
            {/* Hover overlay for camera icon */}
            <div className="avatar-overlay" style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', 
              color: 'white', display: 'flex', justifyContent: 'center', padding: '5px'
            }}>
              <Camera size={16} />
            </div>
          </div>
          
          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
          
          <h3 className="avatar-name">{formData.name || "Admin Name"}</h3>
          <span className="avatar-role">{role}</span>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Click image to change</p>
        </div>

        {/* Right Side: Edit Form Card */}
        <div className="profile-form-card">
          <h3>Personal Information</h3>
          
          {/* Status Messages */}
          {message.text && (
            <div className={`alert-${message.type}`} style={{ 
              color: message.type === 'error' ? 'red' : 'green', 
              marginBottom: '15px', padding: '10px', 
              backgroundColor: message.type === 'error' ? '#ffebee' : '#e8f5e9',
              borderRadius: '4px'
            }}>
              {message.text}
            </div>
          )}

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