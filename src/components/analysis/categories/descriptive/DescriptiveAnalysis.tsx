import { Calculator, BarChart2 } from 'lucide-react';
import { DataField } from '@/types/data';
import { StatisticalSummary } from '../../AnalysisSection/components/StatisticalSummary';
import { ChartView } from '../../../visualization';

interface DescriptiveAnalysisProps {
  data: {
    fields: DataField[];
  };
  analysis?: any;
}

export function DescriptiveAnalysis({ data }: DescriptiveAnalysisProps) {
  const numericFields = Array.isArray(data?.fields) ? data.fields.filter(f => f.type === 'number') : [];

  if (numericFields.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg inline-block">
          <p className="font-medium">No numeric data available for descriptive analysis</p>
          <p className="text-sm mt-1">Please upload data containing numeric columns to perform statistical analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-6 h-6 text-teal-600" />
        <h2 className="text-xl font-semibold text-gray-900">Descriptive Statistics</h2>
      </div>
      {/* Statistical Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Statistical Summary</h3>
        </div>
        <StatisticalSummary data={data} results={null} />
      </div>
      {/* Data Visualization */}
      {numericFields.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Data Visualization</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartView data={data.fields} type="bar" title="Distribution" />
            <ChartView data={data.fields} type="line" title="Trends" />
          </div>
        </div>
      )}
    </div>
  );
} 