import { buildSeries, seriesSignature } from '../series';
import { holtAuto } from '../holtDynamic';

describe('Time Series Analysis', () => {
  const sampleData = [
    { date: '2024-01-01', sales: 100, productName: 'A', id: 1 },
    { date: '2024-01-01', sales: 150, productName: 'B', id: 2 },
    { date: '2024-01-02', sales: 120, productName: 'A', id: 3 },
    { date: '2024-01-02', sales: 180, productName: 'B', id: 4 },
    { date: '2024-01-03', sales: 110, productName: 'A', id: 5 },
    { date: '2024-01-03', sales: 160, productName: 'B', id: 6 },
  ];

  describe('buildSeries', () => {
    it('should build row-by-row series', () => {
      const result = buildSeries(sampleData, { mode: 'row' });
      
      expect(result.y).toHaveLength(6);
      expect(result.meta.mode).toBe('row');
      expect(result.meta.timeKey).toBe('date');
      expect(result.meta.field).toBe('sales');
    });

    it('should build date-sum series', () => {
      const result = buildSeries(sampleData, { mode: 'date_sum' });
      
      expect(result.y).toHaveLength(3); // 3 unique dates
      expect(result.meta.mode).toBe('date_sum');
      expect(result.y[0]).toBe(250); // 100 + 150 for 2024-01-01
      expect(result.y[1]).toBe(300); // 120 + 180 for 2024-01-02
      expect(result.y[2]).toBe(270); // 110 + 160 for 2024-01-03
    });

    it('should auto-detect time key', () => {
      const dataWithTimestamp = [
        { timestamp: '2024-01-01', value: 100 },
        { timestamp: '2024-01-02', value: 200 },
      ];
      
      const result = buildSeries(dataWithTimestamp, { field: 'value' });
      expect(result.meta.timeKey).toBe('timestamp');
    });

    it('should handle fallback sales calculation', () => {
      const dataWithPriceQuantity = [
        { date: '2024-01-01', price: 10, quantity: 5 },
        { date: '2024-01-02', price: 15, quantity: 3 },
      ];
      
      const result = buildSeries(dataWithPriceQuantity, { field: 'sales' });
      expect(result.y[0]).toBe(50); // 10 * 5
      expect(result.y[1]).toBe(45); // 15 * 3
    });
  });

  describe('seriesSignature', () => {
    it('should generate signature for series', () => {
      const y = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const signature = seriesSignature(y);
      
      expect(signature.n).toBe(10);
      expect(signature.head).toEqual([1, 2, 3, 4, 5]);
      expect(signature.tail).toEqual([6, 7, 8, 9, 10]);
      expect(signature.sum).toBe(55);
    });
  });

  describe('holtAuto', () => {
    it('should perform Holt forecasting', () => {
      const y = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190];
      const result = holtAuto(y, { horizon: 3 });
      
      expect(result.forecast).toHaveLength(3);
      expect(result.fitted).toHaveLength(10);
      expect(result.intervals.lower).toHaveLength(3);
      expect(result.intervals.upper).toHaveLength(3);
      expect(result.metrics).toHaveProperty('MAE');
      expect(result.metrics).toHaveProperty('RMSE');
      expect(result.n).toBe(10);
      expect(result.holdout).toBeGreaterThan(0);
    });

    it('should handle small series', () => {
      const y = [100, 110, 120];
      const result = holtAuto(y, { horizon: 2, useGrid: false });
      
      expect(result.forecast).toHaveLength(2);
      expect(result.alpha).toBe(0.3);
      expect(result.beta).toBe(0.1);
    });

    it('should throw error for insufficient data', () => {
      expect(() => holtAuto([100])).toThrow('Need ≥ 2 points');
    });
  });

  describe('Integration', () => {
    it('should work end-to-end with sample data', () => {
      const { y, meta } = buildSeries(sampleData, { mode: 'date_sum' });
      const signature = seriesSignature(y);
      const forecast = holtAuto(y, { horizon: 2 });
      
      expect(meta.n).toBe(3);
      expect(signature.n).toBe(3);
      expect(forecast.forecast).toHaveLength(2);
      expect(forecast.n).toBe(3);
    });
  });
});
