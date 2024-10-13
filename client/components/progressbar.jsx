// components/ProgressBar.js
import React from 'react';

const ProgressBar = ({ label, value }) => {
  return (
    <div className="my-4">
      <div className="text-sm font-semibold mb-1">{label}: {value}%</div>
      <div className="w-full bg-gray-200 rounded-lg h-5">
        <div
          className="bg-green-500 h-full rounded-lg text-white text-xs flex items-center justify-center"
          style={{ width: `${value}%` }}
        >
          {value}%
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
