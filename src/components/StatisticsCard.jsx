import React from "react";

const StatisticsCard = ({ title, value, icon, color }) => (
  <div className="card border-secondary mb-3" style={{ background: "#1a1b26" }}>
    <div className="card-body p-3">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <p className="h6 text-white">{title}</p>
          <h5
            className={`mb-0 ${color}`}
            style={{ color: "rgb(10, 196, 255)" }}
          >
            {value}
          </h5>
        </div>
        <div className={`fs-4`} style={{ color: "rgb(64, 196, 255)" }}>
          {icon}
        </div>
      </div>
    </div>
  </div>
);

export default StatisticsCard;
