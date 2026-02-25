import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2 } from 'lucide-react';
import "../../styles/css/UserProfile.css";
import { getMe, updateProfile } from "../../services/userService";

const UserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    avatar: ''
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await getMe();
      if (userData) {
        setUser({
          _id: userData._id,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          avatar: userData.avatar?.url || 'https://via.placeholder.com/150'
        });
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // Only send updatable fields
      const updateData = {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber
      };
      
      await updateProfile(user._id, updateData);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>;

  return (
    <div className="user-profile-page">
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <img src={user.avatar} alt="Profile" className="profile-avatar" />
          <div className="edit-avatar-btn">
            <Camera size={18} />
          </div>
        </div>
        <h1 className="profile-name">{user.firstName} {user.lastName}</h1>
        <p className="profile-email">{user.email}</p>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>First Name</label>
          <input 
            type="text" 
            name="firstName"
            className="form-input" 
            value={user.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Last Name</label>
          <input 
            type="text" 
            name="lastName"
            className="form-input" 
            value={user.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input 
            type="email" 
            className="form-input" 
            value={user.email}
            disabled
            title="Email cannot be changed"
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input 
            type="tel" 
            name="phoneNumber"
            className="form-input" 
            value={user.phoneNumber}
            onChange={handleChange}
            placeholder="09123456789"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfile;
