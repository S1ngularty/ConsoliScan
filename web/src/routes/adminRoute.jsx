import React from "react";
import DashboardPage from "../pages/admin/DashboardPage";
import UserPage from "../pages/admin/UserPage";
import ProductPage from "../pages/admin/ProductPage";

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
    {
      component: <ProductPage></ProductPage>,
      path: "/admin/product",
      index: false,
    },
  ];
}

export default adminRoute;
