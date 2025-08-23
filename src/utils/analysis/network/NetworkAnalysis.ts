import { DataField } from '@/types/data';
import { createError } from '@/utils/core/error';

export interface NetworkNode {
  id: string;
  value: number;
  connections: number;
  centrality: number;
  category?: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  correlation?: number;
  type?: string;
}

export interface NetworkAnalysisResult {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metrics: {
    density: number;
    averageConnections: number;
    strongestConnection: {
      nodes: [string, string];
      weight: number;
    };
    centralNodes: string[];
    clusterCount?: number;
  };
}

export class NetworkAnalysis {
  private correlationThreshold = 0.3;

  constructor(private fields: DataField[]) {
    this.validateFields();
  }

  private validateFields() {
    if (!this.fields?.length) {
      throw createError('VALIDATION_ERROR', 'No fields provided for network analysis');
    }

    const numericFields = this.fields.filter(f => f.type === 'number');
    if (numericFields.length < 2) {
      throw createError('VALIDATION_ERROR', 'Network analysis requires at least 2 numeric fields');
    }
  }

  analyze(): NetworkAnalysisResult {
    console.log('Starting network analysis...');
    const numericFields = this.fields.filter(f => f.type === 'number');
    console.log(`Found ${numericFields.length} numeric fields for analysis`);
    
    // Create nodes for each field
    const nodes: NetworkNode[] = numericFields.map(field => {
      const values = field.value as number[];
      const node = {
        id: field.name,
        value: this.calculateAverage(values),
        connections: 0,
        centrality: 0,
        category: this.determineCategory(values)
      };
      console.log(`Created node: ${node.id} with value: ${node.value}`);
      return node;
    });

    // Create edges between correlated fields
    const edges: NetworkEdge[] = [];
    for (let i = 0; i < numericFields.length; i++) {
      for (let j = i + 1; j < numericFields.length; j++) {
        const field1 = numericFields[i];
        const field2 = numericFields[j];
        const correlation = this.calculateCorrelation(
          field1.value as number[],
          field2.value as number[]
        );

        console.log(`Correlation between ${field1.name} and ${field2.name}: ${correlation}`);

        // Only create edges for meaningful correlations
        if (Math.abs(correlation) > this.correlationThreshold) {
          const edge = {
            source: field1.name,
            target: field2.name,
            weight: Math.abs(correlation),
            correlation,
            type: correlation > 0 ? 'positive' : 'negative'
          };
          edges.push(edge);
          console.log(`Created edge: ${edge.source} -> ${edge.target} (weight: ${edge.weight})`);

          // Update node connections
          nodes[i].connections++;
          nodes[j].connections++;
        }
      }
    }

    // Calculate network metrics
    const density = this.calculateNetworkDensity(nodes.length, edges.length);
    const averageConnections = this.calculateAverageConnections(nodes);
    const strongestConnection = this.findStrongestConnection(edges);
    
    // Calculate node centrality
    this.calculateCentrality(nodes, edges);
    const centralNodes = this.findCentralNodes(nodes);
    const clusterCount = this.identifyClusters(nodes, edges).length;

    console.log('Network analysis metrics:', {
      density,
      averageConnections,
      strongestConnection,
      centralNodes,
      clusterCount
    });

    return {
      nodes,
      edges,
      metrics: {
        density,
        averageConnections,
        strongestConnection,
        centralNodes,
        clusterCount
      }
    };
  }

  private determineCategory(values: number[]): string {
    const mean = this.calculateAverage(values);
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );
    
    if (stdDev / mean > 0.5) return 'highly_variable';
    if (stdDev / mean > 0.2) return 'moderately_variable';
    return 'stable';
  }

  private identifyClusters(nodes: NetworkNode[], edges: NetworkEdge[]): Set<string>[] {
    const clusters: Set<string>[] = [];
    const visited = new Set<string>();

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const cluster = this.exploreCluster(node.id, edges, visited);
        if (cluster.size > 0) {
          clusters.push(cluster);
        }
      }
    });

    return clusters;
  }

  private exploreCluster(nodeId: string, edges: NetworkEdge[], visited: Set<string>): Set<string> {
    const cluster = new Set<string>();
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!visited.has(current)) {
        visited.add(current);
        cluster.add(current);
        
        // Find connected nodes
        edges
          .filter(edge => edge.source === current || edge.target === current)
          .forEach(edge => {
            const connectedNode = edge.source === current ? edge.target : edge.source;
            if (!visited.has(connectedNode)) {
              queue.push(connectedNode);
            }
          });
      }
    }
    
    return cluster;
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateNetworkDensity(nodeCount: number, edgeCount: number): number {
    const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2;
    return maxPossibleEdges === 0 ? 0 : edgeCount / maxPossibleEdges;
  }

  private calculateAverageConnections(nodes: NetworkNode[]): number {
    const totalConnections = nodes.reduce((sum, node) => sum + node.connections, 0);
    return totalConnections / nodes.length;
  }

  private findStrongestConnection(edges: NetworkEdge[]): { nodes: [string, string]; weight: number } {
    if (edges.length === 0) {
      return { nodes: ['', ''], weight: 0 };
    }

    const strongest = edges.reduce((max, edge) => 
      edge.weight > max.weight ? edge : max
    , edges[0]);

    return {
      nodes: [strongest.source, strongest.target],
      weight: strongest.weight
    };
  }

  private calculateCentrality(nodes: NetworkNode[], edges: NetworkEdge[]) {
    // Calculate both degree and betweenness centrality
    nodes.forEach(node => {
      // Degree centrality
      const nodeEdges = edges.filter(edge => 
        edge.source === node.id || edge.target === node.id
      );
      const degreeCentrality = nodeEdges.reduce((sum, edge) => sum + edge.weight, 0);
      
      // Betweenness centrality
      const betweennessCentrality = this.calculateBetweennessCentrality(node.id, nodes, edges);
      
      // Combined centrality score (normalized)
      node.centrality = (degreeCentrality + betweennessCentrality) / 2;
    });
  }

  private calculateBetweennessCentrality(nodeId: string, nodes: NetworkNode[], edges: NetworkEdge[]): number {
    let betweenness = 0;
    const n = nodes.length;

    // For each pair of nodes
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const source = nodes[i].id;
        const target = nodes[j].id;
        
        if (source === nodeId || target === nodeId) continue;

        // Find shortest paths between the pair
        const paths = this.findShortestPaths(source, target, edges);
        if (paths.length === 0) continue;

        // Count paths that go through the node
        const pathsThroughNode = paths.filter(path => path.includes(nodeId));
        betweenness += pathsThroughNode.length / paths.length;
      }
    }

    // Normalize betweenness
    const maxBetweenness = (n - 1) * (n - 2) / 2; // Maximum possible betweenness
    return maxBetweenness > 0 ? betweenness / maxBetweenness : 0;
  }

  private findShortestPaths(source: string, target: string, edges: NetworkEdge[]): string[][] {
    const paths: string[][] = [];
    const queue: { path: string[]; node: string }[] = [{ path: [source], node: source }];
    const visited = new Set<string>();
    let shortestLength = Infinity;

    while (queue.length > 0) {
      const { path, node } = queue.shift()!;

      if (path.length > shortestLength) continue;
      if (visited.has(node)) continue;
      visited.add(node);

      if (node === target) {
        shortestLength = path.length;
        paths.push(path);
        continue;
      }

      const neighbors = edges
        .filter(edge => (edge.source === node || edge.target === node))
        .map(edge => edge.source === node ? edge.target : edge.source);

      for (const neighbor of neighbors) {
        if (!path.includes(neighbor)) {
          queue.push({
            path: [...path, neighbor],
            node: neighbor
          });
        }
      }
    }

    return paths;
  }

  private findCentralNodes(nodes: NetworkNode[]): string[] {
    const meanCentrality = nodes.reduce((sum, node) => sum + node.centrality, 0) / nodes.length;
    const stdDev = Math.sqrt(
      nodes.reduce((sum, node) => sum + Math.pow(node.centrality - meanCentrality, 2), 0) / nodes.length
    );

    // Consider nodes with centrality > mean + 0.5 stddev as central (adjusted threshold)
    return nodes
      .filter(node => node.centrality > meanCentrality + 0.5 * stdDev)
      .sort((a, b) => b.centrality - a.centrality)
      .map(node => node.id);
  }
}