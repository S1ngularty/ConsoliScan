import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Save, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  ChevronRight, 
  Upload, 
  X, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import "../../styles/css/UserProfile.css";
import { getMe, updateProfile, applyEligibility, updateAvatar } from "../../services/userService";
import { fetchHomeData } from "../../services/customerService";

const UserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState({
    _id: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    avatar: '',
    role: ''
  });
  const [eligibilityStatus, setEligibilityStatus] = useState({
    verified: false,
    status: 'none', // none, pending, verified, rejected
    type: null
  });

  // Modal State
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationData, setApplicationData] = useState({
    idType: 'pwd', // pwd or senior
    idNumber: '',
    dateIssued: '',
    expiryDate: '',
    typeOfDisability: '',
    idFront: null,
    idBack: null,
    userPhoto: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userData, homeData] = await Promise.all([
        getMe(),
        fetchHomeData()
      ]);

      if (userData) {
        // Split name into first and last
        const nameParts = (userData.name || '').split(' ');
        const lastName = nameParts.length > 1 ? nameParts.pop() : '';
        const firstName = nameParts.join(' ');

        setUser({
          _id: userData._id,
          firstName: firstName,
          lastName: lastName,
          email: userData.email || '',
          phoneNumber: userData.contactNumber || '',
          avatar: userData.avatar?.url || 'https://via.placeholder.com/150',
          role: userData.role
        });
      }

      if (homeData) {
        // Infer status from homeData or user object if available
        // Assuming homeData.is_eligibility_verified is boolean
        // For detailed status (pending/rejected), we might need to check specific fields if available
        // For now, simple mapping based on available data
        setEligibilityStatus({
          verified: homeData.is_eligibility_verified,
          status: homeData.is_eligibility_verified ? 'verified' : 'none', 
          // If there's a pending flag in the future, we can update this
        });
      }
    } catch (error) {
      console.error("Failed to load profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updateData = {
        name: `${user.firstName} ${user.lastName}`.trim(),
        contactNumber: user.phoneNumber
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

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Create preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);

      // Upload
      await updateAvatar(file, user._id);
      // alert("Avatar updated!");
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Failed to upload avatar");
    }
  };

  // Eligibility Logic
  const handleApplicationChange = (name, value) => {
    setApplicationData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name, e) => {
    const file = e.target.files[0];
    if (file) {
      setApplicationData(prev => ({ ...prev, [name]: file }));
    }
  };

  const removeFile = (name) => {
    setApplicationData(prev => ({ ...prev, [name]: null }));
  };

  const submitApplication = async () => {
    // Validation
    if (!applicationData.idNumber || !applicationData.dateIssued || !applicationData.idFront || !applicationData.idBack || !applicationData.userPhoto) {
      alert("Please fill in all required fields and upload all images.");
      return;
    }

    if (applicationData.idType === 'pwd' && !applicationData.typeOfDisability) {
      alert("Please select type of disability.");
      return;
    }

    try {
      setApplicationLoading(true);
      await applyEligibility(user._id, applicationData);
      
      alert("Application submitted successfully! Please wait for admin verification.");
      setShowEligibilityModal(false);
      setEligibilityStatus(prev => ({ ...prev, status: 'pending' })); // Optimistic update
    } catch (error) {
      console.error("Application failed:", error);
      alert(error.response?.data?.message || "Failed to submit application. Please try again.");
    } finally {
      setApplicationLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-state">
      <Loader2 className="animate-spin" size={48} color="#00A86B" />
    </div>
  );

  return (
    <div className="user-profile-page">
      <div className="profile-header-section">
        <h1>My Profile</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="profile-content-grid">
        {/* Left Column: Personal Info */}
        <div className="profile-card">
          <div className="card-title">
            Personal Information
          </div>

          <div className="profile-avatar-wrapper">
            <img src={user.avatar} alt="Profile" className="profile-avatar" />
            <label htmlFor="avatar-upload" className="edit-avatar-btn">
              <Camera size={18} />
            </label>
            <input 
              type="file" 
              id="avatar-upload" 
              accept="image/*" 
              onChange={handleAvatarChange} 
              hidden 
            />
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  name="firstName"
                  className="form-input" 
                  value={user.firstName}
                  onChange={handleProfileChange}
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
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={user.email}
                  disabled
                />
              </div>
              <div className="form-group full-width">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  name="phoneNumber"
                  className="form-input" 
                  value={user.phoneNumber}
                  onChange={handleProfileChange}
                  placeholder="09123456789"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Eligibility & Security */}
        <div className="right-column">
          {/* Eligibility Card */}
          <div className="profile-card">
            <div className="card-title">
              Discount Eligibility
            </div>

            {eligibilityStatus.verified ? (
              <div className="eligibility-status-card">
                <div className="status-icon verified">
                  <ShieldCheck size={24} />
                </div>
                <div className="status-content">
                  <h3>Verified Eligible</h3>
                  <p>You are eligible for PWD/Senior discounts on BNPC items.</p>
                </div>
              </div>
            ) : eligibilityStatus.status === 'pending' ? (
              <div className="eligibility-status-card">
                <div className="status-icon pending">
                  <Clock size={24} />
                </div>
                <div className="status-content">
                  <h3>Verification Pending</h3>
                  <p>Your application is currently being reviewed by our team.</p>
                </div>
              </div>
            ) : (
              <div className="apply-card">
                <ShieldAlert size={48} className="apply-icon" />
                <h3>Apply for Discount</h3>
                <p>
                  Are you a PWD or Senior Citizen? Apply now to get exclusive 5% discounts on basic necessities.
                </p>
                <button className="apply-btn" onClick={() => setShowEligibilityModal(true)}>
                  Apply Now <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showEligibilityModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Apply for Eligibility</h2>
              <button className="close-btn" onClick={() => setShowEligibilityModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>I am applying as:</label>
                <div className="type-selector">
                  <div 
                    className={`type-option ${applicationData.idType === 'pwd' ? 'active' : ''}`}
                    onClick={() => handleApplicationChange('idType', 'pwd')}
                  >
                    PWD
                  </div>
                  <div 
                    className={`type-option ${applicationData.idType === 'senior' ? 'active' : ''}`}
                    onClick={() => handleApplicationChange('idType', 'senior')}
                  >
                    Senior Citizen
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>ID Number *</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={applicationData.idNumber}
                  onChange={(e) => handleApplicationChange('idNumber', e.target.value)}
                  placeholder="Enter your ID number"
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Date Issued *</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={applicationData.dateIssued}
                    onChange={(e) => handleApplicationChange('dateIssued', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {applicationData.idType === 'pwd' && (
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input 
                      type="date" 
                      className="form-input"
                      value={applicationData.expiryDate}
                      onChange={(e) => handleApplicationChange('expiryDate', e.target.value)}
                      min={applicationData.dateIssued}
                    />
                  </div>
                )}
              </div>

              {applicationData.idType === 'pwd' && (
                <div className="form-group">
                  <label>Type of Disability *</label>
                  <select 
                    className="form-input"
                    value={applicationData.typeOfDisability}
                    onChange={(e) => handleApplicationChange('typeOfDisability', e.target.value)}
                  >
                    <option value="">Select Disability Type</option>
                    <option value="visual">Visual Impairment</option>
                    <option value="hearing">Hearing Impairment</option>
                    <option value="physical">Physical Disability</option>
                    <option value="mental">Mental Disability</option>
                    <option value="multiple">Multiple Disabilities</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Upload Documents *</label>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {['idFront', 'idBack', 'userPhoto'].map((field) => (
                    <div key={field} className="file-upload-section">
                      {applicationData[field] ? (
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={URL.createObjectURL(applicationData[field])} 
                            alt="preview" 
                            className="upload-preview" 
                          />
                          <button className="remove-file" onClick={() => removeFile(field)}>
                            <X size={16} />
                          </button>
                          <p style={{ marginTop: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                            {field === 'idFront' ? 'Front of ID' : field === 'idBack' ? 'Back of ID' : 'Selfie with ID'}
                          </p>
                        </div>
                      ) : (
                        <label style={{ cursor: 'pointer', display: 'block' }}>
                          <div className="upload-placeholder">
                            <Upload size={24} />
                            <span>
                              Upload {field === 'idFront' ? 'Front of ID' : field === 'idBack' ? 'Back of ID' : 'Selfie with ID'}
                            </span>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            hidden 
                            onChange={(e) => handleFileChange(field, e)} 
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={() => setShowEligibilityModal(false)}
                disabled={applicationLoading}
              >
                Cancel
              </button>
              <button 
                className="submit-btn" 
                onClick={submitApplication}
                disabled={applicationLoading}
              >
                {applicationLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} /> Submit Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
