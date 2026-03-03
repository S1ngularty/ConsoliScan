import React, { useState, useEffect, useRef } from "react";
import { Save, User as UserIcon, Mail, Shield, Camera } from "lucide-react";
import { getMe, updateProfile, updateAvatar } from "../../services/userService";
import "../../styles/admin/AdminProfileStyle.css"; 

const AdminProfile = () => {
  const [userId, setUserId] = useState("");
  
  // Clean data structure for the profile payload
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "" 
  });
  const [role, setRole] = useState("");
  
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getMe();
        
        // Safely extract the user object regardless of how the backend wraps it
        const user = response?.user || response;

        if (user && user._id || user?.id) {
          setUserId(String(user._id || user.id)); // Ensure ID is a clean string
          
          setFormData({ 
            name: user.name || "", 
            email: user.email || "" 
          });
          
          setRole(user.role === "super_admin" ? "Super Admin" : "Admin User");
          
          if (user.avatar?.url) {
            setAvatarPreview(user.avatar.url);
          }
        } else {
          setMessage({ type: "error", text: "Could not load user profile details." });
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        setMessage({ type: "error", text: "Failed to connect to the server." });
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
      setAvatarPreview(URL.createObjectURL(file)); 
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setMessage({ type: "error", text: "Missing User ID. Cannot save." });
      return;
    }

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // 1. Prepare the exact data structure for the text payload
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim()
      };

      // Pass the clean string ID and the payload object
      const profileResult = await updateProfile(userId, payload);
      
      if (profileResult instanceof Error) throw profileResult;

      // 2. Handle the avatar separately using your form-data service
      if (selectedFile) {
        const avatarResult = await updateAvatar(selectedFile, userId);
        if (avatarResult instanceof Error) {
          setMessage({ type: "error", text: "Profile text saved, but avatar failed to upload." });
          setIsSaving(false);
          return;
        }
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
        setSelectedFile(null); // Clear file queue after success
      }, 3000);
      
    } catch (error) {
      console.error("Save error:", error);
      const errorMsg = "Failed to update profile.";
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
            
            <div className="avatar-overlay" style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', 
              color: 'white', display: 'flex', justifyContent: 'center', padding: '5px'
            }}>
              <Camera size={16} />
            </div>
          </div>
          
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

        <div className="profile-form-card">
          <h3>Personal Information</h3>
          
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