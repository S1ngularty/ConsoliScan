import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import Home from "./pages/Home";
import adminRoute from "./routes/adminRoute.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
