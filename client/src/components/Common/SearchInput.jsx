// src/components/Common/SearchInput.jsx
import React from 'react';

const SearchInput = ({ value, onChange, placeholder, className = '' }) => {
  return (
    <input
      type="text"
      className={`form-input ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default SearchInput;