import React from "react";
import DashboardPage from "../pages/admin/DashboardPage";
import AnalyticsPage from "../pages/admin/AnalyticsPage";
import ReportPage from "../pages/admin/ReportPage";
import OrderPage from "../pages/admin/OrderPage";
import UserPage from "../pages/admin/user/UserPage";
import RolePermissions from "../pages/admin/user/RolesPermissions";
import ActivityLogs from "../pages/admin/user/ActivityLogs";
import ProductInventory from "../pages/admin/product/ProductInventory";
import ProductPage from "../pages/admin/product/ProductPage";
import CategoryPage from "../pages/admin/category/CategoryPage";
import BeneficiaryManagement from "../pages/admin/user/UserBeneficiaryPage";
import PromoListPage from "../pages/admin/discount/PromoPage";
import LoyaltyConfigPage from "../pages/admin/discount/LoyaltyConfigPage";
import SettingsPage from "../pages/admin/SettingsPage";
import CustomerInsightsPage from "../pages/admin/CustomerInsightsPage";
import StaffPerformancePage from "../pages/admin/StaffPerformancePage";
import FinancialReportsPage from "../pages/admin/FinancialReportsPage";
import PredictiveAnalyticsPage from "../pages/admin/PredictiveAnalyticsPage";
import ExpenseManagementPage from "../pages/admin/ExpenseManagementPage";
import SupplierManagementPage from "../pages/admin/SupplierManagementPage";
import InventoryPage from "../pages/admin/InventoryPage";
import BulkOperationsPage from "../pages/admin/BulkOperationsPage";
import ProductPerformancePage from "../pages/admin/ProductPerformancePage";

function adminRoute() {
  return [
    {
      component: <DashboardPage></DashboardPage>,
      path: "/admin/dashboard",
      index: true,
    },
    {
      component: <AnalyticsPage></AnalyticsPage>,
      path: "/admin/analytics",
      index: false,
    },
    {
      component: <ReportPage></ReportPage>,
      path: "/admin/reports",
      index: false,
    },
    {
      component: <OrderPage></OrderPage>,
      path: "/admin/orders",
      index: false,
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
    {
      component: <SettingsPage></SettingsPage>,
      path: "/admin/settings",
      index: false,
    },
    {
      component: <CustomerInsightsPage></CustomerInsightsPage>,
      path: "/admin/analytics/customer-insights",
      index: false,
    },
    {
      component: <StaffPerformancePage></StaffPerformancePage>,
      path: "/admin/analytics/staff-performance",
      index: false,
    },
    {
      component: <FinancialReportsPage></FinancialReportsPage>,
      path: "/admin/reports/financial",
      index: false,
    },
    {
      component: <PredictiveAnalyticsPage></PredictiveAnalyticsPage>,
      path: "/admin/analytics/predictive",
      index: false,
    },
    {
      component: <ProductPerformancePage></ProductPerformancePage>,
      path: "/admin/reports/product-performance",
      index: false,
    },
    {
      component: <ExpenseManagementPage></ExpenseManagementPage>,
      path: "/admin/expenses",
      index: false,
    },
    {
      component: <SupplierManagementPage></SupplierManagementPage>,
      path: "/admin/suppliers",
      index: false,
    },
    {
      component: <InventoryPage></InventoryPage>,
      path: "/admin/inventory",
      index: false,
    },
    {
      component: <BulkOperationsPage></BulkOperationsPage>,
      path: "/admin/bulk-operations",
      index: false,
    },
  ];
}

export default adminRoute;
