import { DataField } from '@/types/data';
import { determineTrend } from '../statistics/trends';

interface InventoryMetrics {
  turnoverRate: number;
  stockoutRisk: {
    product: string;
    risk: 'high' | 'medium' | 'low';
    daysUntilStockout: number;
    currentStock: number;
    dailySales: number;
    leadTime: number;
  }[];
  optimalRestockLevels: {
    product: string;
    current: number;
    minimum: number;
    optimal: number;
    maximum: number;
  }[];
  averageStockDays: number;
}

interface SalesTrends {
  product: string;
  trend: 'up' | 'down' | 'stable';
  growthRate: number;
  historicalSales: number[];
  forecast: number[];
  averageSales: number;
  salesVariance: number;
  seasonality?: string;
}

interface CustomerSegment {
  segment: string;
  count: number;
  averageSpend: number;
  frequency: number;
  products: string[];
}

interface PricingInsight {
  product: string;
  currentPrice: number;
  optimalPrice: number;
  priceElasticity: number;
  competitorPrice: number;
}

interface PromotionAnalysis {
  promotionId: string;
  name: string;
  uplift: number;
  roi: number;
  redemptions: number;
  cost: number;
}

interface GeographicPerformance {
  location: string;
  sales: number;
  growth: number;
  topProduct: string;
}

export class RetailAnalyzer {
  static analyzeInventory(fields: DataField[]): InventoryMetrics {
    const products = fields.find(f => f.name.toLowerCase().includes('product'))?.value as string[] || [];
    const inventory = fields.find(f => f.name.toLowerCase().includes('inventory'))?.value as number[] || [];
    const sales = fields.find(f => f.name.toLowerCase().includes('sales'))?.value as number[] || [];

    return {
      turnoverRate: this.calculateTurnoverRate(inventory, sales),
      stockoutRisk: this.assessStockoutRisk(products, inventory, sales),
      optimalRestockLevels: this.calculateOptimalRestockLevels(products, inventory, sales),
      averageStockDays: this.calculateAverageStockDays(inventory, sales)
    };
  }

  static analyzeSalesTrends(fields: DataField[]): SalesTrends[] {
    const products = fields.find(f => f.name.toLowerCase().includes('product'))?.value as string[] || [];
    const sales = fields.find(f => f.name.toLowerCase().includes('sales'))?.value as number[] || [];

    if (!products.length || !sales.length) return [];

    const uniqueProducts = [...new Set(products)];
    return uniqueProducts.map(product => {
      const productSales = sales.filter((_, i) => products[i] === product);
      const trend = determineTrend(productSales);
      const growthRate = this.calculateGrowthRate(productSales);
      const seasonality = this.detectSeasonality(productSales);
      const forecast = this.generateSalesForecast(productSales, seasonality);
      const averageSales = this.calculateAverageSales(productSales);
      const salesVariance = this.calculateSalesVariance(productSales);

      return {
        product,
        trend,
        growthRate,
        historicalSales: productSales,
        forecast,
        averageSales,
        salesVariance,
        seasonality: seasonality ? `Every ${seasonality} days` : undefined
      };
    });
  }

  static analyzeCustomerSegments(fields: DataField[]): CustomerSegment[] {
    const customerIds = fields.find(f => f.name.toLowerCase().includes('customer'))?.value as string[] || [];
    const products = fields.find(f => f.name.toLowerCase().includes('product'))?.value as string[] || [];
    const prices = fields.find(f => f.name.toLowerCase().includes('price'))?.value as number[] || [];

    if (!customerIds.length || !products.length) return [];

    const dateField = fields.find(f => f.name.toLowerCase() === 'date');
    const date = dateField ? dateField.value : [];

    // Group transactions by customer
    const customerTransactions = new Map<string, { products: string[], totalSpend: number, dates: string[] }>();
    customerIds.forEach((customerId, i) => {
      if (!customerTransactions.has(customerId)) {
        customerTransactions.set(customerId, { products: [], totalSpend: 0, dates: [] });
      }
      const customer = customerTransactions.get(customerId)!;
      customer.products.push(products[i]);
      customer.totalSpend += prices[i] || 0;
      customer.dates.push(date[i] || '');
    });

    // Calculate customer segments
    const segments: CustomerSegment[] = [];
    const highValueThreshold = 1000; // Example threshold
    const frequentThreshold = 3; // Example threshold

    customerTransactions.forEach((data, _) => {
      const uniqueProducts = [...new Set(data.products)];
      const visitFrequency = this.calculateVisitFrequency(data.dates);
      const averageSpend = data.totalSpend / data.dates.length;

      let segment = '';
      if (averageSpend > highValueThreshold && visitFrequency > frequentThreshold) {
        segment = 'High Value';
      } else if (averageSpend > highValueThreshold) {
        segment = 'Big Spenders';
      } else if (visitFrequency > frequentThreshold) {
        segment = 'Frequent Shoppers';
      } else {
        segment = 'Regular Customers';
      }

      const existingSegment = segments.find(s => s.segment === segment);
      if (existingSegment) {
        existingSegment.count++;
        existingSegment.averageSpend = (existingSegment.averageSpend * (existingSegment.count - 1) + averageSpend) / existingSegment.count;
        existingSegment.frequency = (existingSegment.frequency * (existingSegment.count - 1) + visitFrequency) / existingSegment.count;
        existingSegment.products = [...new Set([...existingSegment.products, ...uniqueProducts])];
      } else {
        segments.push({
          segment,
          count: 1,
          averageSpend,
          frequency: visitFrequency,
          products: uniqueProducts
        });
      }
    });

    return segments;
  }

  static analyzePricing(fields: DataField[]): PricingInsight[] {
    const products = fields.find(f => f.name.toLowerCase().includes('product'))?.value as string[] || [];
    const prices = fields.find(f => f.name.toLowerCase().includes('price'))?.value as number[] || [];
    const sales = fields.find(f => f.name.toLowerCase().includes('sales'))?.value as number[] || [];
    const competitorPrices = fields.find(f => f.name.toLowerCase().includes('competitor'))?.value as number[] || [];

    if (!products.length || !prices.length) return [];

    const uniqueProducts = [...new Set(products)];
    return uniqueProducts.map(product => {
      const productIndices = products.map((p, i) => p === product ? i : -1).filter(i => i !== -1);
      const productPrices = productIndices.map(i => prices[i]);
      const productSales = productIndices.map(i => sales[i]);
      const productCompetitorPrices = productIndices.map(i => competitorPrices[i] || 0);

      const currentPrice = productPrices[productPrices.length - 1] || 0;
      const competitorPrice = productCompetitorPrices[productCompetitorPrices.length - 1] || 0;
      const priceElasticity = this.calculatePriceElasticity(productPrices, productSales);
      const optimalPrice = this.calculateOptimalPrice(currentPrice, priceElasticity, competitorPrice);

      return {
        product,
        currentPrice,
        optimalPrice,
        priceElasticity,
        competitorPrice
      };
    });
  }

  static analyzePromotions(fields: DataField[]): PromotionAnalysis[] {
    const promotionIds = fields.find(f => f.name.toLowerCase().includes('promotion'))?.value as string[] || [];
    const promotionNames = fields.find(f => f.name.toLowerCase().includes('promotion_name'))?.value as string[] || [];
    const sales = fields.find(f => f.name.toLowerCase().includes('sales'))?.value as number[] || [];
    const costs = fields.find(f => f.name.toLowerCase().includes('cost'))?.value as number[] || [];
    const redemptions = fields.find(f => f.name.toLowerCase().includes('redemption'))?.value as number[] || [];

    if (!promotionIds.length) return [];

    const uniquePromotions = [...new Set(promotionIds)];
    return uniquePromotions.map(promoId => {
      const promoIndices = promotionIds.map((id, i) => id === promoId ? i : -1).filter(i => i !== -1);
      const promoName = promotionNames[promoIndices[0]] || promoId;
      const promoSales = promoIndices.map(i => sales[i]);
      const promoCosts = promoIndices.map(i => costs[i]);
      const promoRedemptions = promoIndices.map(i => redemptions[i]);

      const totalCost = promoCosts.reduce((a, b) => a + b, 0);
      const totalRedemptions = promoRedemptions.reduce((a, b) => a + b, 0);
      const uplift = this.calculatePromotionUplift(promoSales);
      const expenses = fields.find(f => f.name.toLowerCase() === 'expenses')?.value as number[] || [];
      const roi = this.calculatePromotionROI(promoSales, totalCost, expenses);

      return {
        promotionId: promoId,
        name: promoName,
        uplift,
        roi,
        redemptions: totalRedemptions,
        cost: totalCost
      };
    });
  }

  static analyzeGeographicPerformance(fields: DataField[]): GeographicPerformance[] {
    const locations = fields.find(f => f.name.toLowerCase().includes('location'))?.value as string[] || [];
    const products = fields.find(f => f.name.toLowerCase().includes('product'))?.value as string[] || [];
    const sales = fields.find(f => f.name.toLowerCase().includes('sales'))?.value as number[] || [];

    if (!locations.length || !products.length) return [];

    const uniqueLocations = [...new Set(locations)];
    return uniqueLocations.map(location => {
      const locationIndices = locations.map((loc, i) => loc === location ? i : -1).filter(i => i !== -1);
      const locationSales = locationIndices.map(i => sales[i]);
      const locationProducts = locationIndices.map(i => products[i]);

      const totalSales = locationSales.reduce((a, b) => a + b, 0);
      const growth = this.calculateGrowthRate(locationSales);
      const topProduct = this.findTopProduct(locationProducts, locationSales);

      return {
        location,
        sales: totalSales,
        growth,
        topProduct
      };
    });
  }

  private static calculateTurnoverRate(inventory: number[], sales: number[]): number {
    if (!inventory?.length || !sales?.length) return 0;
    const avgInventory = inventory.reduce((a, b) => a + b, 0) / inventory.length;
    const totalSales = sales.reduce((a, b) => a + b, 0);
    return totalSales / avgInventory;
  }

  private static assessStockoutRisk(products: string[], inventory: number[], sales: number[]): InventoryMetrics['stockoutRisk'] {
    console.log('Assessing stockout risk with:', { products, inventory, sales });
    
    return products.map((product, i) => {
      const currentStock = inventory[i] || 0;
      const dailySales = (sales[i] || 0) / 30; // Assuming monthly sales
      const leadTime = 7; // Assuming 7 days lead time
      const daysUntilStockout = dailySales > 0 ? currentStock / dailySales : Infinity;
      
      let risk: 'high' | 'medium' | 'low';
      if (daysUntilStockout <= leadTime) {
        risk = 'high';
      } else if (daysUntilStockout <= leadTime * 2) {
        risk = 'medium';
      } else {
        risk = 'low';
      }

      console.log(`Risk assessment for ${product}:`, {
        currentStock,
        dailySales,
        daysUntilStockout,
        risk
      });

      return {
        product,
        risk,
        daysUntilStockout: Math.floor(daysUntilStockout),
        currentStock,
        dailySales,
        leadTime
      };
    });
  }

  private static calculateOptimalRestockLevels(products: string[], inventory: number[], sales: number[]): InventoryMetrics['optimalRestockLevels'] {
    return products.map((product, i) => {
      const current = inventory[i] || 0;
      const dailySales = (sales[i] || 0) / 30; // Assuming monthly sales
      const leadTime = 7; // Assuming 7 days lead time
      const safetyStock = dailySales * leadTime * 0.5; // 50% safety factor
      
      return {
        product,
        current,
        minimum: Math.ceil(safetyStock),
        optimal: Math.ceil(safetyStock * 2),
        maximum: Math.ceil(safetyStock * 3)
      };
    });
  }

  private static calculateAverageStockDays(inventory: number[], sales: number[]): number {
    if (!inventory?.length || !sales?.length) return 0;
    const avgInventory = inventory.reduce((a, b) => a + b, 0) / inventory.length;
    const dailySales = sales.reduce((a, b) => a + b, 0) / (sales.length * 30); // Assuming monthly sales
    return dailySales > 0 ? avgInventory / dailySales : 0;
  }

  private static calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    return ((last - first) / first) * 100;
  }

  private static calculateAverageSales(values: number[]): number {
    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private static calculateSalesVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = this.calculateAverageSales(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  private static detectSeasonality(values: number[]): number | null {
    if (values.length < 8) return null;

    const maxLag = Math.floor(values.length / 2);
    let bestLag = null;
    let bestCorrelation = 0;

    for (let lag = 2; lag <= maxLag; lag++) {
      const correlation = this.calculateAutocorrelation(values, lag);
      if (correlation > bestCorrelation && correlation > 0.7) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }

    return bestLag;
  }

  private static calculateAutocorrelation(values: number[], lag: number): number {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
      denominator += Math.pow(values[i] - mean, 2);
    }

    return numerator / denominator;
  }

  private static generateSalesForecast(values: number[], seasonality: number | null): number[] {
    const forecastLength = 7; // Forecast next 7 days
    const { slope, intercept } = this.calculateTrendComponent(values);
    const forecast: number[] = [];

    for (let i = 0; i < forecastLength; i++) {
      const trendValue = slope * (values.length + i) + intercept;
      const seasonalFactor = seasonality ? 
        values[values.length - seasonality + (i % seasonality)] / 
        this.calculateAverageSales(values) : 1;
      
      forecast.push(trendValue * seasonalFactor);
    }

    return forecast;
  }

  private static calculateTrendComponent(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private static calculateVisitFrequency(dates: string[]): number {
    if (!dates.length) return 0;
    const uniqueDates = [...new Set(dates.map(d => new Date(d).toISOString().split('T')[0]))];
    const firstDate = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
    const lastDate = new Date(Math.max(...dates.map(d => new Date(d).getTime())));
    const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                      (lastDate.getMonth() - firstDate.getMonth());
    return monthsDiff > 0 ? uniqueDates.length / monthsDiff : uniqueDates.length;
  }

  private static calculatePriceElasticity(prices: number[], sales: number[]): number {
    if (prices.length < 2 || sales.length < 2) return 0;
    const priceChanges = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const salesChanges = sales.slice(1).map((sale, i) => (sale - sales[i]) / sales[i]);
    
    let elasticitySum = 0;
    let validPoints = 0;
    
    for (let i = 0; i < priceChanges.length; i++) {
      if (priceChanges[i] !== 0) {
        elasticitySum += salesChanges[i] / priceChanges[i];
        validPoints++;
      }
    }
    
    return validPoints > 0 ? elasticitySum / validPoints : 0;
  }

  private static calculateOptimalPrice(currentPrice: number, elasticity: number, competitorPrice: number): number {
    if (Math.abs(elasticity) <= 1) {
      // Inelastic demand - price closer to competitor
      return competitorPrice > 0 ? (currentPrice + competitorPrice) / 2 : currentPrice;
    } else {
      // Elastic demand - optimize based on elasticity
      const optimalPrice = currentPrice * (1 + 1 / elasticity);
      return competitorPrice > 0 ? Math.min(optimalPrice, competitorPrice * 1.1) : optimalPrice;
    }
  }

  private static calculatePromotionUplift(sales: number[]): number {
    if (sales.length < 2) return 0;
    const baselineSales = sales[0];
    const maxSales = Math.max(...sales);
    return ((maxSales - baselineSales) / baselineSales) * 100;
  }

  private static calculatePromotionROI(sales: number[], cost: number, expenses: number[]): number {
    if (!sales.length || cost === 0) return 0;
    const totalExpenses = expenses.reduce((a: number, b: number) => a + b, 0);
    return ((totalExpenses - cost) / cost) * 100;
  }

  private static findTopProduct(products: string[], sales: number[]): string {
    if (!products.length || !sales.length) return '';
    const productSales = new Map<string, number>();
    products.forEach((product, i) => {
      productSales.set(product, (productSales.get(product) || 0) + (sales[i] || 0));
    });
    return [...productSales.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
}

// --- Reusable Retail Metrics Utility ---
export interface SimpleRetailData {
  Retail_TotalPrice: number;
  Retail_CustomerID: string;
  Retail_Quantity?: number;
  Retail_Discount?: number;
}

export interface RetailMetrics {
  totalRevenue: number;
  totalTransactions: number;
  avgOrderValue: number;
  activeCustomers: number;
}

export function calculateRetailMetrics(data: SimpleRetailData[]): RetailMetrics {
  // 1. Filter only valid retail data
  const filtered = data.filter(item => item.Retail_TotalPrice != null);

  // 2. Apply quantity and discount
  const totalRevenue = filtered.reduce((sum, item) => {
    const price = item.Retail_TotalPrice;
    const discount = item.Retail_Discount ?? 0;
    const qty = item.Retail_Quantity ?? 1;
    return sum + price * (1 - discount) * qty;
  }, 0);

  // 3. Count only those filtered transactions
  const totalTransactions = filtered.length;
  const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // 4. Count unique customer IDs
  const activeCustomers = new Set(filtered.map(item => item.Retail_CustomerID)).size;

  return {
    totalRevenue,
    totalTransactions,
    avgOrderValue,
    activeCustomers,
  };
}