import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin/SidebarComponent";
import "../styles/layouts/AdminLayoutStyle.css";

function AdminLayout() {  
  return (
    <div className="admin-layout-wrapper">
      <Sidebar />

      <div className="admin-main-container">
        {/* Optional Header to match ConsoliScan theme */}
        <header className="admin-top-nav">
          <div className="breadcrumb">Admin / Dashboard</div>
          <div className="admin-profile">
            <span>Admin User</span>
            <div className="profile-badge">A</div>
          </div>
        </header>

        {/* This is where your page content (Outlet) renders */}
        <main className="admin-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
