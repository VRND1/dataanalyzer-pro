import { AlertCircle } from 'lucide-react';
import { BusinessMetrics } from '@/components/analysis/categories/business';
import type { DataField } from '@/types/data';

interface InsightListProps {
  insights: string[];
  title?: string;
  data?: {
    fields: DataField[];
  };
}

export default function InsightList({ insights, title = 'Key Insights', data }: InsightListProps) {
  if (!insights.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="text-black-500" />
        <h3 className="text-lg font-semibold text-black-500">{title}</h3>
      </div>
      <ul className="space-y-3">
        {insights.map((insight, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-black-600 mt-1">•</span>
            <span className="text-black-700">{insight}</span>
          </li>
        ))}
      </ul>
      {data && <BusinessMetrics data={data} />}
    </div>
  );
}