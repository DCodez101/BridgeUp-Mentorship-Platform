// src/components/Layout/Header.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header">
      <div className="flex-between">
        <div>
          <h2>BridgeUp</h2>
          <p className="text-muted">Mentorship Platform</p>
        </div>
        
        <div className="flex" style={{ gap: '15px', alignItems: 'center' }}>
          <div className="text-right">
            <div style={{ fontWeight: '600' }}>{user?.name}</div>
            <div className="text-muted" style={{ fontSize: '12px' }}>
              {user?.role === 'senior' ? 'Mentor' : 'Mentee'}
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="btn btn-outline btn-small"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;