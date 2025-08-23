import React from 'react';
import { Network } from 'lucide-react';
import { Scatter } from 'react-chartjs-2';
import { DataField } from '@/types/data';

interface ClusteringAnalysisProps {
  data: {
    fields: DataField[];
  };
}

export function ClusteringAnalysis({ data }: ClusteringAnalysisProps) {
  const [numClusters, setNumClusters] = React.useState(3);
  const [results, setResults] = React.useState<any>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const kMeans = async (data: number[][], k: number) => {
    // Initialize centroids randomly
    const centroids = data
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, k);
    
    let labels = new Array(data.length).fill(0);
    let oldLabels: number[] = [];
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      // Assign points to nearest centroid
      labels = data.map(point => {
        const distances = centroids.map(centroid => 
          euclideanDistance(point, centroid)
        );
        return distances.indexOf(Math.min(...distances));
      });

      // Check convergence
      if (JSON.stringify(labels) === JSON.stringify(oldLabels)) {
        break;
      }
      oldLabels = [...labels];

      // Update centroids
      for (let i = 0; i < k; i++) {
        const clusterPoints = (data || []).filter((_, idx) => (labels || [])[idx] === i);
        if (clusterPoints.length > 0) {
          centroids[i] = clusterPoints[0].map((_, dim) =>
            clusterPoints.reduce((sum, p) => sum + p[dim], 0) / clusterPoints.length
          );
        }
      }

      iterations++;
    }

    return { centroids, labels };
  };

  const euclideanDistance = (a: number[], b: number[]): number => {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
    );
  };

  const performClustering = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const numericFields = (data?.fields || []).filter(f => f.type === 'number');
      if (numericFields.length < 2) {
        throw new Error('Clustering requires at least 2 numeric fields');
      }

      // Simple k-means implementation
      const points = numericFields[0].value.map((_, i) => 
        numericFields.map(f => Number(f.value[i]))
      );

      const clusters = await kMeans(points, numClusters);
      
      setResults({
        clusters,
        metrics: {
          numClusters,
          silhouetteScore: calculateSilhouetteScore(points, clusters.labels)
        },
        data: {
          points,
          labels: clusters.labels
        }
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Clustering failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateSilhouetteScore = (data: number[][], labels: number[]): number => {
    let totalScore = 0;
    
    data.forEach((point, i) => {
      const clusterLabel = labels[i];
      let intraClusterDist = 0;
      let nearestInterClusterDist = Infinity;

      data.forEach((otherPoint, j) => {
        if (i === j) return;
        const dist = euclideanDistance(point, otherPoint);

        if (labels[j] === clusterLabel) {
          intraClusterDist += dist;
        } else {
          nearestInterClusterDist = Math.min(nearestInterClusterDist, dist);
        }
      });

      const clusterSize = (labels || []).filter(l => l === clusterLabel).length;
      intraClusterDist /= (clusterSize - 1 || 1);
      
      const silhouette = (nearestInterClusterDist - intraClusterDist) / 
        Math.max(nearestInterClusterDist, intraClusterDist);
      
      totalScore += silhouette;
    });

    return totalScore / data.length;
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Network className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-black-500">Clustering Analysis</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Clusters
          </label>
          <input
            type="number"
            min={2}
            max={10}
            value={numClusters}
            onChange={(e) => setNumClusters(parseInt(e.target.value))}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={performClustering}
          disabled={isProcessing}
          className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Run Clustering'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-4">Clustering Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Number of Clusters</p>
                <p className="text-2xl font-semibold text-black-500">{results.metrics.numClusters}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-black-500">Silhouette Score</p>
                <p className="text-2xl font-semibold text-black-500">
                  {results.metrics.silhouetteScore.toFixed(3)}
                </p>
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="font-medium text-black-900 mb-4">Cluster Visualization</h4>
            <div className="h-[400px]">
              <Scatter
                data={{
                  datasets: [{
                    label: 'Clusters',
                    data: results.data.points.map((point: number[]) => ({
                      x: point[0],
                      y: point[1]
                    })),
                    backgroundColor: results.data.labels.map((label: number) => 
                      `hsl(${label * 360 / results.metrics.numClusters}, 70%, 50%)`
                    )
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Cluster Distribution'
                    }
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: data.fields[0].name
                      }
                    },
                    y: {
                      title: {
                        display: true,
                        text: data.fields[1].name
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}