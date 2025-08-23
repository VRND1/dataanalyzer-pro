import { AnalysisEngine } from '../utils/analysis/core/AnalysisEngine';
import { DataField } from '../types/data';
import { NetworkAnalysisResult } from '../utils/analysis/network/NetworkAnalysis';

describe('Analysis Features Test', () => {
  // Sample test data
  const testData: DataField[] = [
    {
      name: 'sales',
      type: 'number',
      value: [100, 150, 200, 250, 300]
    },
    {
      name: 'profit',
      type: 'number',
      value: [20, 35, 45, 55, 70]
    },
    {
      name: 'customer_satisfaction',
      type: 'number',
      value: [4.2, 4.5, 4.7, 4.8, 4.9]
    }
  ];

  let analysisEngine: AnalysisEngine;

  beforeEach(() => {
    analysisEngine = new AnalysisEngine(testData);
  });

  test('Statistical Analysis - Basic Stats', async () => {
    const results = await analysisEngine.analyze('descriptive');
    
    expect(results).toBeDefined();
    expect(results.statistics).toBeDefined();
    
    // Check if mean calculations are correct
    const salesStats = results.statistics?.descriptive?.sales;
    expect(salesStats?.mean).toBeCloseTo(200); // Average of sales data
    
    const profitStats = results.statistics?.descriptive?.profit;
    expect(profitStats?.mean).toBeCloseTo(45); // Average of profit data
  });

  test('Correlation Analysis', async () => {
    const results = await analysisEngine.analyze('correlation');
    
    expect(results).toBeDefined();
    expect(results.statistics?.correlations).toBeDefined();
    
    // Check correlation between sales and profit
    const salesProfitCorr = results.statistics?.correlations?.['sales_profit'];
    expect(salesProfitCorr).toBeGreaterThan(0.9); // Strong positive correlation expected
  });

  test('Hypothesis Testing', async () => {
    const results = await analysisEngine.analyze('hypothesis');
    
    expect(results).toBeDefined();
    expect(results.hypothesisTests).toBeDefined();
    
    // Check if hypothesis tests were performed
    expect(results.hypothesisTests?.length).toBeGreaterThan(0);
  });

  test('Network Analysis', async () => {
    const results = await analysisEngine.analyze('network');
    
    expect(results).toBeDefined();
    expect(results.networkAnalysis).toBeDefined();
    
    const networkResults = results.networkAnalysis as NetworkAnalysisResult;
    const { nodes, edges, metrics } = networkResults;
    
    // Check nodes
    expect(nodes).toHaveLength(3); // One for each numeric field
    expect(nodes[0]).toHaveProperty('id', 'sales');
    expect(nodes[0]).toHaveProperty('connections');
    expect(nodes[0]).toHaveProperty('centrality');
    
    // Check edges
    expect(edges.length).toBeGreaterThan(0);
    expect(edges[0]).toHaveProperty('source');
    expect(edges[0]).toHaveProperty('target');
    expect(edges[0]).toHaveProperty('weight');
    
    // Check metrics
    expect(metrics).toBeDefined();
    expect(metrics).toHaveProperty('density');
    expect(metrics).toHaveProperty('averageConnections');
    expect(metrics).toHaveProperty('strongestConnection');
    expect(metrics).toHaveProperty('centralNodes');
    
    // Verify strongest connection exists between sales and profit
    const strongestPair = new Set(metrics.strongestConnection.nodes);
    expect(strongestPair.has('sales')).toBeTruthy();
    expect(strongestPair.has('profit')).toBeTruthy();
  });

  test('Error Handling - Invalid Data', async () => {
    const invalidData: DataField[] = [
      {
        name: 'invalid',
        type: 'number',
        value: [] // Empty array should trigger error
      }
    ];

    const invalidEngine = new AnalysisEngine(invalidData);
    
    await expect(invalidEngine.analyze()).rejects.toThrow();
  });
}); 