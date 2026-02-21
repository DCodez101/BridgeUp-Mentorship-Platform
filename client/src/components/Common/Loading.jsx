// src/components/Common/Loading.jsx
import React from 'react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="loading">
      <div>{message}</div>
    </div>
  );
};

export default Loading;