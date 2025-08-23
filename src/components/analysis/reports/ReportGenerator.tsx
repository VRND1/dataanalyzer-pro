import React from 'react';

interface ReportGeneratorProps {
  onGenerate?: () => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onGenerate }) => {
  return (
    <div className="report-generator">
      <h2>Report Generator</h2>
      <button onClick={onGenerate}>Generate Report</button>
    </div>
  );
}; 