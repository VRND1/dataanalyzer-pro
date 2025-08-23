import { FileText, Database, Hash, AlignLeft } from 'lucide-react';
import { DataField } from '../../types';
import { StatCard } from '../ui/StatCard';

interface OverviewProps {
  data: {
    fields: DataField[];
  };
}

export function Overview({ data }: OverviewProps) {
  // Add null checks to prevent filter errors
  const fields = data?.fields || [];
  const numericFields = Array.isArray(fields) ? fields.filter(f => f.type === 'number') : [];
  const textFields = Array.isArray(fields) ? fields.filter(f => f.type === 'string') : [];
  const dateFields = Array.isArray(fields) ? fields.filter(f => f.type === 'date') : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold text-black-500 mb-4">Data Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Fields"
          value={fields.length}
          icon={<Database className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="Numeric Fields"
          value={numericFields.length}
          icon={<Hash className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          title="Text Fields"
          value={textFields.length}
          icon={<AlignLeft className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Date Fields"
          value={dateFields.length}
          icon={<FileText className="w-5 h-5 text-purple-600" />}
        />
      </div>
    </div>
  );
}