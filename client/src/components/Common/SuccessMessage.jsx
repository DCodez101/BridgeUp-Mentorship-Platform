// src/components/Common/SuccessMessage.jsx
import React from 'react';

const SuccessMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="success-message">
      <div className="flex-between">
        <span>{message}</span>
        {onClose && (
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'inherit', 
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessMessage;