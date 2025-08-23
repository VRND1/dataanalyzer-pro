import React from 'react';
import { Brain, TrendingUp, Settings2 } from 'lucide-react';
import { DataField } from '@/types/data';
import { AISimulationView } from './AISimulationView';
import { ScenarioSimulation } from './ScenarioSimulation';

interface SimulationPageProps {
  data: {
    fields: DataField[];
  };
}

export function SimulationPage({ data }: SimulationPageProps) {
  const [activeTab, setActiveTab] = React.useState<'ai' | 'scenario'>('ai');
  const [simulationConfig, setSimulationConfig] = React.useState({
    iterations: 1000,
    timeHorizon: 12,
    confidenceLevel: 0.95,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Data Simulation</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'ai'
                ? 'bg-teal-100 text-teal-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Brain className="w-5 h-5" />
            AI Simulation
          </button>
          <button
            onClick={() => setActiveTab('scenario')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'scenario'
                ? 'bg-teal-100 text-teal-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Scenario Simulation
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Simulation Configuration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Iterations
            </label>
            <input
              type="number"
              value={simulationConfig.iterations}
              onChange={(e) =>
                setSimulationConfig({
                  ...simulationConfig,
                  iterations: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border rounded-lg"
              min="100"
              max="10000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Horizon (months)
            </label>
            <input
              type="number"
              value={simulationConfig.timeHorizon}
              onChange={(e) =>
                setSimulationConfig({
                  ...simulationConfig,
                  timeHorizon: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
              max="60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confidence Level
            </label>
            <input
              type="number"
              value={simulationConfig.confidenceLevel}
              onChange={(e) =>
                setSimulationConfig({
                  ...simulationConfig,
                  confidenceLevel: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 border rounded-lg"
              min="0.5"
              max="0.99"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Simulation Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {activeTab === 'ai' ? (
          <AISimulationView data={data} config={simulationConfig} />
        ) : (
          <ScenarioSimulation data={data} config={simulationConfig} />
        )}
      </div>
    </div>
  );
} 