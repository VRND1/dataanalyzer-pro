import { Calculator, FileText } from 'lucide-react';
import { DataField } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleHypothesisAnalysis } from '../categories/hypothesis/HypothesisAnalysis';
import { TextAnalysisContainer } from '../categories/text/TextAnalysisContainer';

interface StatisticalAnalysisProps {
  data: {
    fields: DataField[];
  };
}

export function StatisticalAnalysis({ data }: StatisticalAnalysisProps) {
  // Add null checks to prevent filter errors
  const fields = data?.fields || [];
  
  // Debug logging
  console.log('StatisticalAnalysis - All fields:', fields);
  
  const numericFields = Array.isArray(fields) ? fields.filter(f => f.type === 'number') : [];
  const textFields = Array.isArray(fields) ? fields.filter(f => f.type === 'string') : [];
  
  console.log('StatisticalAnalysis - Numeric fields:', numericFields);
  console.log('StatisticalAnalysis - Text fields:', textFields);

  return (
    <div className="space-y-6">
      {/* Text Analysis Section */}
      {textFields.length > 0 && (
        <>
          <div className="bg-blue-600 text-white px-4 py-2 text-lg font-semibold rounded-md flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Text Analysis
          </div>
          <TextAnalysisContainer fields={textFields} />
        </>
      )}

      {/* Statistical Analysis Section */}
      {numericFields.length > 0 && (
        <>
          <div className="bg-blue-600 text-white px-4 py-2 text-lg font-semibold rounded-md flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Statistical Overview
          </div>

          <Card className="border border-gray-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {numericFields.map(field => (
                  <div key={field.name} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">{field.name}</h4>
                    <BasicStats field={field} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <SimpleHypothesisAnalysis fields={numericFields} />
        </>
      )}

      {textFields.length === 0 && numericFields.length === 0 && (
        <div className="text-center text-gray-500 p-6">
          No analyzable fields found. Please ensure your data includes numeric or text fields.
        </div>
      )}
    </div>
  );
}

function BasicStats({ field }: { field: DataField }) {
  const values = field.value as number[];
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-black">Mean:</span>
        <span className="font-medium text-black">{mean.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-black">Standard Deviation:</span>
        <span className="font-medium text-black">{stdDev.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-black">Sample Size:</span>
        <span className="font-medium text-black">{n}</span>
      </div>
    </div>
  );
} 