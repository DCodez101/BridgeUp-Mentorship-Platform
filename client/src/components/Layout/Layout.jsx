// src/components/Layout/Layout.jsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Loading from '../Common/Loading';

const Layout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;