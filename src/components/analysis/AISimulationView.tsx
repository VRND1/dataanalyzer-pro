import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { DataField } from '@/types/data';
import { AISimulationEngine } from '@/utils/analysis/ai/simulation';
import { formatNumber } from '@/utils/analysis/formatting';

interface AISimulationViewProps {
  data: {
    fields: DataField[];
  };
  config: {
    iterations: number;
    timeHorizon: number;
    confidenceLevel: number;
  };
}

export function AISimulationView({ data, config }: AISimulationViewProps) {
  const [results, setResults] = React.useState<any[]>([]);
  const [isSimulating, setIsSimulating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedField, setSelectedField] = React.useState<string | null>(null);

  const handleRunSimulation = async () => {
    try {
      setIsSimulating(true);
      setError(null);

      // Validate data
      if (!data.fields?.length) {
        throw new Error('No data available for simulation');
      }

      const numericFields = data.fields.filter(f => f.type === 'number');
      if (numericFields.length === 0) {
        throw new Error('Simulation requires numeric fields');
      }

      // Create engine with config
      const engine = new AISimulationEngine(data.fields, {
        iterations: config.iterations,
        timeHorizon: config.timeHorizon,
        confidenceLevel: config.confidenceLevel,
      });

      const simulationResults = await engine.runSimulation();
      setResults(simulationResults);
      
      // Auto-select first field if none selected
      if (!selectedField && simulationResults.length > 0) {
        setSelectedField(simulationResults[0].field);
      }

    } catch (error) {
      console.error('Simulation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to run simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  React.useEffect(() => {
    handleRunSimulation();
  }, [config]);

  if (isSimulating) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4" />
          <p className="text-gray-600">Running AI simulation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="p-6 text-center text-gray-600">
        <p>No simulation results available. Please check your data and try again.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Field Selection */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {results.map((result) => (
          <button
            key={result.field}
            onClick={() => setSelectedField(result.field)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedField === result.field
                ? 'bg-teal-100 text-teal-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {result.field}
          </button>
        ))}
      </div>

      {/* Results Display */}
      {selectedField && (
        <div className="space-y-6">
          {results
            .filter((r) => r.field === selectedField)
            .map((result, index) => (
              <div key={index} className="space-y-4">
                {/* Predictions Chart */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Predictions</h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: Array.from(
                          { length: result.predictions.length },
                          (_, i) => `Month ${i + 1}`
                        ),
                        datasets: [
                          {
                            label: 'Predicted',
                            data: result.predictions,
                            borderColor: 'rgb(20, 184, 166)',
                            tension: 0.1,
                          },
                          {
                            label: 'Upper Bound',
                            data: result.confidence.upper,
                            borderColor: 'rgba(20, 184, 166, 0.2)',
                            borderDash: [5, 5],
                            fill: false,
                          },
                          {
                            label: 'Lower Bound',
                            data: result.confidence.lower,
                            borderColor: 'rgba(20, 184, 166, 0.2)',
                            borderDash: [5, 5],
                            fill: false,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-600 mb-1">Accuracy</h4>
                    <p className="text-2xl font-semibold">
                      {(result.metrics.accuracy * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-600 mb-1">RMSE</h4>
                    <p className="text-2xl font-semibold">
                      {formatNumber(result.metrics.rmse)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-600 mb-1">MAE</h4>
                    <p className="text-2xl font-semibold">
                      {formatNumber(result.metrics.mae)}
                    </p>
                  </div>
                </div>

                {/* Insights */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Insights</h3>
                  <ul className="space-y-2">
                    {result.insights.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <TrendingUp className="w-5 h-5 text-teal-600 mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}