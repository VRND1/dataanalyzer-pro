import { Card } from '../../../../components/ui/card';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { MultiDirectedGraph } from 'graphology';
import * as centrality from 'graphology-metrics/centrality';
import eigenvector from 'graphology-metrics/centrality/eigenvector';
import { SigmaContainer, ControlsContainer, ZoomControl, FullScreenControl } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';

// Enhanced Types
export type CentralityAlgorithm = 
  | 'degree' 
  | 'betweenness' 
  | 'closeness' 
  | 'eigenvector' 
  | 'pagerank';

export type GraphData = {
  nodes: Array<{ 
    id: string; 
    label?: string;
    attributes?: Record<string, any>;
  }>;
  edges: Array<{ 
    source: string; 
    target: string;
    weight?: number;
    attributes?: Record<string, any>;
  }>;
};

type NodeAttributes = {
  size?: number;
  label?: string;
  color?: string;
  centrality?: number;
  rank?: number;
  [key: string]: any;
};

type EdgeAttributes = {
  weight?: number;
  color?: string;
  [key: string]: any;
};

interface GraphMethods {
  addNode: (node: string, attributes?: NodeAttributes) => void;
  addEdge: (source: string, target: string, attributes?: EdgeAttributes) => void;
  setNodeAttribute: (node: string, attribute: string, value: any) => void;
  getNodeAttribute: (node: string, attribute: string) => any;
  mapNodes: <T>(callback: (node: string) => T) => T[];
  hasNode: (node: string) => boolean;
  hasEdge: (source: string, target: string) => boolean;
  neighbors: (node: string) => string[];
  degree: (node: string) => number;
}

type GraphType = MultiDirectedGraph<NodeAttributes, EdgeAttributes> & GraphMethods;

interface CentralityProps {
  graphData?: GraphData;
  isLoading?: boolean;
  onAlgorithmChange?: (algorithm: CentralityAlgorithm) => void;
  onMetricsCalculated?: (metrics: Record<string, Record<string, number>>) => void;
  showTopNodes?: number;
}

interface CentralityMetrics {
  [algorithm: string]: Record<string, number>;
}

interface NetworkStats {
  nodes: number;
  edges: number;
  density: number;
  averageDegree: number;
  connectedComponents: number;
  diameter: number;
  averagePathLength: number;
}

// Move TopNode interface outside the component
interface TopNode {
  id: string;
  value: number;
  label: string;
  rank: number;
  percentile: number;
}

export function Centrality({ 
  graphData, 
  isLoading = false, 
  onAlgorithmChange,
  onMetricsCalculated,
  showTopNodes = 10
}: CentralityProps) {
  const [centralityMetrics, setCentralityMetrics] = useState<CentralityMetrics | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<CentralityAlgorithm>('degree');
  const [error, setError] = useState<string | null>(null);
  const [graphInstance, setGraphInstance] = useState<GraphType | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [visualizationMode, setVisualizationMode] = useState<'size' | 'color' | 'both'>('both');
  // Add state for showTopNodes
  const [showTopNodesState, setShowTopNodes] = useState<number>(showTopNodes);

  // Enhanced graph creation with validation
  const createGraph = useCallback((data: GraphData): GraphType => {
    const graph = new MultiDirectedGraph<NodeAttributes, EdgeAttributes>() as GraphType;
    
    // Validate and add nodes
    const validNodes = data.nodes.filter(node => {
      if (!node.id || typeof node.id !== 'string') {
        console.warn('Invalid node found:', node);
        return false;
      }
      return true;
    });

    validNodes.forEach(node => {
      if (!graph.hasNode(node.id)) {
        graph.addNode(node.id, { 
          ...node.attributes,
          size: 5, 
          label: node.label || node.id,
          color: '#3b82f6'
        });
      }
    });
    
    // Validate and add edges
    const validEdges = data.edges.filter(edge => {
      if (!edge.source || !edge.target || 
          !graph.hasNode(edge.source) || !graph.hasNode(edge.target)) {
        console.warn('Invalid edge found:', edge);
        return false;
      }
      return true;
    });

    validEdges.forEach(edge => {
      if (!graph.hasEdge(edge.source, edge.target)) {
        graph.addEdge(edge.source, edge.target, { 
          ...edge.attributes,
          weight: edge.weight || 1,
          color: '#94a3b8'
        });
      }
    });
    
    return graph;
  }, []);

  // Calculate network statistics
  const calculateNetworkStats = useCallback((graph: GraphType): NetworkStats => {
    const nodes = graph.mapNodes(node => node);
    const edges = graph.mapNodes(node => graph.neighbors(node)).flat();
    
    const nodeCount = nodes.length;
    const edgeCount = edges.length / 2; // Undirected edges counted twice
    
    // Calculate density
    const maxEdges = nodeCount * (nodeCount - 1);
    const density = maxEdges > 0 ? edgeCount / maxEdges : 0;
    
    // Calculate average degree
    const totalDegree = nodes.reduce((sum, node) => sum + graph.degree(node), 0);
    const averageDegree = nodeCount > 0 ? totalDegree / nodeCount : 0;
    
    // Calculate connected components (simplified)
    const visited = new Set<string>();
    let components = 0;
    
    nodes.forEach(node => {
      if (!visited.has(node)) {
        components++;
        const queue = [node];
        visited.add(node);
        
        while (queue.length > 0) {
          const current = queue.shift()!;
          const neighbors = graph.neighbors(current);
          
          neighbors.forEach(neighbor => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          });
        }
      }
    });
    
    return {
      nodes: nodeCount,
      edges: edgeCount,
      density,
      averageDegree,
      connectedComponents: components,
      diameter: 0, // Would need more complex calculation
      averagePathLength: 0 // Would need more complex calculation
    };
  }, []);

  // Create graph instance when data changes
  useEffect(() => {
    if (!graphData) {
      setGraphInstance(null);
      setNetworkStats(null);
      return;
    }

    try {
      const graph = createGraph(graphData);
      const stats = calculateNetworkStats(graph);
      
      setGraphInstance(graph);
      setNetworkStats(stats);
      setError(null);
    } catch (err) {
      setError('Failed to process graph data. Please check your data format.');
      console.error('Graph processing error:', err);
    }
  }, [graphData, createGraph, calculateNetworkStats]);

  // Enhanced centrality calculation with multiple algorithms
  const calculateCentrality = useCallback(async (graph: GraphType, algorithm: CentralityAlgorithm) => {
    setIsCalculating(true);
    
    try {
      let metrics: Record<string, number> = {};
      
      switch (algorithm) {
        case 'degree':
          metrics = centrality.degree(graph);
          break;
        case 'betweenness':
          metrics = centrality.betweenness(graph);
          break;
        case 'closeness':
          metrics = centrality.closeness(graph);
          break;
        case 'eigenvector':
          metrics = eigenvector(graph);
          break;
        case 'pagerank':
          try {
            metrics = centrality.pagerank(graph);
          } catch (err) {
            console.warn('PageRank failed, falling back to degree:', err);
            metrics = centrality.degree(graph);
          }
          break;
        default:
          metrics = centrality.degree(graph);
      }

      return metrics;
    } catch (err) {
      console.error(`Error calculating ${algorithm} centrality:`, err);
      throw new Error(`Failed to calculate ${algorithm} centrality`);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  // Calculate centrality metrics when algorithm or graph changes
  useEffect(() => {
    if (!graphInstance) {
      setCentralityMetrics(null);
      return;
    }

    const calculateMetrics = async () => {
      try {
        const metrics = await calculateCentrality(graphInstance, selectedAlgorithm);
        
        // Normalize values for visualization
        const values = Object.values(metrics);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const range = maxValue - minValue;
        
        // Update graph visualization
        Object.keys(metrics).forEach(node => {
          const value = metrics[node];
          const normalizedValue = range > 0 ? (value - minValue) / range : 0;
          
          if (visualizationMode === 'size' || visualizationMode === 'both') {
            graphInstance.setNodeAttribute(node, 'size', 5 + 20 * normalizedValue);
          }
          
          if (visualizationMode === 'color' || visualizationMode === 'both') {
            graphInstance.setNodeAttribute(node, 'color', getColorForValue(normalizedValue));
          }
          
          graphInstance.setNodeAttribute(node, 'centrality', value);
        });

        const newMetrics = { [selectedAlgorithm]: metrics };
        setCentralityMetrics(newMetrics);
        onMetricsCalculated?.(newMetrics);
        onAlgorithmChange?.(selectedAlgorithm);
        setError(null);
      } catch (err) {
        setError(`Failed to calculate ${selectedAlgorithm} centrality: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error('Centrality calculation error:', err);
      }
    };

    calculateMetrics();
  }, [graphInstance, selectedAlgorithm, visualizationMode, calculateCentrality, onMetricsCalculated, onAlgorithmChange]);

  const getColorForValue = (value: number): string => {
    // Enhanced color scheme with better contrast
    if (value < 0.25) return '#3b82f6'; // Blue
    if (value < 0.5) return '#10b981'; // Green
    if (value < 0.75) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const topNodes = useMemo(() => {
    if (!centralityMetrics || !graphInstance || !selectedAlgorithm) return [];
    
    const nodeValues = centralityMetrics[selectedAlgorithm];
    const values = Object.values(nodeValues).sort((a, b) => b - a);
    
    return graphInstance.mapNodes((node: string) => {
      const value = nodeValues[node];
      const rank = values.indexOf(value) + 1;
      const percentile = ((values.length - rank + 1) / values.length) * 100;
      
      return {
        id: node,
        value,
        label: graphInstance.getNodeAttribute(node, 'label') || node,
        rank,
        percentile
      };
    }).sort((a: TopNode, b: TopNode) => b.value - a.value).slice(0, showTopNodesState);
  }, [centralityMetrics, graphInstance, selectedAlgorithm, showTopNodesState]);

  const handleAlgorithmChange = (algorithm: CentralityAlgorithm) => {
    setSelectedAlgorithm(algorithm);
  };

  const algorithmDescriptions = {
    degree: "Measures direct connections. High degree nodes are network hubs.",
    betweenness: "Identifies bridge nodes that connect different network communities.",
    closeness: "Measures average distance to all other nodes. High closeness = well-connected.",
    eigenvector: "Considers both direct connections and importance of connected nodes.",
    pagerank: "Similar to Google's PageRank, considers both connections and node importance."
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Network Centrality Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">
            Analyze node importance using various centrality measures
          </p>
        </div>
        
        {graphData && (
          <div className="flex flex-wrap gap-2">
            {(['degree', 'betweenness', 'closeness', 'eigenvector', 'pagerank'] as CentralityAlgorithm[]).map(algorithm => (
              <AlgorithmButton 
                key={algorithm}
                active={selectedAlgorithm === algorithm}
                onClick={() => handleAlgorithmChange(algorithm)}
                disabled={isCalculating}
              >
                {algorithm.charAt(0).toUpperCase() + algorithm.slice(1)}
              </AlgorithmButton>
            ))}
          </div>
        )}
      </div>
      
      {isLoading || isCalculating ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">
              {isCalculating ? `Calculating ${selectedAlgorithm} centrality...` : 'Processing graph data...'}
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Calculation Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      ) : !graphData ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-600 mt-2">No graph data provided. Please upload a file to analyze.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Network Statistics */}
          {networkStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard 
                title="Nodes" 
                value={networkStats.nodes}
                icon="👥"
              />
              <StatCard 
                title="Edges" 
                value={networkStats.edges}
                icon="🔗"
              />
              <StatCard 
                title="Density" 
                value={networkStats.density.toFixed(4)}
                icon="📊"
              />
              <StatCard 
                title="Avg Degree" 
                value={networkStats.averageDegree.toFixed(2)}
                icon="📈"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Network Visualization */}
            <div className="h-96 border rounded-lg overflow-hidden bg-gray-50">
              {graphInstance && (
                <SigmaContainer graph={graphInstance}>
                  <ControlsContainer position="bottom-right">
                    <ZoomControl />
                    <FullScreenControl />
                  </ControlsContainer>
                </SigmaContainer>
              )}
            </div>
            
            {/* Top Nodes and Analysis */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-800">Top Central Nodes</h4>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Show:</label>
                  <select 
                    value={showTopNodesState}
                    onChange={(e) => setShowTopNodes(Number(e.target.value))}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {topNodes.map((node) => (
                  <NodeCard 
                    key={node.id}
                    node={node}
                    maxValue={topNodes[0]?.value || 1}
                    algorithm={selectedAlgorithm}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Algorithm Description */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              About {selectedAlgorithm.charAt(0).toUpperCase() + selectedAlgorithm.slice(1)} Centrality
            </h4>
            <p className="text-sm text-blue-800">
              {algorithmDescriptions[selectedAlgorithm]}
            </p>
          </div>

          {/* Visualization Controls */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Visualization:</label>
            <div className="flex space-x-2">
              {(['size', 'color', 'both'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setVisualizationMode(mode)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    visualizationMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// Enhanced Helper Components
const AlgorithmButton = ({ 
  active, 
  children, 
  onClick,
  disabled = false
}: { 
  active: boolean; 
  children: React.ReactNode; 
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1 text-sm rounded-md transition-colors ${
      disabled 
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : active 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {children}
  </button>
);

const StatCard = ({ 
  title, 
  value, 
  icon 
}: { 
  title: string; 
  value: string | number; 
  icon?: string;
}) => (
  <div className="bg-white p-4 rounded-lg border shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
      {icon && <span className="text-2xl">{icon}</span>}
    </div>
  </div>
);

const NodeCard = ({ 
  node, 
  maxValue,
}: { 
  node: TopNode; 
  maxValue: number;
  algorithm: CentralityAlgorithm;
}) => (
  <div className="flex items-center p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium mr-3">
      {node.rank}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-gray-900 truncate">{node.label}</p>
      <p className="text-sm text-gray-500 truncate">{node.id}</p>
      <p className="text-xs text-blue-600">Top {node.percentile.toFixed(1)}%</p>
    </div>
    <div className="w-24 ml-2">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" 
          style={{ width: `${(node.value / maxValue) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-600 text-right mt-1">
        {node.value.toFixed(4)}
      </p>
    </div>
  </div>
); 