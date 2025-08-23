import { NetworkAnalysis } from '../utils/analysis/network/NetworkAnalysis';
import { DataField } from '../types/data';

describe('Network Analysis Tests', () => {
  const testData: DataField[] = [
    {
      name: 'revenue',
      type: 'number',
      value: [100, 120, 140, 160, 180]
    },
    {
      name: 'profit',
      type: 'number',
      value: [20, 25, 30, 35, 40]
    },
    {
      name: 'customers',
      type: 'number',
      value: [50, 55, 60, 65, 70]
    },
    {
      name: 'satisfaction',
      type: 'number',
      value: [4.0, 4.2, 4.1, 4.3, 4.4]
    }
  ];

  let networkAnalysis: NetworkAnalysis;

  beforeEach(() => {
    networkAnalysis = new NetworkAnalysis(testData);
  });

  test('Network Analysis Initialization', () => {
    expect(networkAnalysis).toBeDefined();
  });

  test('Network Analysis Results Structure', () => {
    const results = networkAnalysis.analyze();
    
    // Check basic structure
    expect(results).toHaveProperty('nodes');
    expect(results).toHaveProperty('edges');
    expect(results).toHaveProperty('metrics');
    
    // Check nodes
    expect(results.nodes).toHaveLength(4);
    results.nodes.forEach(node => {
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('value');
      expect(node).toHaveProperty('connections');
      expect(node).toHaveProperty('centrality');
      expect(node).toHaveProperty('category');
    });
    
    // Check edges
    expect(results.edges.length).toBeGreaterThan(0);
    results.edges.forEach(edge => {
      expect(edge).toHaveProperty('source');
      expect(edge).toHaveProperty('target');
      expect(edge).toHaveProperty('weight');
      expect(edge).toHaveProperty('correlation');
      expect(edge).toHaveProperty('type');
    });
    
    // Check metrics
    expect(results.metrics).toHaveProperty('density');
    expect(results.metrics).toHaveProperty('averageConnections');
    expect(results.metrics).toHaveProperty('strongestConnection');
    expect(results.metrics).toHaveProperty('centralNodes');
    expect(results.metrics).toHaveProperty('clusterCount');
  });

  test('Network Connections', () => {
    const results = networkAnalysis.analyze();
    
    // Check revenue-profit connection
    const revenueProfitEdge = results.edges.find(edge => 
      (edge.source === 'revenue' && edge.target === 'profit') ||
      (edge.source === 'profit' && edge.target === 'revenue')
    );
    expect(revenueProfitEdge).toBeDefined();
    expect(revenueProfitEdge?.correlation).toBeGreaterThan(0.9);
    
    // Check revenue node
    const revenueNode = results.nodes.find(node => node.id === 'revenue');
    expect(revenueNode).toBeDefined();
    expect(revenueNode?.connections).toBeGreaterThan(0);
  });

  test('Network Metrics', () => {
    const results = networkAnalysis.analyze();
    
    // Check density
    expect(results.metrics.density).toBeGreaterThan(0);
    expect(results.metrics.density).toBeLessThanOrEqual(1);
    
    // Check average connections
    expect(results.metrics.averageConnections).toBeGreaterThan(0);
    
    // Check strongest connection
    expect(results.metrics.strongestConnection.weight).toBeGreaterThan(0);
    expect(results.metrics.strongestConnection.nodes).toHaveLength(2);
    
    // Check central nodes
    expect(Array.isArray(results.metrics.centralNodes)).toBeTruthy();
  });

  test('Error Handling', () => {
    // Test with invalid data
    const invalidData: DataField[] = [
      {
        name: 'test',
        type: 'number',
        value: []
      }
    ];

    expect(() => new NetworkAnalysis(invalidData)).toThrow();
  });
}); 