import React from 'react';
import { Upload, Play, Pause, BarChart2, RefreshCw, AlertCircle, Brain, FolderOpen } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Link } from 'react-router-dom';

interface CustomModelViewProps {
  workspaceId?: string;
}

// Workspace selector component
function WorkspaceSelector() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center">
          <FolderOpen className="w-8 h-8 text-teal-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Select a Workspace</h3>
        <p className="text-gray-600 max-w-md">
          You need to select a workspace before you can upload and manage custom AI models.
        </p>
        <Link 
          to="/workspaces" 
          className="mt-4 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Go to Workspaces
        </Link>
      </div>
    </div>
  );
}

export function CustomModelView({ workspaceId }: CustomModelViewProps) {
  const [models, setModels] = React.useState<any[]>([]);
  const [selectedModel, setSelectedModel] = React.useState<any>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function init() {
      try {
        // Initialize with sample data since we don't have a real backend yet
        setModels([
          {
            id: '1',
            name: 'Sales Prediction Model',
            description: 'Predicts future sales based on historical data',
            framework: 'TensorFlow',
            modelType: 'regression',
            created_at: new Date().toISOString(),
            metrics: {
              accuracy: 0.92,
              precision: 0.89,
              recall: 0.90,
              f1Score: 0.91
            }
          },
          {
            id: '2',
            name: 'Customer Segmentation',
            description: 'Clusters customers based on behavior patterns',
            framework: 'scikit-learn',
            modelType: 'clustering',
            created_at: new Date().toISOString(),
            metrics: {
              accuracy: 0.88,
              precision: 0.85,
              recall: 0.87,
              f1Score: 0.86
            }
          }
        ]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load models';
        console.error('Failed to list models:', errorMessage);
        setError(errorMessage);
        setModels([]); // Set empty array as fallback
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [workspaceId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('Please select a file');
      return;
    }
    
    if (!workspaceId) {
      setError('Please select a workspace before uploading a model');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // Add new model to list
      const newModel = {
        id: String(models.length + 1),
        name: file.name.replace(/\.[^/.]+$/, ''),
        description: 'Custom model upload',
        framework: 'TensorFlow',
        modelType: 'custom',
        created_at: new Date().toISOString(),
        metrics: {
          accuracy: 0.85,
          precision: 0.83,
          recall: 0.84,
          f1Score: 0.84
        }
      };
      
      setModels(prev => [...prev, newModel]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload model');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  // If no workspace is selected, show the workspace selector
  if (!workspaceId) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-black-500">Custom Models</h3>
          </div>
        </div>
        <WorkspaceSelector />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-black-500">Custom Models</h3>
        </div>
        <div className="flex items-center gap-2">
          {!workspaceId && (
            <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              <span>Select a workspace to upload models</span>
            </div>
          )}
          <label className="glass-button flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload Model
            <input
              type="file"
              className="hidden"
              accept=".h5,.hdf5,.pb,.tflite,.onnx,.pt,.pth,.pkl"
              onChange={handleFileUpload}
              disabled={!workspaceId}
            />
          </label>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm relative">
        {!workspaceId && (
          <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5" />
            <p>Please select a workspace to manage custom models</p>
          </div>
        )}

        {isUploading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-black">Uploading model...</span>
              <span className="text-sm font-medium text-black">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
      </div>

      {/* Models List */}
      <div className="grid gap-6">
        {models.map(model => (
          <div
            key={model.id}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">{model.name}</h4>
                <p className="text-sm text-black-500">{model.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedModel(
                    selectedModel?.id === model.id ? null : model
                  )}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  {selectedModel?.id === model.id ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => {/* Refresh metrics */}}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Model Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-black-500">Framework</p>
                <p className="font-medium">{model.framework}</p>
              </div>
              <div>
                <p className="text-sm text-black-500">Type</p>
                <p className="font-medium">{model.modelType}</p>
              </div>
              <div>
                <p className="text-sm text-black-500">Created</p>
                <p className="font-medium">
                  {new Date(model.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium text-green-600">Active</p>
              </div>
            </div>

            {/* Performance Metrics */}
            {selectedModel?.id === model.id && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-5 h-5 text-teal-600" />
                  <h5 className="font-medium text-black">Performance Metrics</h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Accuracy Chart */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h6 className="text-sm font-medium text-gray-700 mb-4">Accuracy</h6>
                    <div className="h-48">
                      <Line
                        data={{
                          labels: ['1h', '2h', '3h', '4h', '5h', '6h'],
                          datasets: [{
                            label: 'Accuracy',
                            data: [0.95, 0.94, 0.96, 0.95, 0.97, 0.96],
                            borderColor: 'rgb(13, 148, 136)',
                            backgroundColor: 'rgba(13, 148, 136, 0.1)',
                            fill: true
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: false,
                              min: 0.9,
                              max: 1.0
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Latency Chart */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h6 className="text-sm font-medium text-gray-700 mb-4">Latency (ms)</h6>
                    <div className="h-48">
                      <Line
                        data={{
                          labels: ['1h', '2h', '3h', '4h', '5h', '6h'],
                          datasets: [{
                            label: 'Latency',
                            data: [45, 48, 42, 47, 43, 45],
                            borderColor: 'rgb(99, 102, 241)',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            fill: true
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}