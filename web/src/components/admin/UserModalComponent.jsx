import React from "react";
import {
  X,
  Save,
  User,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  Cake,
} from "lucide-react";
import "../../styles/admin/user/UserModalStyle.css";
import { createUser, editUser, updateAvatar } from "../../services/userService";

function UserModalComponent({ isOpen, data, mode, onClose, onSave }) {
  const [userInfo, setUserInfo] = React.useState({});

  function handleInput(field, value) {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    try {
      const result =
        mode !== "edit"
          ? await createUser(userInfo)
          : await editUser(userInfo, data._id);
      setUserInfo({});
      onSave(true);
      return;
    } catch (error) {
      console.error(error);
      onSave(true);
    }
  }

  function handleAvatar(file) {
    const reader = new FileReader();
    reader.onload = () => {
      setUserInfo((prev) => ({ ...prev, avatar: { url: reader.result } }));
    };
    reader.readAsDataURL(file);
    updateAvatar(file, data._id);
  }

  // Calculate age from birthDate
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Handle birthDate change and update age
  const handleBirthDateChange = (e) => {
    const birthDate = e.target.value;
    handleInput("birthDate", birthDate);

    if (birthDate) {
      const age = calculateAge(birthDate);
      handleInput("age", age);
    }
  };

  // Handle age change and estimate birthDate
  const handleAgeChange = (e) => {
    const age = parseInt(e.target.value) || null;
    handleInput("age", age);

    if (age && age > 0) {
      const today = new Date();
      const estimatedYear = today.getFullYear() - age;
      const estimatedBirthDate = `${estimatedYear}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      handleInput("birthDate", estimatedBirthDate);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="user-modal modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="header-title">
            <div className="icon-circle">
              <User size={20} />
            </div>
            <div>
              <h2>
                {mode === "edit" ? "Edit User Profile" : "Create New User"}
              </h2>
              <p className="subtitle">ID: {data?.firebaseUid || "New User"}</p>
            </div>
          </div>
          <button className="close-x" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {/* Scrollable content area */}
        <div className="modal-scrollable-content">
          <div className="modal-body-columns">
            {/* LEFT SIDE: Identity & Contact */}
            <div className="side-panel">
              <div className="section-label">
                <User size={14} /> Basic Information
              </div>

              <div className="avatar-upload-section">
                <img
                  src={
                    userInfo.avatar?.url ||
                    data?.avatar?.url ||
                    "https://www.pngall.com/wp-content/uploads/12/Avatar-Profile-PNG-Image.png"
                  }
                  alt="Avatar"
                  className="modal-avatar-preview"
                />
                <input
                  type="file"
                  className="change-photo-btn"
                  onChange={(e) => {
                    handleAvatar(e.target.files[0]);
                  }}
                />
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    defaultValue={data?.name}
                    placeholder="User name"
                    onChange={(e) => handleInput("name", e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    defaultValue={data?.email}
                    placeholder="email@example.com"
                    onChange={(e) => handleInput("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label>Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    defaultValue={data?.age}
                    placeholder="25"
                    onChange={handleAgeChange}
                  />
                </div>
                <div className="input-group">
                  <label>Birth Date</label>
                  <input
                    type="date"
                    defaultValue={
                      data?.birthDate
                        ? new Date(data.birthDate).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={handleBirthDateChange}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    defaultValue={data?.contactNumber}
                    placeholder="+63..."
                    onChange={(e) =>
                      handleInput("contactNumber", e.target.value)
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Sex</label>
                  <select
                    defaultValue={data?.sex}
                    onChange={(e) => handleInput("sex", e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="section-label" style={{ marginTop: "20px" }}>
                <ShieldCheck size={14} /> Account Status
              </div>
              <div className="input-grid">
                <div className="input-group">
                  <label>Role</label>
                  <select
                    defaultValue={data?.role}
                    onChange={(e) => handleInput("role", e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Store Manager (Admin)</option>
                    <option value="super_admin">
                      System Owner (Super Admin)
                    </option>
                    <option value="checker">Checker</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select
                    defaultValue={data?.status}
                    onChange={(e) => handleInput("status", e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Address Details */}
            <div className="side-panel">
              <div className="section-label">
                <MapPin size={14} /> Location Details
              </div>

              <div className="input-group">
                <label>Street Address</label>
                <input
                  type="text"
                  defaultValue={data?.street}
                  placeholder="123 Main St"
                  onChange={(e) => handleInput("street", e.target.value)}
                />
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label>City</label>
                  <input
                    type="text"
                    defaultValue={data?.city}
                    onChange={(e) => handleInput("city", e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>State / Province</label>
                  <input
                    type="text"
                    defaultValue={data?.state}
                    onChange={(e) => handleInput("state", e.target.value)}
                  />
                </div>
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label>Zip Code</label>
                  <input
                    type="text"
                    defaultValue={data?.zipCode}
                    onChange={(e) => handleInput("zipCode", e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Country</label>
                  <input
                    type="text"
                    defaultValue={data?.country || "United States"}
                    onChange={(e) => handleInput("country", e.target.value)}
                  />
                </div>
              </div>

              <div className="section-label" style={{ marginTop: "20px" }}>
                <Calendar size={14} /> Additional Information
              </div>

              <div className="info-box">
                <p>
                  <strong>Age:</strong>{" "}
                  {data?.age || calculateAge(data?.birthDate) || "Not set"}
                </p>
                <p>
                  <strong>Birth Date:</strong>{" "}
                  {data?.birthDate
                    ? new Date(data.birthDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not set"}
                </p>
                <p>
                  <strong>Last Login:</strong>{" "}
                  {data?.lastLogin
                    ? new Date(data.lastLogin).toLocaleString()
                    : "Never"}
                </p>
                <p>
                  <strong>Joined:</strong>{" "}
                  {data?.createdAt
                    ? new Date(data.createdAt).toLocaleDateString()
                    : "Today"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Discard Changes
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            <Save size={18} />
            <span>{mode === "create" ? "Create" : "Update"} User</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

export default UserModalComponent;
