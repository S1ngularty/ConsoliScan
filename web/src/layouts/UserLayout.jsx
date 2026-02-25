import React from "react";
import { Outlet } from "react-router-dom";
import UserSidebar from "../components/user/UserSidebarComponent";
import "../styles/layouts/AdminLayoutStyle.css"; // Reuse admin layout styles for consistency

function UserLayout() {
  const [path, setPath] = React.useState('User / Dashboard');

  return (
    <div className="admin-layout-wrapper"> {/* Reusing wrapper class */}
      <UserSidebar breadcrumb={setPath} />

      <div className="admin-main-container">
        <header className="admin-top-nav">
          <div className="breadcrumb">{path}</div>
          <div className="admin-profile">
            <span>User</span>
            <div className="profile-badge" style={{ backgroundColor: '#DE802B' }}>U</div>
          </div>
        </header>

        <main className="admin-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default UserLayout;
