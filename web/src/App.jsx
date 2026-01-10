import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import adminRoute from "./routes/adminRoute.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage></LoginPage>}></Route>
        <Route path="/admin" element={<AdminLayout></AdminLayout>}>
          {adminRoute().map((route) => {
            return (
              <Route
                index={route.index}
                path={route.path}
                element={route.component}></Route>
            );
          })}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
