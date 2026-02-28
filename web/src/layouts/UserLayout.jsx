import React from "react";
import { Outlet } from "react-router-dom";
import UserNavbar from "../components/user/UserNavbar";
import Chatbot from "../components/common/Chatbot";
import "../styles/layouts/UserLayoutStyle.css";

function UserLayout() {
  return (
    <div className="user-layout-wrapper">
      <div className="user-background-container">
        <div className="user-blob user-blob1"></div>
        <div className="user-blob user-blob2"></div>
        <div className="user-blob user-blob3"></div>
      </div>

      <UserNavbar />

      <main className="user-main-container">
        <div className="user-content-body">
          <Outlet />
        </div>
      </main>

      {/* Floating Chatbot available on all user pages */}
      <Chatbot />
    </div>
  );
}

export default UserLayout;
