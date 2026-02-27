import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/auth/AuthPage";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import adminRoute from "./routes/adminRoute.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import UserLayout from "./layouts/UserLayout.jsx";
import UserDashboard from "./pages/user/UserDashboard";
import UserProfile from "./pages/user/UserProfile";
import OrderHistory from "./pages/user/OrderHistory";
import SavedItems from "./pages/user/SavedItems";
import LoyaltyPoints from "./pages/user/LoyaltyPoints";
import HelpSupport from "./pages/user/HelpSupport";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          {adminRoute().map((route) => {
            return (
              <Route
                key={route.path}
                index={route.index}
                path={route.path}
                element={route.component}
              />
            );
          })}
        </Route>

        {/* User Routes */}
        <Route path="/user" element={<UserLayout />}>
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="saved" element={<SavedItems />} />
          <Route path="loyalty" element={<LoyaltyPoints />} />
          <Route path="help" element={<HelpSupport />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
