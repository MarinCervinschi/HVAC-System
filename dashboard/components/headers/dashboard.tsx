import React from "react";

const DashboardHeader: React.FC = () => (
  <div className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-8">
    <div className="flex items-center gap-2">
      <h1 className="text-xl font-semibold">Dashboard Data Center</h1>
    </div>
  </div>
);

export default DashboardHeader;