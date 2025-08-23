import { FileText, AlertCircle } from 'lucide-react';
import { DataField } from '@/types/data';
import { inferAnalysisTypes } from '../../utils/analysis/dataTypeInference';

interface DataSummaryProps {
  fields: DataField[];
}

export default function DataSummary({ fields }: DataSummaryProps) {
  const analysisTypes = inferAnalysisTypes(fields);
  const numericFields = Array.isArray(fields) ? fields.filter(f => f.type === 'number') : [];
  const textFields = Array.isArray(fields) ? fields.filter(f => f.type === 'string') : [];
  const dateFields = Array.isArray(fields) ? fields.filter(f => f.type === 'date') : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="text-indigo-600" />
        <h3 className="text-lg font-semibold text-black-500">Data Overview</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-sm text-black-500">Numeric Fields</p>
          <p className="text-2xl font-semibold text-black-500">{numericFields.length}</p>
        </div>
        <div>
          <p className="text-sm text-black-500">Text Fields</p>
          <p className="text-2xl font-semibold text-black-500">{textFields.length}</p>
        </div>
        <div>
          <p className="text-sm text-black-500">Date Fields</p>
          <p className="text-2xl font-semibold text-black-500">{dateFields.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-black-700">Available Analyses</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(analysisTypes).map(([type, available]) => (
            <div
              key={type}
              className={`flex items-center gap-2 p-2 rounded ${
                available ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-black-500'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                {type.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}