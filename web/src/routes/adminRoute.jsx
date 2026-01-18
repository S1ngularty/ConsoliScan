import React from "react";
import DashboardPage from "../pages/admin/DashboardPage";
import UserPage from "../pages/admin/user/UserPage";
import RolePermissions from "../pages/admin/user/RolesPermissions";
import ActivityLogs from "../pages/admin/user/ActivityLogs";
import ProductInventory from "../pages/admin/product/ProductInventory";
import ProductReviews from "../pages/admin/product/ProductReviews"
import ProductPage from "../pages/admin/product/ProductPage"
import CategoryPage from "../pages/admin/category/CategoryPage"

function adminRoute() {
  return [
    {
      component: <DashboardPage></DashboardPage>,
      path: "/admin/dashboard",
      index: true,
    },
    {
      component: <UserPage></UserPage>,
      path: "/admin/users",
      index: false,
    },
    {
      component: <RolePermissions></RolePermissions>,
      path: "/admin/users/roles",
      index: false,
    },
    {
      component: <ActivityLogs></ActivityLogs>,
      path: "/admin/users/activity",
      index: false,
    },
    {
      component: <ProductPage></ProductPage>,
      path: "/admin/products",
      index: false,
    },
    {
      component: <ProductInventory></ProductInventory>,
      path: "/admin/products/inventory",
      index: false,
    },
     {
      component: <ProductReviews></ProductReviews>,
      path: "/admin/products/reviews",
      index: false,
    },
    {
      component: <CategoryPage></CategoryPage>,
      path: "/admin/categories",
      index: false,
    },
  ];
}

export default adminRoute;
