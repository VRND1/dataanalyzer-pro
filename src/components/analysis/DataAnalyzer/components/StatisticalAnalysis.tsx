import { DataField } from '@/types/data';

interface StatisticalAnalysisProps {
  data: {
    fields: DataField[];
  };
}

export function StatisticalAnalysis({ data }: StatisticalAnalysisProps) {
  return (
    <div className="space-y-4">
      {data.fields.map((field) => (
        <div key={field.name} className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium">{field.name}</h3>
          <p className="text-sm text-gray-500">Type: {field.type}</p>
        </div>
      ))}
    </div>
  );
} 