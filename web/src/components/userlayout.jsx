import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';

const UserLayout = () => {
  return (
    <div className="user-layout">
      <NavBar />
      <main className="user-content" style={{ minHeight: '80vh' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default UserLayout;
