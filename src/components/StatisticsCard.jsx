import React from 'react';

const StatisticsCard = ({ title, value, icon, color }) => (
  <div className="card bg-dark border-secondary mb-3">
    <div className="card-body p-3">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="text-white mb-1">{title}</h6>
          <h3 className={`mb-0 ${color}`} style={{ color: 'rgb(10, 196, 255)' }}>{value}</h3>
        </div>
        <div className={`fs-4`} style={{ color: 'rgb(64, 196, 255)' }}>{icon}</div>
      </div>
    </div>
  </div>
);

export default StatisticsCard;