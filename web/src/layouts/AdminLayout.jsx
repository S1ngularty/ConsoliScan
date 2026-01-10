import React from "react";
import { Outlet } from "react-router-dom";
import DashboardPage from "../pages/admin/DashboardPage";
import UserPage from "../pages/admin/UserPage";

function AdminLayout() {
  return (
    <div>
      <div> admin layout</div>
      <div className="main">
        <Outlet></Outlet>
      </div>
    </div>
  );
}

export default AdminLayout;
