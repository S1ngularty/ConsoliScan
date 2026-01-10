import React from "react";
import DashboardPage from "../pages/admin/DashboardPage";
import UserPage from "../pages/admin/UserPage";

function adminRoute() {
  return [
    {
      component: <DashboardPage></DashboardPage>,
      path: "/admin/dashboard",
      index: true,
    },
    {
      component: <UserPage></UserPage>,
      path: "/admin/user",
      index: false,
    },
  ];
}

export default adminRoute;
