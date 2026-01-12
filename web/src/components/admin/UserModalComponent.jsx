import React from "react";
import { X, Save, User, MapPin, Phone, Mail, ShieldCheck } from "lucide-react";
import "../../styles/admin/UserModalStyle.css";

function UserModalComponent({ isOpen, data, Onclose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={Onclose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        
        <header className="modal-header">
          <div className="header-title">
            <div className="icon-circle">
              <User size={20} />
            </div>
            <div>
              <h2>{data ? "Edit User Profile" : "Create New User"}</h2>
              <p className="subtitle">ID: {data?.firebaseUid || "New User"}</p>
            </div>
          </div>
          <button className="close-x" onClick={Onclose}><X size={20} /></button>
        </header>

        <div className="modal-body-columns">
          {/* LEFT SIDE: Identity & Contact */}
          <div className="side-panel">
            <div className="section-label"><User size={14} /> Basic Information</div>
            
            <div className="avatar-upload-section">
              <img 
                src={data?.avatar?.url || "https://via.placeholder.com/80"} 
                alt="Avatar" 
                className="modal-avatar-preview"
              />
              <button className="change-photo-btn">Change Photo</button>
            </div>

            <div className="input-grid">
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" defaultValue={data?.name} placeholder="user surname" />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" defaultValue={data?.email} placeholder="email@example.com" />
              </div>
              <div className="input-group">
                <label>Contact Number</label>
                <input type="text" defaultValue={data?.contactNumber} placeholder="+63..." />
              </div>
            </div>

            <div className="section-label" style={{marginTop: '20px'}}><ShieldCheck size={14} /> Account Status</div>
            <div className="input-grid">
              <div className="input-group">
                <label>Role</label>
                <select defaultValue={data?.role}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Checker</option>
                </select>
              </div>
              <div className="input-group">
                <label>Status</label>
                <select defaultValue={data?.status}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Address Details */}
          <div className="side-panel">
            <div className="section-label"><MapPin size={14} /> Location Details</div>
            
            <div className="input-group">
              <label>Street Address</label>
              <input type="text" defaultValue={data?.street} placeholder="123 Main St" />
            </div>

            <div className="input-grid">
              <div className="input-group">
                <label>City</label>
                <input type="text" defaultValue={data?.city} />
              </div>
              <div className="input-group">
                <label>State / Province</label>
                <input type="text" defaultValue={data?.state} />
              </div>
            </div>

            <div className="input-grid">
              <div className="input-group">
                <label>Zip Code</label>
                <input type="text" defaultValue={data?.zipCode} />
              </div>
              <div className="input-group">
                <label>Country</label>
                <input type="text" defaultValue={data?.country || "United States"} />
              </div>
            </div>

            <div className="info-box">
              <p><strong>Last Login:</strong> {data?.lastLogin ? new Date(data.lastLogin).toLocaleString() : "Never"}</p>
              <p><strong>Joined:</strong> {data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : "Today"}</p>
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn-secondary" onClick={Onclose}>Discard Changes</button>
          <button className="btn-primary">
            <Save size={18} />
            <span>Update User</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

export default UserModalComponent;