import React from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  Activity, 
  Settings, 
  BarChart2, 
  Info, 
  Play,
  Download,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Target,
  Layers,
  Zap,
  Timer,
  Award,
  Database
} from 'lucide-react';

// Mock data for demonstration
const mockData = {
  fields: [
    { name: 'Price', type: 'number', value: Array.from({length: 100}, () => Math.random() * 1000 + 500) },
    { name: 'Size', type: 'number', value: Array.from({length: 100}, () => Math.random() * 2000 + 800) },
    { name: 'Bedrooms', type: 'number', value: Array.from({length: 100}, () => Math.floor(Math.random() * 5) + 1) },
    { name: 'Age', type: 'number', value: Array.from({length: 100}, () => Math.random() * 50 + 1) },
    { name: 'Location Score', type: 'number', value: Array.from({length: 100}, () => Math.random() * 10) }
  ]
};

// Enhanced utility functions

function formatNumber(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return 'N/A';
  if (value < 0.01 && value > 0) return value.toExponential(3);
  return value.toFixed(4);
}

// Mock ML training simulation
function simulateMLTraining(_algorithm: string, config: any): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockPredicted = Array.from({length: 20}, () => Math.random() * 1000 + 500);
      const mockActual = Array.from({length: 20}, () => Math.random() * 1000 + 500);
      
      resolve({
        predictions: mockPredicted,
        actuals: mockActual,
        evaluation: {
          r2: Math.random() * 0.3 + 0.7,
          mae: Math.random() * 50 + 25,
          mse: Math.random() * 5000 + 1000,
          rmse: Math.random() * 70 + 30,
          accuracy: Math.random() * 0.2 + 0.8,
          binaryAccuracy: Math.random() * 0.1 + 0.9,
          trainingTime: Math.random() * 3 + 1,
          finalLoss: Math.random() * 0.1 + 0.05,
          epochs: config.epochs,
          learningRate: config.learningRate
        }
      });
    }, 2000);
  });
}

interface UniversalMLAnalysisViewProps {
  data?: {
    fields: Array<{ name: string; type: string; value: number[] }>;
  };
  onAnalysisComplete?: (results: any) => void;
  analysis?: {
    evaluation: {
      r2?: number;
      mae?: number;
      mse?: number;
      rmse?: number;
      accuracy?: number;
      binaryAccuracy?: number;
      trainingTime?: number;
      finalLoss?: number;
      epochs?: number;
      learningRate?: number;
    };
  };
  isRegression?: boolean;
}

export default function UniversalMLAnalysisView({ 
  data = mockData, 
  onAnalysisComplete, 
  analysis, 
  isRegression = true 
}: UniversalMLAnalysisViewProps) {
  const [selectedAlgorithm, setSelectedAlgorithm] = React.useState<'neural' | 'decisionTree' | 'regression'>('neural');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<any>(analysis || null);
  const [showConfig, setShowConfig] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [targetFieldIndex, setTargetFieldIndex] = React.useState<number>(0);
  const [featureFieldIndices, setFeatureFieldIndices] = React.useState<number[]>([1, 2, 3]);

  const [config, setConfig] = React.useState({
    epochs: 50,
    learningRate: 0.001,
    batchSize: 32,
    trainTestSplit: 0.8,
    normalizeData: true,
    validationSplit: 0.2,
    earlyStopping: true,
    patience: 10,
    hiddenLayers: [64, 32],
    dropout: 0.2,
    regularization: 0.001
  });

  const numericFields = data?.fields?.filter(f => f.type === 'number') || [];

  const handleAnalyze = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      if (numericFields.length < 2) {
        throw new Error('ML analysis requires at least 2 numeric fields');
      }

      if (featureFieldIndices.length === 0) {
        throw new Error('Please select at least one feature field');
      }

      const result = await simulateMLTraining(selectedAlgorithm, config);
      setResults(result);
      onAnalysisComplete?.(result);

    } catch (err) {
      console.error('ML Analysis Error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFieldSelection = (fieldIndex: number, isFeature: boolean) => {
    if (isFeature) {
      setFeatureFieldIndices(prev => 
        prev.includes(fieldIndex) 
          ? prev.filter(idx => idx !== fieldIndex)
          : [...prev, fieldIndex]
      );
    } else {
      setTargetFieldIndex(fieldIndex);
    }
  };

  const getAlgorithmInfo = (algo: string) => {
    const info = {
      neural: { 
        name: 'Neural Network', 
        desc: 'Deep learning with multiple layers',
        complexity: 'High',
        color: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      regression: { 
        name: 'Linear Regression', 
        desc: 'Simple linear relationship modeling',
        complexity: 'Low',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      decisionTree: { 
        name: 'Decision Tree', 
        desc: 'Rule-based decision making',
        complexity: 'Medium',
        color: 'bg-green-100 text-green-800 border-green-200'
      }
    };
    return info[algo as keyof typeof info];
  };

  // Display mode for showing existing analysis results
  if (!data && analysis) {
    return <MLAnalysisDisplay analysis={analysis} isRegression={isRegression} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Universal ML Analysis
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advanced machine learning analysis with real-time visualization and comprehensive model evaluation
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-sm">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{numericFields.length}</div>
                <div className="text-sm text-gray-500">Numeric Fields</div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-sm">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">1</div>
                <div className="text-sm text-gray-500">Target Field</div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-sm">
            <div className="flex items-center gap-3">
              <Layers className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{featureFieldIndices.length}</div>
                <div className="text-sm text-gray-500">Feature Fields</div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-sm">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{results?.evaluation?.r2 ? formatNumber(results.evaluation.r2) : '--'}</div>
                <div className="text-sm text-gray-500">R² Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">ML Configuration</h3>
                  <p className="text-sm text-gray-500">Configure your machine learning model parameters</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-200"
              >
                {showConfig ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showConfig ? 'Hide Config' : 'Show Config'}
              </button>
            </div>
          </div>

          {showConfig && (
            <div className="p-6 space-y-8">
              {/* Field Selection */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Field Selection
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Target Field (What to predict)</label>
                    <div className="space-y-2">
                      {numericFields.map((field, idx) => (
                        <label key={idx} className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            name="target"
                            value={idx}
                            checked={targetFieldIndex === idx}
                            onChange={() => setTargetFieldIndex(idx)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900">{field.name}</div>
                            <div className="text-xs text-gray-500">Sample: {formatNumber(field.value[0])}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Feature Fields (Input variables)</label>
                    <div className="space-y-2">
                      {numericFields.map((field, idx) => (
                        <label key={idx} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          idx === targetFieldIndex 
                            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <input
                            type="checkbox"
                            value={idx}
                            checked={featureFieldIndices.includes(idx)}
                            disabled={idx === targetFieldIndex}
                            onChange={() => handleFieldSelection(idx, true)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                          />
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900">{field.name}</div>
                            <div className="text-xs text-gray-500">Sample: {formatNumber(field.value[0])}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selection Summary */}
                {featureFieldIndices.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="text-sm font-medium text-blue-800 mb-2">Selection Summary:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="text-blue-700">
                        <span className="font-medium">Target:</span> {numericFields[targetFieldIndex]?.name}
                      </div>
                      <div className="text-blue-700">
                        <span className="font-medium">Features:</span> {featureFieldIndices.map(idx => numericFields[idx]?.name).join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Algorithm Selection */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  Algorithm Selection
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['neural', 'regression', 'decisionTree'] as const).map((algo) => {
                    const algoInfo = getAlgorithmInfo(algo);
                    return (
                      <label key={algo} className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedAlgorithm === algo 
                          ? 'border-purple-300 bg-purple-50 shadow-lg' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="algorithm"
                          value={algo}
                          checked={selectedAlgorithm === algo}
                          onChange={(e) => setSelectedAlgorithm(e.target.value as any)}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900 mb-2">{algoInfo.name}</div>
                          <div className="text-sm text-gray-600 mb-3">{algoInfo.desc}</div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${algoInfo.color}`}>
                            {algoInfo.complexity} Complexity
                          </span>
                        </div>
                        {selectedAlgorithm === algo && (
                          <div className="absolute top-2 right-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Basic Parameters */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-orange-500" />
                  Training Parameters
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>Epochs</span>
                        <span className="text-purple-600 font-mono">{config.epochs}</span>
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        step="10"
                        value={config.epochs}
                        onChange={(e) => setConfig({...config, epochs: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>10</span>
                        <span>200</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>Learning Rate</span>
                        <span className="text-purple-600 font-mono">{config.learningRate}</span>
                      </label>
                      <input
                        type="range"
                        min="0.0001"
                        max="0.01"
                        step="0.0001"
                        value={config.learningRate}
                        onChange={(e) => setConfig({...config, learningRate: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0.0001</span>
                        <span>0.01</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>Train/Test Split</span>
                        <span className="text-purple-600 font-mono">{Math.round(config.trainTestSplit * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        min="0.6"
                        max="0.9"
                        step="0.05"
                        value={config.trainTestSplit}
                        onChange={(e) => setConfig({...config, trainTestSplit: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>60%</span>
                        <span>90%</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>Batch Size</span>
                        <span className="text-purple-600 font-mono">{config.batchSize}</span>
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="128"
                        step="8"
                        value={config.batchSize}
                        onChange={(e) => setConfig({...config, batchSize: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>8</span>
                        <span>128</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Advanced Settings
                </button>

                {showAdvanced && (
                  <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.normalizeData}
                          onChange={(e) => setConfig({...config, normalizeData: e.target.checked})}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Normalize Data</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.earlyStopping}
                          onChange={(e) => setConfig({...config, earlyStopping: e.target.checked})}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Early Stopping</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Validation Split: {config.validationSplit}
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="0.3"
                          step="0.05"
                          value={config.validationSplit}
                          onChange={(e) => setConfig({...config, validationSplit: parseFloat(e.target.value)})}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dropout: {config.dropout}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="0.5"
                          step="0.1"
                          value={config.dropout}
                          onChange={(e) => setConfig({...config, dropout: parseFloat(e.target.value)})}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Regularization: {config.regularization}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="0.01"
                          step="0.001"
                          value={config.regularization}
                          onChange={(e) => setConfig({...config, regularization: parseFloat(e.target.value)})}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={handleAnalyze}
            disabled={isProcessing || numericFields.length === 0 || featureFieldIndices.length === 0}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-3">
              {isProcessing ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Training Model...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Run ML Analysis</span>
                </>
              )}
            </div>
            {!isProcessing && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">Model Performance Metrics</h4>
                    <p className="text-sm text-gray-600">Comprehensive evaluation of your trained model</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <MetricCard 
                    title="R² Score" 
                    value={formatNumber(results.evaluation.r2)} 
                    icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
                    description="Coefficient of determination (0-1, higher is better)"
                    trend={results.evaluation.r2 > 0.8 ? 'excellent' : results.evaluation.r2 > 0.6 ? 'good' : 'needs-improvement'}
                  />
                  <MetricCard 
                    title="MAE" 
                    value={formatNumber(results.evaluation.mae)} 
                    icon={<Activity className="w-5 h-5 text-purple-500" />}
                    description="Mean Absolute Error (lower is better)"
                    trend={results.evaluation.mae < 50 ? 'excellent' : results.evaluation.mae < 100 ? 'good' : 'needs-improvement'}
                  />
                  <MetricCard 
                    title="RMSE" 
                    value={formatNumber(results.evaluation.rmse)} 
                    icon={<BarChart2 className="w-5 h-5 text-green-500" />}
                    description="Root Mean Square Error (lower is better)"
                    trend={results.evaluation.rmse < 70 ? 'excellent' : results.evaluation.rmse < 140 ? 'good' : 'needs-improvement'}
                  />
                  <MetricCard 
                    title="Training Time" 
                    value={`${formatNumber(results.evaluation.trainingTime)}s`} 
                    icon={<Timer className="w-5 h-5 text-orange-500" />}
                    description="Time taken to train the model"
                    trend={results.evaluation.trainingTime < 2 ? 'excellent' : results.evaluation.trainingTime < 5 ? 'good' : 'needs-improvement'}
                  />
                  <MetricCard 
                    title="Final Loss" 
                    value={formatNumber(results.evaluation.finalLoss)} 
                    icon={<AlertCircle className="w-5 h-5 text-red-500" />}
                    description="Final training loss value"
                    trend={results.evaluation.finalLoss < 0.1 ? 'excellent' : results.evaluation.finalLoss < 0.2 ? 'good' : 'needs-improvement'}
                  />
                  <MetricCard 
                    title="Accuracy (±5%)" 
                    value={formatNumber(results.evaluation.accuracy)} 
                    icon={<Target className="w-5 h-5 text-indigo-500" />}
                    description="Predictions within 5% tolerance"
                    trend={results.evaluation.accuracy > 0.9 ? 'excellent' : results.evaluation.accuracy > 0.7 ? 'good' : 'needs-improvement'}
                  />
                </div>

                {/* Training Summary */}
                <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                  <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Training Summary
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Algorithm:</span>
                      <div className="font-medium text-gray-900 capitalize">{selectedAlgorithm}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Epochs:</span>
                      <div className="font-medium text-gray-900">{results.evaluation.epochs}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Learning Rate:</span>
                      <div className="font-medium text-gray-900">{results.evaluation.learningRate}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Samples:</span>
                      <div className="font-medium text-gray-900">{results.predictions.length}</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium">
                    <Download className="w-4 h-4" />
                    Export Results
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium">
                    <BarChart2 className="w-4 h-4" />
                    View Predictions
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium">
                    <Brain className="w-4 h-4" />
                    Model Details
                  </button>
                </div>
              </div>
            </div>

            {/* Visualization Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart2 className="w-6 h-6 text-purple-500" />
                  Prediction Visualization
                </h4>
                <p className="text-sm text-gray-600 mt-1">Visual comparison of actual vs predicted values</p>
              </div>
              <div className="p-6">
                <PredictionChart predictions={results.predictions} actuals={results.actuals} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .slider::-webkit-slider-track {
          height: 8px;
          cursor: pointer;
          background: linear-gradient(90deg, #e5e7eb, #d1d5db);
          border-radius: 4px;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-track {
          height: 8px;
          cursor: pointer;
          background: linear-gradient(90deg, #e5e7eb, #d1d5db);
          border-radius: 4px;
          border: none;
        }
      `
      }} />
    </div>
  );
}

// Enhanced Metric Card Component
function MetricCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend = 'neutral'
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  description?: string;
  trend?: 'excellent' | 'good' | 'needs-improvement' | 'neutral';
}) {
  const getTrendColor = () => {
    switch (trend) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'needs-improvement': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'needs-improvement': return 'Needs Improvement';
      default: return '';
    }
  };

  return (
    <div className="group relative bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h5 className="text-sm font-semibold text-gray-700">{title}</h5>
        </div>
        {trend !== 'neutral' && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTrendColor()}`}>
            {getTrendLabel()}
          </span>
        )}
      </div>
      
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      )}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

// Simple Prediction Chart Component
function PredictionChart({ predictions, actuals }: { predictions: number[]; actuals: number[] }) {
  const chartData = predictions.map((pred, idx) => ({
    index: idx,
    predicted: pred,
    actual: actuals[idx]
  }));

  const maxValue = Math.max(...predictions, ...actuals);
  const minValue = Math.min(...predictions, ...actuals);

  return (
    <div className="space-y-4">
      <div className="h-64 w-full bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center relative overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 400 200" className="absolute inset-0">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line 
              key={i} 
              x1="0" 
              y1={40 + i * 30} 
              x2="400" 
              y2={40 + i * 30} 
              stroke="#e5e7eb" 
              strokeWidth="1"
            />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <line 
              key={i} 
              x1={40 + i * 32} 
              y1="0" 
              x2={40 + i * 32} 
              y2="200" 
              stroke="#e5e7eb" 
              strokeWidth="1"
            />
          ))}
          
          {/* Data points */}
          {chartData.slice(0, 10).map((point, idx) => {
            const x = 40 + idx * 32;
            const yPred = 180 - ((point.predicted - minValue) / (maxValue - minValue)) * 140;
            const yActual = 180 - ((point.actual - minValue) / (maxValue - minValue)) * 140;
            
            return (
              <g key={idx}>
                {/* Predicted */}
                <circle cx={x} cy={yPred} r="4" fill="#3b82f6" opacity="0.8" />
                {/* Actual */}
                <circle cx={x} cy={yActual} r="4" fill="#ef4444" opacity="0.8" />
                {/* Connection line */}
                <line x1={x} y1={yPred} x2={x} y2={yActual} stroke="#9ca3af" strokeWidth="1" strokeDasharray="2,2" />
              </g>
            );
          })}
        </svg>
        
        <div className="absolute top-4 right-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Predicted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Actual</span>
          </div>
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-600">
        Sample of predictions vs actual values (first 10 data points)
      </div>
    </div>
  );
}

// Display-only component for showing ML analysis results
const MLAnalysisDisplay: React.FC<{ analysis: any; isRegression: boolean }> = ({ analysis, isRegression }) => {
  const modeLabel = isRegression ? 'Regression Analysis' : 'Classification Analysis';
  const modeColor = isRegression ? 'text-blue-500' : 'text-green-500';

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Info className={`w-6 h-6 ${modeColor}`} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{modeLabel}</h3>
            <p className="text-sm text-gray-500">Analysis results</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard 
          title="R² Score" 
          value={formatNumber(analysis.evaluation.r2 || 0)} 
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
        />
        <MetricCard 
          title="MAE" 
          value={formatNumber(analysis.evaluation.mae || 0)} 
          icon={<Activity className="w-5 h-5 text-purple-500" />}
        />
        <MetricCard 
          title="Training Time" 
          value={`${formatNumber(analysis.evaluation.trainingTime || 0)}s`} 
          icon={<Timer className="w-5 h-5 text-orange-500" />}
        />
      </div>
    </div>
  );
};