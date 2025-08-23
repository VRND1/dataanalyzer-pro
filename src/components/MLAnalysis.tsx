import React, { useState, useEffect } from 'react';
import { DataField } from '@/types/data';
import { MLAnalyzer } from '../utils/analysis/ml/analyzer';

interface MLResults {
  predictions: Record<string, number[]>;
  confidence: number;
  features: string[];
}

interface MLAnalysisProps {
  data: DataField[];
  onAnalysisComplete?: (results: MLResults) => void;
}

export const MLAnalysis: React.FC<MLAnalysisProps> = ({ data, onAnalysisComplete }) => {
  const [results, setResults] = useState<MLResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyzeData = async () => {
      if (!data || data.length === 0) {
        setError('No data provided for analysis');
        return;
      }

      // Validate data format
      const numericFields = data.filter(field => {
        const isValid = field.type === 'number' && 
                       Array.isArray(field.value) && 
                       field.value.length > 0;
        if (!isValid) {
          console.warn(`Invalid field: ${field.name}`, field);
        }
        return isValid;
      });

      if (numericFields.length < 2) {
        setError(`Insufficient numeric data fields (${numericFields.length} found, minimum 2 required)`);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const analyzer = new MLAnalyzer();
        const analysisResults = await analyzer.analyze(numericFields);

        if (!analysisResults) {
          setError('No analysis results generated');
          return;
        }

        const mlResults: MLResults = {
          predictions: analysisResults.predictions || {},
          confidence: analysisResults.confidence || 0,
          features: analysisResults.features || []
        };

        setResults(mlResults);
        if (onAnalysisComplete) {
          onAnalysisComplete(mlResults);
        }
      } catch (err) {
        console.error('ML Analysis error:', err);
        setError(err instanceof Error ? err.message : 'Failed to perform ML analysis');
      } finally {
        setLoading(false);
      }
    };

    analyzeData();
  }, [data, onAnalysisComplete]);

  if (loading) {
    return <div className="p-4">Analyzing data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!results) {
    return <div className="p-4 text-gray-500">No analysis results available</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">ML Analysis Results</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold">Overall Confidence</h3>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${results.confidence * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {Math.round(results.confidence * 100)}% confidence in predictions
        </p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">Key Features</h3>
        <ul className="list-disc list-inside">
          {results.features.map((feature, index) => (
            <li key={index} className="text-sm">{feature}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Predictions</h3>
        {Object.entries(results.predictions).map(([field, values]) => (
          <div key={field} className="mb-4">
            <h4 className="font-medium">{field}</h4>
            <div className="text-sm text-gray-600">
              Next 5 predicted values: {values.slice(-5).join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 