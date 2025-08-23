import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="glass-effect p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-medium text-black-300">{title}</h3>
      </div>
      <p className="text-2xl font-semibold text-black-500">{value}</p>
    </div>
  );
}