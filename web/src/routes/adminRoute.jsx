import React from "react";
import DashboardPage from "../pages/admin/DashboardPage";
import UserPage from "../pages/admin/user/UserPage";
import RolePermissions from "../pages/admin/user/RolesPermissions";
import ActivityLogs from "../pages/admin/user/ActivityLogs";
import ProductInventory from "../pages/admin/product/ProductInventory";
import ProductPage from "../pages/admin/product/ProductPage"
import CategoryPage from "../pages/admin/category/CategoryPage"
import BeneficiaryManagement from "../pages/admin/user/UserBeneficiaryPage";
import PromoListPage from "../pages/admin/discount/PromoPage";
import LoyaltyConfigPage from "../pages/admin/discount/LoyaltyConfigPage";

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
      component: <BeneficiaryManagement></BeneficiaryManagement>,
      path: "/admin/users/beneficiary",
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
      component: <CategoryPage></CategoryPage>,
      path: "/admin/categories",
      index: false,
    },
    {
      component: <PromoListPage></PromoListPage>,
      path: "/admin/discount/promo",
      index: false,
    },
     {
      component: <LoyaltyConfigPage></LoyaltyConfigPage>,
      path: "/admin/discount/loyalty",
      index: false,
    },
  ];
}

export default adminRoute;
