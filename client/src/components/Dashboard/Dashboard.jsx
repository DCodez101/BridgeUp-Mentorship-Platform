// src/components/Dashboard/Dashboard.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import JuniorDashboard from './JuniorDashboard';
import SeniorDashboard from './SeniorDashboard';

const Dashboard = () => {
  const { user, isSenior, isJunior } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="dashboard-subtitle">
          {isSenior 
            ? "Ready to help junior developers grow their skills?"
            : "Let's find you the perfect mentor and accelerate your learning!"
          }
        </p>
      </div>

      {isSenior && <SeniorDashboard />}
      {isJunior && <JuniorDashboard />}
    </div>
  );
};

export default Dashboard;