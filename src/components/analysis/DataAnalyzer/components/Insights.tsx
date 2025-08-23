import React from 'react';
import { Lightbulb } from 'lucide-react';

interface InsightsProps {
  analysis: { insights: string[] };
}

export const Insights: React.FC<InsightsProps> = ({ analysis }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Data Insights</h3>
      </div>

      <div className="space-y-4">
        {analysis.insights.map((insight: string, index: number) => (
          <div key={index} className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}; 