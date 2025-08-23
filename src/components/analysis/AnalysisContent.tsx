import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAnalysisData } from '@/utils/storage/db';
//import { AnalysisCategories } from './AnalysisCategories';
import { DescriptiveAnalysis } from './categories/descriptive/DescriptiveAnalysis';
import LoadingSpinner from '../common/LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import { AnalysisSection } from './AnalysisSection';

interface AnalysisContentProps {
  data?: {
    fields: any[];
  };
}

export function AnalysisContent({ data: propData }: AnalysisContentProps) {
  const [data, setData] = React.useState(propData);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(!propData);
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');

  // Debug log to verify category value
  console.log('category:', category);

  React.useEffect(() => {
    if (!propData) {
      const loadData = async () => {
        try {
          setIsLoading(true);
          const analysisData = await getAnalysisData();
          if (!analysisData) {
            setError(new Error('No analysis data found'));
            return;
          }
          setData(analysisData.content);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to load analysis data'));
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [propData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="font-medium">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No data available for analysis</p>
      </div>
    );
  }

  // If category is specified, render only that category's content
  if (category === 'descriptive') {
    return (
      <div className="w-full">
        <DescriptiveAnalysis data={data} />
      </div>
    );
  }

  // For all other categories, render the general AnalysisSection
  return (
    <div className="w-full">
      <AnalysisSection data={data} fileData={undefined} category={category} results={null} />
    </div>
  );
} 