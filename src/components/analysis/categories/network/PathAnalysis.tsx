import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Select } from '../../../../components/ui/select';
import { Progress } from '../../../../components/ui/progress';
import { Badge } from '../../../../components/ui/badge';
import { Alert } from '../../../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { DataField } from '../../../../types/data';
import { NetworkAnalysis, NetworkNode, NetworkEdge, NetworkAnalysisResult } from '../../../../utils/analysis/network/NetworkAnalysis';

interface PathAnalysisProps {
  fields?: DataField[];
  onAnalysisComplete?: (result: NetworkAnalysisResult) => void;
}

interface PathMetrics {
  shortestPath: string[];
  pathLength: number;
  pathStrength: number;
  bottleneckNodes: string[];
  criticalPaths: string[][];
  efficiency: number;
}

interface PathAnalysisState {
  sourceNode: string;
  targetNode: string;
  analysisResult: NetworkAnalysisResult | null;
  pathMetrics: PathMetrics | null;
  isLoading: boolean;
  error: string | null;
  selectedPathType: 'shortest' | 'strongest' | 'most_central';
}

export function PathAnalysis({ fields = [], onAnalysisComplete }: PathAnalysisProps) {
  const [state, setState] = useState<PathAnalysisState>({
    sourceNode: '',
    targetNode: '',
    analysisResult: null,
    pathMetrics: null,
    isLoading: false,
    error: null,
    selectedPathType: 'shortest'
  });

  // Get available nodes from fields
  const availableNodes = useMemo(() => {
    if (!fields || fields.length === 0) return [];
    
    const numericFields = fields.filter(f => f.type === 'number');
    return numericFields.map(field => ({
      id: field.name,
      label: field.name,
      value: field.name
    }));
  }, [fields]);

  // Perform network analysis
  const performNetworkAnalysis = async () => {
    if (!fields || fields.length < 2) {
      setState(prev => ({ ...prev, error: 'Insufficient data for path analysis' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const numericFields = fields.filter(f => f.type === 'number');
      
      if (numericFields.length < 2) {
        throw new Error('At least 2 numeric fields required for path analysis');
      }

      const networkAnalysis = new NetworkAnalysis(numericFields);
      const result = networkAnalysis.analyze();
      
      setState(prev => ({ 
        ...prev, 
        analysisResult: result,
        isLoading: false 
      }));

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Analysis failed',
        isLoading: false 
      }));
    }
  };

  // Calculate path metrics
  const calculatePathMetrics = (source: string, target: string, result: NetworkAnalysisResult): PathMetrics => {
    const { nodes, edges } = result;
    
    // Find shortest path using Dijkstra's algorithm
    const shortestPath = findShortestPath(source, target, edges);
    const pathLength = shortestPath.length - 1; // Number of edges
    
    // Calculate path strength (average weight of edges in path)
    const pathStrength = calculatePathStrength(shortestPath, edges);
    
    // Find bottleneck nodes (nodes with high betweenness centrality)
    const bottleneckNodes = findBottleneckNodes(nodes);
    
    // Find critical paths (paths with highest weights)
    const criticalPaths = findCriticalPaths(nodes, edges, 3);
    
    // Calculate efficiency (inverse of path length weighted by strength)
    const efficiency = pathLength > 0 ? pathStrength / pathLength : 0;

    return {
      shortestPath,
      pathLength,
      pathStrength,
      bottleneckNodes,
      criticalPaths,
      efficiency
    };
  };

  // Dijkstra's algorithm for shortest path
  const findShortestPath = (source: string, target: string, edges: NetworkEdge[]): string[] => {
    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const visited = new Set<string>();
    
    // Initialize distances
    edges.forEach(edge => {
      distances.set(edge.source, Infinity);
      distances.set(edge.target, Infinity);
    });
    distances.set(source, 0);
    
    while (visited.size < distances.size) {
      // Find unvisited node with minimum distance
      let minNode = '';
      let minDistance = Infinity;
      
      for (const [node, distance] of distances) {
        if (!visited.has(node) && distance < minDistance) {
          minNode = node;
          minDistance = distance;
        }
      }
      
      if (minNode === '') break;
      
      visited.add(minNode);
      
      // Update distances to neighbors
      edges.forEach(edge => {
        if (edge.source === minNode && !visited.has(edge.target)) {
          const newDistance = distances.get(minNode)! + (1 / edge.weight);
          if (newDistance < distances.get(edge.target)!) {
            distances.set(edge.target, newDistance);
            previous.set(edge.target, minNode);
          }
        } else if (edge.target === minNode && !visited.has(edge.source)) {
          const newDistance = distances.get(minNode)! + (1 / edge.weight);
          if (newDistance < distances.get(edge.source)!) {
            distances.set(edge.source, newDistance);
            previous.set(edge.source, minNode);
          }
        }
      });
    }
    
    // Reconstruct path
    const path: string[] = [];
    let current = target;
    
    while (current !== source && current !== '') {
      path.unshift(current);
      current = previous.get(current) || '';
    }
    
    if (current === source) {
      path.unshift(source);
    }
    
    return path;
  };

  const calculatePathStrength = (path: string[], edges: NetworkEdge[]): number => {
    if (path.length < 2) return 0;
    
    let totalWeight = 0;
    let edgeCount = 0;
    
    for (let i = 0; i < path.length - 1; i++) {
      const edge = edges.find(e => 
        (e.source === path[i] && e.target === path[i + 1]) ||
        (e.source === path[i + 1] && e.target === path[i])
      );
      
      if (edge) {
        totalWeight += edge.weight;
        edgeCount++;
      }
    }
    
    return edgeCount > 0 ? totalWeight / edgeCount : 0;
  };

  const findBottleneckNodes = (nodes: NetworkNode[]): string[] => {
    // Find nodes with high betweenness centrality
    const centralityThreshold = 0.7;
    return nodes
      .filter(node => node.centrality > centralityThreshold)
      .sort((a, b) => b.centrality - a.centrality)
      .slice(0, 3)
      .map(node => node.id);
  };

  const findCriticalPaths = (nodes: NetworkNode[], edges: NetworkEdge[], maxPaths: number): string[][] => {
    // Find paths with highest average weight
    const paths: Array<{ path: string[]; strength: number }> = [];
    
    // Generate paths between central nodes
    const centralNodes = nodes
      .sort((a, b) => b.centrality - a.centrality)
      .slice(0, Math.min(5, nodes.length))
      .map(node => node.id);
    
    for (let i = 0; i < centralNodes.length; i++) {
      for (let j = i + 1; j < centralNodes.length; j++) {
        const path = findShortestPath(centralNodes[i], centralNodes[j], edges);
        if (path.length > 1) {
          const strength = calculatePathStrength(path, edges);
          paths.push({ path, strength });
        }
      }
    }
    
    return paths
      .sort((a, b) => b.strength - a.strength)
      .slice(0, maxPaths)
      .map(p => p.path);
  };

  // Handle path analysis
  const handlePathAnalysis = () => {
    if (!state.sourceNode || !state.targetNode || !state.analysisResult) {
      setState(prev => ({ ...prev, error: 'Please select source and target nodes' }));
      return;
    }

    try {
      const metrics = calculatePathMetrics(state.sourceNode, state.targetNode, state.analysisResult);
      setState(prev => ({ ...prev, pathMetrics: metrics, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Path analysis failed' 
      }));
    }
  };

  // Auto-analyze when fields change
  useEffect(() => {
    if (fields && fields.length >= 2) {
      performNetworkAnalysis();
    }
  }, [fields]);

  // Auto-select nodes when analysis completes
  useEffect(() => {
    if (state.analysisResult && availableNodes.length >= 2) {
      setState(prev => ({
        ...prev,
        sourceNode: availableNodes[0]?.value || '',
        targetNode: availableNodes[1]?.value || ''
      }));
    }
  }, [state.analysisResult, availableNodes]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Path Analysis</h3>
        <Badge variant={state.analysisResult ? "default" : "secondary"}>
          {state.analysisResult ? `${state.analysisResult.nodes.length} nodes` : 'No data'}
        </Badge>
      </div>

      {state.error && (
        <Alert className="mb-4" variant="destructive">
          {state.error}
        </Alert>
      )}

      {state.isLoading && (
        <div className="mb-4">
          <Progress value={50} className="mb-2" />
          <p className="text-sm text-gray-600">Analyzing network structure...</p>
        </div>
      )}

      {state.analysisResult && (
        <div className="space-y-6">
          {/* Network Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900">Network Density</h4>
              <p className="text-2xl font-bold text-blue-700">
                {(state.analysisResult.metrics.density * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900">Average Connections</h4>
              <p className="text-2xl font-bold text-green-700">
                {state.analysisResult.metrics.averageConnections.toFixed(1)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900">Central Nodes</h4>
              <p className="text-2xl font-bold text-purple-700">
                {state.analysisResult.metrics.centralNodes.length}
              </p>
            </div>
          </div>

          {/* Path Analysis Controls */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4">Path Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Node
                </label>
                <Select
                  value={state.sourceNode}
                  onValueChange={(value) => setState(prev => ({ ...prev, sourceNode: value }))}
                >
                  <option value="">Select source node</option>
                  {availableNodes.map(node => (
                    <option key={node.id} value={node.value}>
                      {node.label}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Node
                </label>
                <Select
                  value={state.targetNode}
                  onValueChange={(value) => setState(prev => ({ ...prev, targetNode: value }))}
                >
                  <option value="">Select target node</option>
                  {availableNodes.map(node => (
                    <option key={node.id} value={node.value}>
                      {node.label}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handlePathAnalysis}
                  disabled={!state.sourceNode || !state.targetNode}
                  className="w-full"
                >
                  Analyze Path
                </Button>
              </div>
            </div>
          </div>

          {/* Path Results */}
          {state.pathMetrics && (
            <Tabs defaultValue="path" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="path">Path Details</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>
              
              <TabsContent value="path" className="mt-4">
                <div className="bg-white border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Shortest Path</h5>
                  <div className="flex items-center space-x-2 mb-4">
                    {state.pathMetrics.shortestPath.map((node, index) => (
                      <React.Fragment key={node}>
                        <Badge variant="outline">{node}</Badge>
                        {index < state.pathMetrics!.shortestPath.length - 1 && (
                          <span className="text-gray-400">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Path Length:</span>
                      <span className="ml-2 font-medium">{state.pathMetrics.pathLength} edges</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Path Strength:</span>
                      <span className="ml-2 font-medium">{(state.pathMetrics.pathStrength * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="metrics" className="mt-4">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Path Efficiency</h5>
                    <p className="text-2xl font-bold text-blue-700">
                      {(state.pathMetrics.efficiency * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-blue-600">
                      Higher values indicate more efficient paths
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-medium text-yellow-900 mb-2">Bottleneck Nodes</h5>
                    <div className="flex flex-wrap gap-2">
                      {state.pathMetrics.bottleneckNodes.map(node => (
                        <Badge key={node} variant="secondary">{node}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">Critical Paths</h5>
                    <div className="space-y-2">
                      {state.pathMetrics.criticalPaths.map((path, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-600">Path {index + 1}:</span>
                          <div className="flex items-center space-x-1">
                            {path.map((node, nodeIndex) => (
                              <React.Fragment key={node}>
                                <Badge variant="outline" className="text-xs">{node}</Badge>
                                {nodeIndex < path.length - 1 && (
                                  <span className="text-gray-400 text-xs">→</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="insights" className="mt-4">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Path Analysis Insights</h5>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {state.pathMetrics.pathLength <= 2 && (
                        <li>✅ Direct connection detected - optimal path efficiency</li>
                      )}
                      {state.pathMetrics.pathLength > 3 && (
                        <li>⚠️ Long path detected - consider optimizing network structure</li>
                      )}
                      {state.pathMetrics.pathStrength > 0.8 && (
                        <li>✅ Strong path connections - reliable data flow</li>
                      )}
                      {state.pathMetrics.pathStrength < 0.5 && (
                        <li>⚠️ Weak path connections - potential data flow issues</li>
                      )}
                      {state.pathMetrics.bottleneckNodes.length > 0 && (
                        <li>⚠️ Bottleneck nodes detected - monitor these critical points</li>
                      )}
                      {state.pathMetrics.efficiency > 0.7 && (
                        <li>✅ High path efficiency - optimal network performance</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Recommendations</h5>
                    <ul className="space-y-1 text-sm text-blue-700">
                      {state.pathMetrics.pathLength > 3 && (
                        <li>• Consider adding direct connections to reduce path length</li>
                      )}
                      {state.pathMetrics.pathStrength < 0.6 && (
                        <li>• Strengthen connections between nodes in the path</li>
                      )}
                      {state.pathMetrics.bottleneckNodes.length > 0 && (
                        <li>• Monitor and optimize bottleneck nodes for better flow</li>
                      )}
                      <li>• Regular monitoring of path performance is recommended</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}

      {!state.analysisResult && !state.isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No data available for path analysis</p>
          <Button onClick={performNetworkAnalysis} disabled={!fields || fields.length < 2}>
            Start Analysis
          </Button>
        </div>
      )}
    </Card>
  );
} 