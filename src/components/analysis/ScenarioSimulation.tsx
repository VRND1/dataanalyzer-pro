import React from 'react';
import { AlertCircle, Target } from 'lucide-react';
import { DataField } from '@/types/data';
import { SimulationEngine } from '@/utils/analysis/simulation/engine';
import { formatNumber } from '@/utils/analysis/formatting';
import { SimulationResult, SimulationScenario, SensitivityAnalysis } from '@/utils/analysis/simulation/types';

interface ScenarioSimulationProps {
  data: {
    fields: DataField[];
  };
  config: {
    iterations: number;
    timeHorizon: number;
    confidenceLevel: number;
  };
}

export function ScenarioSimulation({ data, config }: ScenarioSimulationProps) {
  const [results, setResults] = React.useState<SimulationResult[]>([]);
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

      // Create and run simulation engine
      const engine = new SimulationEngine(data.fields);
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
          <p className="text-gray-600">Running scenario simulation...</p>
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
              <div key={index} className="space-y-6">
                {/* Scenarios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {result.scenarios.map((scenario: SimulationScenario, i: number) => (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border ${
                        scenario.name === 'Best Case'
                          ? 'border-green-200 bg-green-50'
                          : scenario.name === 'Worst Case'
                          ? 'border-red-200 bg-red-50'
                          : 'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{scenario.name}</h4>
                        <span className="text-sm font-medium">
                          {(scenario.probability * 100).toFixed()}% probability
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                      <div className="space-y-1">
                        {Object.entries(scenario.adjustments).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-600">{key}:</span>
                            <span
                              className={`font-medium ${
                                value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}
                            >
                              {value > 0 ? '+' : ''}
                              {value}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sensitivity Analysis */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Sensitivity Analysis</h3>
                  <div className="space-y-4">
                    {result.sensitivity.map((sensitivity: SensitivityAnalysis, i: number) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-teal-600" />
                            <span className="font-medium">{sensitivity.variable}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            Elasticity: {formatNumber(sensitivity.elasticity)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {sensitivity.variations.map((variation, j) => (
                            <div key={j} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {variation.percentage}% {variation.direction}
                              </span>
                              <span
                                className={`font-medium ${
                                  variation.impact > 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {variation.impact > 0 ? '+' : ''}
                                {formatNumber(variation.impact)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Best Case</h4>
                      <p className="text-lg font-semibold">
                        {formatNumber(result.summary.bestCase)}%
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Base Case</h4>
                      <p className="text-lg font-semibold">
                        {formatNumber(result.summary.baseCase)}%
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Worst Case</h4>
                      <p className="text-lg font-semibold">
                        {formatNumber(result.summary.worstCase)}%
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Range</h4>
                      <p className="text-lg font-semibold">
                        {formatNumber(result.summary.range)}%
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Confidence</h4>
                      <p className="text-lg font-semibold">
                        {(result.summary.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}