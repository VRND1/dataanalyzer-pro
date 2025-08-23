import React, { useState, useMemo, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, RefreshCw, Users, Tag, Percent, MapPin, Upload, DollarSign, Eye, BarChart3, Brain, Target,  } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import type { DataField } from '@/types/data';
import { calculateRetailMetrics, RetailAnalyzer } from '@/utils/analysis/industry/retail';
import _ from 'lodash';

// Extend DataField type to include category and date
interface ExtendedDataField extends DataField {
  category?: string;
  date?: string | Date;
  risk?: 'high' | 'medium' | 'low';
  price?: number;
  customerId?: string;
  location?: string;
  promotionId?: string;
  cost?: number;
  discount?: number;
}

interface RetailAnalysisProps {
  data: {
    fields: ExtendedDataField[];
  };
}

// Dashboard specific interfaces
interface DashboardInsights {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalTransactions: number;
  avgOrderValue: number;
  uniqueCustomers: number;
  uniqueProducts: number;
  categoryData: Array<{
    category: string;
    revenue: number;
    profit: number;
    count: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    revenue: number;
    profit: number;
    transactions: number;
  }>;
  regionalData: Array<{
    region: string;
    revenue: number;
    customers: number;
    avgOrderValue: number;
  }>;
  topProducts: Array<{
    product: string;
    revenue: number;
    quantity: number;
    profit: number;
  }>;
  bestSellers: Array<{
    product: string;
    revenue: number;
    qty: number;
    avgDailyUnits: number;
  }>;
  slowMovers: Array<{
    product: string;
    revenue: number;
    qty: number;
    avgDailyUnits: number;
  }>;
}



// Advanced Analytics Interfaces
interface AdvancedAnalytics {
  clv: Array<{
    customer_id: string;
    total_revenue: number;
    avg_order_value: number;
    purchase_frequency: number;
    customer_lifespan_days: number;
    clv: number;
  }>;
  rfm: Array<{
    customer_id: string;
    recency: number;
    frequency: number;
    monetary: number;
    r_score: number;
    f_score: number;
    m_score: number;
    segment: string;
  }>;
  marketBasket: Array<{
    pair: string;
    count: number;
    support: number;
  }>;
  correlations: {
    price_quantity: number;
  };
  churnRisk: Array<any>;
  profitability: Array<any>;
}

interface Anomaly {
  date: string;
  product: string;
  category: string;
  quantity: number;
  price: number;
  customer_id: string;
  region: string;
  cost: number;
  discount: number;
  anomaly_score: number;
  type: 'high_revenue' | 'low_revenue';
}

interface Prediction {
  date: string;
  predicted_revenue: number;
  predicted_units: number;     // NEW
  confidence: number;
}

// Add this helper function near the top (after imports)
function formatNumber(num: number) {
  if (Math.abs(num) >= 1.0e+9)
    return (num / 1.0e+9).toFixed(2) + "B";
  if (Math.abs(num) >= 1.0e+6)
    return (num / 1.0e+6).toFixed(2) + "M";
  if (Math.abs(num) >= 1.0e+3)
    return (num / 1.0e+3).toFixed(2) + "K";
  return num.toLocaleString();
}

export function RetailAnalysis({ data }: RetailAnalysisProps) {
  // Add null check for data
  if (!data || !data.fields) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="text-center text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Retail Data Available</h3>
          <p className="text-sm">Please upload a file with retail data to perform analysis.</p>
        </div>
      </div>
    );
  }

  const [isLoading, setIsLoading] = useState(false);
  const [filters] = useState({
    productCategory: '',
    timePeriod: '30',
    riskThreshold: 'medium',
    customCategory: '',
    customerSegment: '',
    priceSensitivity: 'all',
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'sales' | 'customers' | 'pricing' | 'promotions' | 'geographic' | 'predictions' | 'advanced'>('dashboard');
  

  const [dashboardInsights, setDashboardInsights] = useState<DashboardInsights | null>(null);
  
  // Advanced Analytics state
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  // Debug logging for data structure
  useEffect(() => {
    console.log('RetailAnalysis received data:', {
      hasData: !!data,
      fieldsCount: data?.fields?.length || 0,
      fieldNames: data?.fields?.map(f => f.name) || [],
      sampleValues: data?.fields?.slice(0, 3).map(f => ({
        name: f.name,
        type: f.type,
        valueCount: f.value?.length || 0,
        sampleValue: f.value?.[0]
      })) || []
    });
  }, [data]);

  const filteredData = React.useMemo(() => {
    setIsLoading(true);
    try {
      if (!data?.fields) {
        console.warn('No fields data provided');
        return { fields: [] };
      }

      // First apply category filter if needed
      let fieldsToFilter = data.fields;
      if (filters.productCategory) {
        fieldsToFilter = data.fields.filter(field => 
          field.category && field.category.toLowerCase().includes(filters.productCategory.toLowerCase())
        );
      }

      // Then apply date filtering
      const dateField = fieldsToFilter.find(f => f.type === 'date');
      if (!dateField) {
        setError('No date field found in the data. Please ensure your data includes a date field for analysis.');
        return { fields: [] };
      }

      const timePeriodDays = parseInt(filters.timePeriod);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timePeriodDays);

      const validIndices: number[] = [];
      (dateField.value || []).forEach((dateValue, idx) => {
        try {
          const dateObj = new Date(dateValue);
          if (!isNaN(dateObj.getTime()) && dateObj >= cutoffDate) {
            validIndices.push(idx);
          }
        } catch (e) {
          console.warn('Invalid date value:', dateValue);
        }
      });

      // Filter all fields' value arrays by validIndices
      const filteredFields = fieldsToFilter.map(field => ({
        ...field,
        value: (field.value || []).filter((_, idx) => validIndices.includes(idx))
      }));

      return { fields: filteredFields };
    } catch (err) {
      console.error('Error filtering data:', err);
      setError('Error filtering data');
      return { fields: [] };
    } finally {
      setIsLoading(false);
    }
  }, [data?.fields, filters]);

  // Prepare retailRows for summary metrics
  type RetailRow = {
    Retail_TotalPrice: any;
    Retail_CustomerID: any;
    Retail_Quantity: any;
    Retail_Discount: any;
    Retail_Category: any;
    Retail_TransactionDate: any;
    Retail_Cost?: any;
    Retail_TransactionID?: any;
  };
  const retailRows: RetailRow[] = React.useMemo(() => {
    console.log('Creating retailRows from data fields:', data?.fields?.map(f => f.name));
    
    // Try to find fields with more flexible matching
    const priceField = data?.fields?.find(f => 
      f.name.toLowerCase().includes('price') || 
      f.name.toLowerCase().includes('amount') ||
      f.name.toLowerCase().includes('total')
    );
    const customerField = data?.fields?.find(f => 
      f.name.toLowerCase().includes('customer') || 
      f.name.toLowerCase().includes('customer_id') ||
      f.name.toLowerCase().includes('client')
    );
    const qtyField = data?.fields?.find(f => 
      f.name.toLowerCase().includes('quantity') || 
      f.name.toLowerCase().includes('qty') ||
      f.name.toLowerCase().includes('amount')
    );
    const discountField = data?.fields?.find(f => 
      f.name.toLowerCase().includes('discount') || 
      f.name.toLowerCase().includes('off') ||
      f.name.toLowerCase().includes('reduction')
    );
    const categoryField = data?.fields?.find(f => 
      f.name.toLowerCase().includes('category') || 
      f.name.toLowerCase().includes('product') ||
      f.name.toLowerCase().includes('type')
    );
    const dateField = data?.fields?.find(f => 
      f.type === 'date' || 
      f.name.toLowerCase().includes('date') || 
      f.name.toLowerCase().includes('transaction')
    );
    const costField = data?.fields?.find(f => 
      f.name.toLowerCase().includes('cost') || 
      f.name.toLowerCase().includes('expense')
    );
    const transactionIdField = data?.fields?.find(f => 
      f.name.toLowerCase().includes('transaction') || 
      f.name.toLowerCase().includes('order') ||
      f.name.toLowerCase().includes('id')
    );

    console.log('Found fields for retailRows:', {
      priceField: priceField?.name,
      customerField: customerField?.name,
      qtyField: qtyField?.name,
      discountField: discountField?.name,
      categoryField: categoryField?.name,
      dateField: dateField?.name,
      costField: costField?.name,
      transactionIdField: transactionIdField?.name
    });

    if (!priceField?.value || !customerField?.value || !categoryField?.value || !dateField?.value) {
      console.warn('Missing required fields for retail analysis');
      return [];
    }

    const len = priceField.value.length;
    const rows = Array.from({ length: len }).map((_, i) => ({
      Retail_TotalPrice: parseFloat(priceField.value[i]) || 0,
      Retail_CustomerID: customerField.value[i] || `C${i + 1}`,
      Retail_Quantity: qtyField?.value?.[i] ? parseFloat(qtyField.value[i]) : 1,
      Retail_Discount: discountField?.value?.[i] ? parseFloat(discountField.value[i]) : 0,
      Retail_Category: categoryField.value[i] || 'Unknown',
      Retail_TransactionDate: dateField.value[i] || '',
      Retail_Cost: costField?.value?.[i] ? parseFloat(costField.value[i]) : undefined,
      Retail_TransactionID: transactionIdField?.value?.[i] || `T${i + 1}`,
    }));

    console.log('Created retailRows sample:', rows.slice(0, 3));
    return rows;
  }, [data?.fields]);

  // Use the utility for summary metrics
  const retailMetrics = React.useMemo(() => {
    if (retailRows.length === 0) {
      console.warn('No retail rows available for metrics calculation');
      return null;
    }
    try {
      const metrics = calculateRetailMetrics(retailRows);
      console.log('Calculated retail metrics:', metrics);
      return metrics;
    } catch (err) {
      console.error('Error calculating retail metrics:', err);
      return null;
    }
  }, [retailRows]);

  // Analyze the filtered data
  const inventory = React.useMemo(() => {
    try {
      console.log('Analyzing inventory with fields:', filteredData.fields);
      const result = RetailAnalyzer.analyzeInventory(filteredData.fields);
      console.log('Initial stockout risk items:', result.stockoutRisk);
      
      // Apply risk threshold filter to stockout risk items
      if (filters.riskThreshold) {
        console.log('Applying risk threshold filter:', filters.riskThreshold);
        const filteredRiskItems = result.stockoutRisk.filter(item => {
          const shouldInclude = 
            filters.riskThreshold === 'high' ? item.risk === 'high' :
            filters.riskThreshold === 'medium' ? ['high', 'medium'].includes(item.risk) :
            true;
          console.log(`Item ${item.product} with risk ${item.risk} - should include: ${shouldInclude}`);
          return shouldInclude;
        });
        console.log('Filtered risk items:', filteredRiskItems);
        result.stockoutRisk = filteredRiskItems;
      }
      
      return result;
    } catch (err) {
      console.error('Error analyzing inventory:', err);
      setError('Error analyzing inventory');
      return {
        turnoverRate: 0,
        stockoutRisk: [],
        optimalRestockLevels: [],
        averageStockDays: 0
      };
    }
  }, [filteredData.fields, filters.riskThreshold]);

  const salesTrends = React.useMemo(() => {
    try {
      console.log('Analyzing sales trends with fields:', filteredData.fields);
      const trends = RetailAnalyzer.analyzeSalesTrends(filteredData.fields);
      console.log('Sales trends result:', trends);
      return trends;
    } catch (err) {
      console.error('Error analyzing sales trends:', err);
      setError('Error analyzing sales trends');
      return [];
    }
  }, [filteredData.fields]);

  // Add debug logging for the current filters state
  React.useEffect(() => {
    console.log('Current filters state:', filters);
  }, [filters]);

  // Add debug logging for the inventory state
  React.useEffect(() => {
    console.log('Current inventory state:', inventory);
  }, [inventory]);

  // New analytics features
  const customerSegments = React.useMemo(() => {
    try {
      const segments = RetailAnalyzer.analyzeCustomerSegments(filteredData.fields);
      return segments.reduce((acc, segment) => {
        acc[segment.segment] = segment;
        return acc;
      }, {} as Record<string, any>);
    } catch (err) {
      console.error('Error analyzing customer segments:', err);
      return {};
    }
  }, [filteredData.fields]);

  const pricingInsights = React.useMemo(() => {
    try {
      const insights = RetailAnalyzer.analyzePricing(filteredData.fields);
      const insightsMap = insights.reduce((acc, insight) => {
        acc[insight.product] = insight;
        return acc;
      }, {} as Record<string, any>);
      
      if (filters.priceSensitivity !== 'all') {
        return Object.fromEntries(Object.entries(insightsMap).filter(([, insight]) => {
          const sensitivity = Math.abs(insight.priceElasticity) > 1 ? 'high' : 'low';
          return sensitivity === filters.priceSensitivity;
        }));
      }
      
      return insightsMap;
    } catch (err) {
      console.error('Error analyzing pricing:', err);
      return {};
    }
  }, [filteredData.fields, filters.priceSensitivity]);

  const promotionAnalysis = React.useMemo(() => {
    try {
      const promotions = RetailAnalyzer.analyzePromotions(filteredData.fields);
      return promotions.reduce((acc, promo) => {
        acc[promo.promotionId] = promo;
        return acc;
      }, {} as Record<string, any>);
    } catch (err) {
      console.error('Error analyzing promotions:', err);
      return {};
    }
  }, [filteredData.fields]);

  const geographicPerformance = React.useMemo(() => {
    try {
      console.log('Analyzing geographic performance with fields:', filteredData.fields);
      if (!filteredData.fields || filteredData.fields.length === 0) {
        console.warn('No fields data available for geographic analysis');
        return [];
      }
      const result = RetailAnalyzer.analyzeGeographicPerformance(filteredData.fields);
      console.log('Geographic performance result:', result);
      return result;
    } catch (err) {
      console.error('Error analyzing geographic performance:', err);
      setError('Error analyzing geographic performance');
      return [];
    }
  }, [filteredData.fields]);

  // Generate dashboard insights
  const generateDashboardInsights = useMemo((): DashboardInsights | null => {
    if (!retailRows.length) {
      console.warn('No retail rows available for dashboard insights');
      return null;
    }

    try {
      console.log('Generating dashboard insights from', retailRows.length, 'rows');
      
      // Use retailMetrics if available, otherwise calculate manually
      const metrics = retailMetrics || {
        totalRevenue: retailRows.reduce((sum, row) => {
          const price = parseFloat(row.Retail_TotalPrice) || 0;
          const discount = parseFloat(row.Retail_Discount) || 0;
          const quantity = parseFloat(row.Retail_Quantity) || 1;
          return sum + price * (1 - discount) * quantity;
        }, 0),
        totalTransactions: retailRows.length,
        avgOrderValue: 0,
        activeCustomers: new Set(retailRows.map(row => row.Retail_CustomerID)).size
      };

      // Calculate avgOrderValue if not provided
      if (!metrics.avgOrderValue) {
        metrics.avgOrderValue = metrics.totalRevenue / metrics.totalTransactions;
      }

      const totalRevenue = metrics.totalRevenue;
      const totalCost = retailRows.reduce((sum, row) => {
        const price = parseFloat(row.Retail_TotalPrice) || 0;
        const cost = row.Retail_Cost !== undefined ? parseFloat(row.Retail_Cost) || 0 : price * 0.6;
        const quantity = parseFloat(row.Retail_Quantity) || 1;
        return sum + cost * quantity;
      }, 0);

      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // Unique customers and products
      const uniqueCustomers = metrics.activeCustomers;
      const uniqueProducts = new Set(retailRows.map(row => row.Retail_Category)).size;

      // Category analysis
      const categoryData = _.chain(retailRows)
        .groupBy('Retail_Category')
        .map((items, category) => ({
          category,
          revenue: items.reduce((sum, item) => {
            const price = parseFloat(item.Retail_TotalPrice) || 0;
            const discount = parseFloat(item.Retail_Discount) || 0;
            const quantity = parseFloat(item.Retail_Quantity) || 1;
            return sum + price * (1 - discount) * quantity;
          }, 0),
          profit: items.reduce((sum, item) => {
            const price = parseFloat(item.Retail_TotalPrice) || 0;
            const discount = parseFloat(item.Retail_Discount) || 0;
            const quantity = parseFloat(item.Retail_Quantity) || 1;
            const cost = item.Retail_Cost !== undefined ? parseFloat(item.Retail_Cost) || 0 : price * 0.6;
            const revenue = price * (1 - discount) * quantity;
            return sum + (revenue - (cost * quantity));
          }, 0),
          count: items.length
        }))
        .orderBy('revenue', 'desc')
        .value();

      // Time series data
      const timeSeriesData = _.chain(retailRows)
        .groupBy('Retail_TransactionDate')
        .map((items, date) => ({
          date,
          revenue: items.reduce((sum, item) => {
            const price = parseFloat(item.Retail_TotalPrice) || 0;
            const discount = parseFloat(item.Retail_Discount) || 0;
            const quantity = parseFloat(item.Retail_Quantity) || 1;
            return sum + price * (1 - discount) * quantity;
          }, 0),
          profit: items.reduce((sum, item) => {
            const price = parseFloat(item.Retail_TotalPrice) || 0;
            const discount = parseFloat(item.Retail_Discount) || 0;
            const quantity = parseFloat(item.Retail_Quantity) || 1;
            const cost = item.Retail_Cost !== undefined ? parseFloat(item.Retail_Cost) || 0 : price * 0.6;
            const revenue = price * (1 - discount) * quantity;
            return sum + (revenue - (cost * quantity));
          }, 0),
          transactions: items.length
        }))
        .orderBy('date')
        .value();

      // Product level performance
      const productAgg = _.chain(retailRows)
        .groupBy('Retail_Category') // treat "category/product" field as product label here
        .map((items, product) => {
          const revenue = items.reduce((s, it) => {
            const p = parseFloat(it.Retail_TotalPrice) || 0;
            const d = parseFloat(it.Retail_Discount) || 0;
            const q = parseFloat(it.Retail_Quantity) || 1;
            return s + p * (1 - d) * q;
          }, 0);
          const qty = items.reduce((s, it) => s + (parseFloat(it.Retail_Quantity) || 0), 0);

          // Avg daily sales across the timespan covered by the data
          const daysCovered = Math.max(
            1,
            new Set(items.map(it => String(it.Retail_TransactionDate))).size
          );
          const avgDailyUnits = qty / daysCovered;

          return { product, revenue, qty, avgDailyUnits };
        })
        .orderBy('revenue', 'desc')
        .value();

      const bestSellers = productAgg.slice(0, 5);
      const slowMovers = _.orderBy(productAgg, 'avgDailyUnits', 'asc').slice(0, 5);

      // Regional analysis (if you have region info in retailRows, adapt as needed)
      const regionalData: any[] = [];
      // Top products mapped from productAgg
      const topProducts = productAgg.map(p => ({
        product: p.product,
        revenue: p.revenue,
        quantity: p.qty,
        profit: 0 // optional: compute if you want
      }));

      const insights = {
        totalRevenue: totalRevenue,
        totalCost: totalCost,
        totalProfit: totalProfit,
        profitMargin: profitMargin,
        totalTransactions: metrics.totalTransactions,
        avgOrderValue: metrics.avgOrderValue,
        uniqueCustomers: uniqueCustomers,
        uniqueProducts: uniqueProducts,
        categoryData: categoryData,
        timeSeriesData: timeSeriesData,
        regionalData: regionalData,
        topProducts: topProducts,
        bestSellers: bestSellers,
        slowMovers: slowMovers
      };

      console.log('Generated dashboard insights:', insights);
      return insights;
    } catch (err) {
      console.error('Error generating dashboard insights:', err);
      return null;
    }
  }, [retailRows, retailMetrics]);

  // Update dashboard insights when data changes
  useEffect(() => {
    setDashboardInsights(generateDashboardInsights);
    if (generateDashboardInsights && retailRows.length > 0) {
      performAdvancedAnalytics(retailRows);
    }
  }, [generateDashboardInsights, retailRows]);



  // Advanced Analytics Functions
  const calculateCorrelation = (data: any[], field1: string, field2: string) => {
    const values1 = data.map(d => parseFloat(d[field1]) || 0);
    const values2 = data.map(d => parseFloat(d[field2]) || 0);
    
    const mean1 = _.mean(values1);
    const mean2 = _.mean(values2);
    
    const numerator = _.sum(values1.map((v1, i) => (v1 - mean1) * (values2[i] - mean2)));
    const denominator = Math.sqrt(
      _.sum(values1.map(v => Math.pow(v - mean1, 2))) * 
      _.sum(values2.map(v => Math.pow(v - mean2, 2)))
    );
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const detectAnomalies = (data: any[]) => {
    const revenues = data.map(d => {
      const discount = parseFloat(d.discount) || 0;
      return parseFloat(d.price) * (1 - discount) * parseInt(d.quantity);
    });
    const mean = _.mean(revenues);
    const stdDev = Math.sqrt(_.mean(revenues.map(r => Math.pow(r - mean, 2))));
    
    return data.filter((_, i) => {
      const revenue = revenues[i];
      return Math.abs(revenue - mean) > 2 * stdDev;
    }).map((d) => {
      const discount = parseFloat(d.discount) || 0;
      const revenue = parseFloat(d.price) * (1 - discount) * parseInt(d.quantity);
      return {
        ...d,
        anomaly_score: Math.abs(revenue - mean) / stdDev,
        type: revenue > mean ? 'high_revenue' : 'low_revenue'
      };
    });
  };

  const calculateCustomerLifetimeValue = (data: any[]) => {
    return _.chain(data)
      .groupBy('customer_id')
      .map((transactions, customerId) => {
        const totalRevenue = transactions.reduce((sum, t) => {
          const discount = parseFloat(t.discount) || 0;
          return sum + (parseFloat(t.price) * (1 - discount) * parseInt(t.quantity));
        }, 0);
        const avgOrderValue = totalRevenue / transactions.length;
        const purchaseFrequency = transactions.length;
        const firstPurchase = _.minBy(transactions, 'date')?.date;
        const lastPurchase = _.maxBy(transactions, 'date')?.date;
        
        return {
          customer_id: customerId,
          total_revenue: totalRevenue,
          avg_order_value: avgOrderValue,
          purchase_frequency: purchaseFrequency,
          customer_lifespan_days: firstPurchase && lastPurchase ? 
            Math.max(1, (new Date(lastPurchase).getTime() - new Date(firstPurchase).getTime()) / (1000 * 60 * 60 * 24)) : 1,
          clv: totalRevenue * (purchaseFrequency / Math.max(1, (new Date(lastPurchase).getTime() - new Date(firstPurchase).getTime()) / (1000 * 60 * 60 * 24) || 1))
        };
      })
      .orderBy('clv', 'desc')
      .value();
  };

  const performRFMAnalysis = (data: any[]) => {
    const today = new Date();
    const customerMetrics = _.chain(data)
      .groupBy('customer_id')
      .map((transactions, customerId) => {
        const recency = Math.min(...transactions.map(t => Math.floor((today.getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24))));
        const frequency = transactions.length;
        const monetary = transactions.reduce((sum, t) => {
          const discount = parseFloat(t.discount) || 0;
          return sum + (parseFloat(t.price) * (1 - discount) * parseInt(t.quantity));
        }, 0);
        
        return { customer_id: customerId, recency, frequency, monetary };
      })
      .value();

    // Calculate quintiles for scoring
    const recencyQuintiles = _.chunk(_.sortBy(customerMetrics, 'recency'), Math.ceil(customerMetrics.length / 5));
    const frequencyQuintiles = _.chunk(_.sortBy(customerMetrics, 'frequency').reverse(), Math.ceil(customerMetrics.length / 5));
    const monetaryQuintiles = _.chunk(_.sortBy(customerMetrics, 'monetary').reverse(), Math.ceil(customerMetrics.length / 5));

    return customerMetrics.map(customer => {
      const rScore = recencyQuintiles.findIndex(quintile => quintile.some(c => c.customer_id === customer.customer_id)) + 1;
      const fScore = frequencyQuintiles.findIndex(quintile => quintile.some(c => c.customer_id === customer.customer_id)) + 1;
      const mScore = monetaryQuintiles.findIndex(quintile => quintile.some(c => c.customer_id === customer.customer_id)) + 1;
      
      let segment = 'At Risk';
      if (rScore >= 4 && fScore >= 4 && mScore >= 4) segment = 'Champions';
      else if (rScore >= 3 && fScore >= 3 && mScore >= 3) segment = 'Loyal Customers';
      else if (rScore >= 4 && fScore <= 2) segment = 'New Customers';
      else if (rScore <= 2 && fScore >= 3) segment = 'At Risk';
      else if (rScore <= 2 && fScore <= 2) segment = 'Lost Customers';

      return { ...customer, r_score: rScore, f_score: fScore, m_score: mScore, segment };
    });
  };

  const calculateMarketBasketAnalysis = (data: any[]) => {
    const transactions = _.groupBy(data, 'customer_id');
    const itemPairs: string[] = [];
    
    Object.values(transactions).forEach(customerTransactions => {
      const items = customerTransactions.map(t => t.product);
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          itemPairs.push([items[i], items[j]].sort().join(' + '));
        }
      }
    });

    return _.chain(itemPairs)
      .countBy()
      .toPairs()
      .map(([pair, count]) => ({ pair, count, support: count / Object.keys(transactions).length }))
      .orderBy('count', 'desc')
      .take(10)
      .value();
  };

  const generatePredictions = (data: any[]) => {
    // Aggregate daily totals
    const timeSeriesData = _.chain(data)
      .groupBy('date')
      .map((items, date) => ({
        date,
        revenue: items.reduce((sum, item) => {
          const discount = parseFloat(item.discount) || 0;
          return sum + (parseFloat(item.price) * (1 - discount) * parseInt(item.quantity));
        }, 0),
        units: items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0),
        dayIndex: Math.floor(
          (new Date(date).getTime() - new Date(_.minBy(data, 'date')?.date || '').getTime()) /
          (1000 * 60 * 60 * 24)
        )
      }))
      .orderBy('date')
      .value();

    if (timeSeriesData.length < 2) return [];

    // Helper: simple linear regression
    const linReg = (ys: number[]) => {
      const n = timeSeriesData.length;
      const sumX = _.sumBy(timeSeriesData, 'dayIndex');
      const sumY = _.sum(ys);
      const sumXY = _.sum(timeSeriesData.map((d, i) => d.dayIndex * ys[i]));
      const sumX2 = _.sumBy(timeSeriesData, d => d.dayIndex * d.dayIndex);
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      return { slope, intercept };
    };

    const { slope: rSlope, intercept: rInt } = linReg(timeSeriesData.map(d => d.revenue));
    const { slope: uSlope, intercept: uInt } = linReg(timeSeriesData.map(d => d.units));

    // Predict next 7 days
    const lastDay = _.maxBy(timeSeriesData, 'dayIndex')?.dayIndex || 0;
    const lastDate = new Date(_.maxBy(timeSeriesData, 'date')?.date || Date.now());

    const preds: Prediction[] = [];
    for (let i = 1; i <= 7; i++) {
      const futureDay = lastDay + i;
      const futureDate = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000);
      preds.push({
        date: futureDate.toISOString().split('T')[0],
        predicted_revenue: Math.max(0, rSlope * futureDay + rInt),
        predicted_units: Math.max(0, uSlope * futureDay + uInt), // NEW
        confidence: Math.max(0.1, 1 - i * 0.1)
      });
    }

    return preds;
  };

  const performAdvancedAnalytics = (rawData: any[]) => {
    console.log('Performing advanced analytics on', rawData.length, 'rows');
    
    try {
      // Transform retailRows to the format expected by analytics functions
      const transformedData = rawData.map(row => ({
        date: row.Retail_TransactionDate,
        product: row.Retail_Category,
        price: parseFloat(row.Retail_TotalPrice) || 0,
        quantity: parseFloat(row.Retail_Quantity) || 1,
        discount: parseFloat(row.Retail_Discount) || 0,
        customer_id: row.Retail_CustomerID,
        cost: row.Retail_Cost !== undefined ? parseFloat(row.Retail_Cost) : parseFloat(row.Retail_TotalPrice) * 0.6
      }));

      const clvAnalysis = calculateCustomerLifetimeValue(transformedData);
      const rfmAnalysis = performRFMAnalysis(transformedData);
      const marketBasket = calculateMarketBasketAnalysis(transformedData);
      const priceQuantityCorr = calculateCorrelation(transformedData, 'price', 'quantity');
      const anomalyData = detectAnomalies(transformedData);
      const forecastData = generatePredictions(transformedData);

      console.log('Advanced analytics results:', {
        clvCount: clvAnalysis.length,
        rfmCount: rfmAnalysis.length,
        marketBasketCount: marketBasket.length,
        anomaliesCount: anomalyData.length,
        predictionsCount: forecastData.length
      });

      setAdvancedAnalytics({
        clv: clvAnalysis,
        rfm: rfmAnalysis,
        marketBasket,
        correlations: {
          price_quantity: priceQuantityCorr
        },
        churnRisk: rfmAnalysis.filter(c => c.segment === 'At Risk' || c.segment === 'Lost Customers'),
        profitability: transformedData.map(d => ({
          ...d,
          profit: (d.price * (1 - d.discount) * d.quantity) - (d.cost * d.quantity),
          margin: ((d.price * (1 - d.discount) - d.cost) / d.price) * 100
        }))
      });

      setAnomalies(anomalyData);
      setPredictions(forecastData);
    } catch (err) {
      console.error('Error performing advanced analytics:', err);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-medium">Error Loading Analysis</h3>
        </div>
        <p className="text-sm mt-2">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-3 text-sm text-teal-600 hover:text-teal-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'dashboard' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Dashboard
            </div>
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'predictions' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Predictions
            </div>
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'advanced' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Advanced
            </div>
          </button>
        </div>
      </div>

      {/* Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          {dashboardInsights && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Total Revenue</p>
                    <p className="text-xl font-bold text-gray-900 mt-1 break-words truncate max-w-[160px]">
                      ${formatNumber(dashboardInsights.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Net of discounts</p>
                  </div>
                  <div className="bg-green-500 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 text-sm font-medium">Total Profit</p>
                    <p className="text-xl font-bold text-gray-900 mt-1 break-words truncate max-w-[160px]">
                      ${formatNumber(dashboardInsights.totalProfit)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{dashboardInsights.profitMargin.toFixed(1)}% margin</p>
                  </div>
                  <div className="bg-emerald-500 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Transactions</p>
                    <p className="text-xl font-bold text-gray-900 mt-1 break-words truncate max-w-[160px]">
                      {formatNumber(dashboardInsights.totalTransactions)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total orders</p>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Avg Order Value</p>
                    <p className="text-xl font-bold text-gray-900 mt-1 break-words truncate max-w-[160px]">
                      ${formatNumber(dashboardInsights.avgOrderValue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Per transaction</p>
                  </div>
                  <div className="bg-purple-500 p-3 rounded-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Active Customers</p>
                    <p className="text-xl font-bold text-gray-900 mt-1 break-words truncate max-w-[160px]">
                      {formatNumber(dashboardInsights.uniqueCustomers)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{advancedAnalytics?.churnRisk?.length || 0} at risk</p>
                  </div>
                  <div className="bg-orange-500 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reorder Alerts */}
          {inventory?.stockoutRisk?.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                <div className="text-sm">
                  <strong>{inventory.stockoutRisk.length}</strong> products need reorder attention.
                  <span className="ml-2">Check Inventory tab → Stockout Risk.</span>
                </div>
              </div>
            </div>
          )}

          {/* Product Performance: Best Sellers & Slow Movers */}
          {dashboardInsights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Best Sellers (by revenue)</h3>
                <ul className="space-y-3">
                  {dashboardInsights.bestSellers?.map((p:any, i:number) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="font-medium">{p.product}</span>
                      <span>${p.revenue.toFixed(2)} · {p.qty.toLocaleString()} units</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Slow Movers (avg daily units)</h3>
                <ul className="space-y-3">
                  {dashboardInsights.slowMovers?.map((p:any, i:number) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="font-medium">{p.product}</span>
                      <span>{p.avgDailyUnits.toFixed(2)} units/day</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Anomaly Detection Alert */}
          {anomalies.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3" />
                <div>
                  <h3 className="font-semibold">Anomaly Detection Alert</h3>
                  <p className="text-sm opacity-90">
                    {anomalies.length} unusual transactions detected. Review the Advanced Analytics tab for details.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          {dashboardInsights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Revenue by Category</h3>
                <div className="h-64">
                  <Pie
                    data={{
                      labels: dashboardInsights.categoryData.map(item => item.category),
                      datasets: [{
                        data: dashboardInsights.categoryData.map(item => item.revenue),
                        backgroundColor: [
                          'rgba(13, 148, 136, 0.7)',
                          'rgba(249, 168, 37, 0.7)',
                          'rgba(220, 38, 38, 0.7)',
                          'rgba(139, 92, 246, 0.7)',
                          'rgba(20, 184, 166, 0.7)'
                        ],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => `$${context.parsed.toLocaleString()}`
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Daily Revenue Trend</h3>
                <div className="h-64">
                  <Line
                    data={{
                      labels: dashboardInsights.timeSeriesData.map(item => item.date),
                      datasets: [{
                        label: 'Revenue',
                        data: dashboardInsights.timeSeriesData.map(item => item.revenue),
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => `$${context.parsed.y.toLocaleString()}`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => `$${Number(value).toLocaleString()}`
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Top Products and Regional Performance */}
          {dashboardInsights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Products by Revenue</h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: dashboardInsights.topProducts.map(item => item.product),
                      datasets: [{
                        label: 'Revenue',
                        data: dashboardInsights.topProducts.map(item => item.revenue),
                        backgroundColor: 'rgba(139, 92, 246, 0.7)',
                        borderColor: 'rgba(139, 92, 246, 1)',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => `$${context.parsed.y.toLocaleString()}`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => `$${Number(value).toLocaleString()}`
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Regional Performance</h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: dashboardInsights.regionalData.map(item => item.region),
                      datasets: [{
                        label: 'Revenue',
                        data: dashboardInsights.regionalData.map(item => item.revenue),
                        backgroundColor: 'rgba(249, 168, 37, 0.7)',
                        borderColor: 'rgba(249, 168, 37, 1)',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => `$${context.parsed.y.toLocaleString()}`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => `$${Number(value).toLocaleString()}`
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Insights Summary */}
          {dashboardInsights && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">Data Science Insights & Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <h4 className="font-medium mb-2">💰 Financial Health</h4>
                  <p className="text-sm opacity-90">
                    ${dashboardInsights.totalProfit.toLocaleString()} profit with {dashboardInsights.profitMargin.toFixed(1)}% margin
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <h4 className="font-medium mb-2">🎯 Customer Intelligence</h4>
                  <p className="text-sm opacity-90">
                    {(advancedAnalytics?.churnRisk?.length || 0)} customers at risk of churning
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <h4 className="font-medium mb-2">📊 Data Quality</h4>
                  <p className="text-sm opacity-90">
                    {anomalies.length} anomalies detected requiring attention
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <h4 className="font-medium mb-2">🔮 Forecasting</h4>
                  <p className="text-sm opacity-90">
                    Next 7 days: ${(predictions.reduce((sum, p) => sum + p.predicted_revenue, 0)).toLocaleString()} predicted
                  </p>
                  <p className="text-sm opacity-90">
                    Next 7 days units: {
                      predictions.reduce((s,p)=> s + (p.predicted_units || 0), 0).toLocaleString()
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {!dashboardInsights && (
            <div className="text-center py-12 text-gray-500">
              <div className="mb-4">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Analysis Insights Available</h3>
              <p className="text-sm mb-4">Unable to generate insights from the provided data</p>
              
              {/* Debug information */}
              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto text-left">
                <h4 className="font-medium text-gray-700 mb-2">Debug Information:</h4>
                <div className="text-xs space-y-1">
                  <div>Data fields: {data?.fields?.length || 0}</div>
                  <div>Retail rows: {retailRows.length}</div>
                  <div>Retail metrics: {retailMetrics ? 'Available' : 'Not available'}</div>
                  <div>Field names: {data?.fields?.map(f => f.name).join(', ') || 'None'}</div>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-gray-400">
                <p>Make sure your data contains fields with names like:</p>
                <p>• price, amount, total (for pricing data)</p>
                <p>• customer, customer_id (for customer data)</p>
                <p>• date, transaction_date (for date data)</p>
                <p>• category, product (for product data)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Management */}
      {activeTab === 'inventory' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Inventory Management</h3>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredData.fields.length} of {data.fields.length} items
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2 text-black">Turnover Rate</h4>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-black">
                  {((inventory && inventory.turnoverRate) || 0).toFixed(2)}x
                </span>
                <span className="text-sm text-gray-500 mb-1 text-black">per period</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2 text-black">Stockout Risk Items</h4>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-black">
                  {(inventory && inventory.stockoutRisk && inventory.stockoutRisk.length) || 0}
                </span>
                <span className="text-sm text-gray-500 mb-1 text-black">
                  {(((inventory && inventory.stockoutRisk && inventory.stockoutRisk.length) || 0) / (filteredData.fields.length || 1) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2 text-black">Avg. Stock Days</h4>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-black">
                  {((inventory && inventory.averageStockDays) || 0).toFixed(1)}
                </span>
                <span className="text-sm text-gray-500 mb-1 text-black">days remaining</span>
              </div>
            </div>
          </div>

          {/* Stockout Risk */}
          {inventory.stockoutRisk.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-gray-900 text-black">Stockout Risk Analysis</h4>
                <div className="text-xs text-gray-500">
                  Showing {filters.riskThreshold} risk items
                </div>
              </div>
              <div className="grid gap-4">
                {inventory.stockoutRisk.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      item.risk === 'high'
                        ? 'border-red-200 bg-red-50'
                        : item.risk === 'medium'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900 text-black">{item.product}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.risk === 'high'
                          ? 'bg-red-100 text-red-700'
                          : item.risk === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.risk.toUpperCase()} RISK
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Current Stock:</span> {item.currentStock}
                      </div>
                      <div>
                        <span className="font-medium">Daily Sales:</span> {item.dailySales.toFixed(1)}
                      </div>
                      <div>
                        <span className="font-medium">Days Until Stockout:</span> {item.daysUntilStockout}
                      </div>
                      <div>
                        <span className="font-medium">Lead Time:</span> {item.leadTime} days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimal Restock Levels */}
          {inventory.optimalRestockLevels.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 text-black">Recommended Stock Levels</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Minimum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Optimal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventory.optimalRestockLevels.map((level, index) => {
                      const status = 
                        level.current < level.minimum ? 'Understocked' :
                        level.current > level.maximum ? 'Overstocked' : 'Optimal';
                      
                      const statusColor = 
                        status === 'Understocked' ? 'text-red-600' :
                        status === 'Overstocked' ? 'text-yellow-600' : 'text-green-600';
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {level.product}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {level.current}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {level.minimum}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {level.optimal}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${statusColor}`}>
                            {status}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales Trends */}
      {activeTab === 'sales' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Sales Trends</h3>
            </div>
            <div className="text-sm text-gray-500">
              Last {filters.timePeriod} days analysis
            </div>
          </div>

          {salesTrends.length > 0 ? (
            <div className="grid gap-6">
              {salesTrends.map((trend, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 text-black">{trend?.product || 'Unknown Product'}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        trend?.trend === 'up' ? 'text-green-600' :
                        trend?.trend === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {((trend?.growthRate || 0) > 0 ? '+' : '') + (trend?.growthRate || 0).toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500">
                        vs previous {parseInt(filters.timePeriod)/2} days
                      </span>
                    </div>
                  </div>

                  {/* Sales Forecast Chart */}
                  <div className="h-48 mb-4">
                    <Line
                      data={{
                        labels: [
                          ...(trend?.historicalSales || []).map((_, i) => `Day ${i + 1}`),
                          ...(trend?.forecast || []).map((_, i) => `F ${i + 1}`)
                        ],
                        datasets: [
                          {
                            label: 'Historical Sales',
                            data: trend?.historicalSales || [],
                            borderColor: 'rgb(156, 163, 175)',
                            backgroundColor: 'rgba(156, 163, 175, 0.1)',
                            borderDash: [5, 5],
                            tension: 0.1
                          },
                          {
                            label: 'Forecast',
                            data: [
                              ...Array((trend?.historicalSales || []).length).fill(null),
                              ...(trend?.forecast || [])
                            ],
                            borderColor: 'rgb(13, 148, 136)',
                            backgroundColor: 'rgba(13, 148, 136, 0.1)',
                            fill: true,
                            tension: 0.4
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: false
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Avg. Daily Sales:</span> {(trend?.averageSales || 0).toFixed(1)}
                    </div>
                    <div>
                      <span className="font-medium">Sales Variance:</span> {(trend?.salesVariance || 0).toFixed(1)}
                    </div>
                    {trend?.seasonality && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          Seasonal pattern: {trend?.seasonality}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No sales trend data available for the selected filters
            </div>
          )}
        </div>
      )}

      {/* Customer Analytics */}
      {activeTab === 'customers' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Customer Analytics</h3>
            </div>
            <div className="text-sm text-gray-500">
              {Object.values(customerSegments).length} segments identified
            </div>
          </div>

          {/* RFM Spotlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg p-4 bg-emerald-50 border border-emerald-200">
              <div className="text-sm text-emerald-700 font-medium">Champions</div>
              <div className="text-2xl font-bold text-emerald-900">
                {advancedAnalytics?.rfm?.filter(r => r.segment === 'Champions').length || 0}
              </div>
              <div className="text-xs text-emerald-700/80 mt-1">Buy often & spend more</div>
            </div>
            <div className="rounded-lg p-4 bg-orange-50 border border-orange-200">
              <div className="text-sm text-orange-700 font-medium">At Risk (no purchase in 30 days)</div>
              <div className="text-2xl font-bold text-orange-900">
                {advancedAnalytics?.rfm?.filter(r => r.segment === 'At Risk' || r.segment === 'Lost Customers').length || 0}
              </div>
              <div className="text-xs text-orange-700/80 mt-1">Reach out with offers</div>
            </div>
          </div>

          {Object.values(customerSegments).length > 0 ? (
            <div className="grid gap-8">
              {/* Customer Segments Overview */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Customer Segments</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Segments Distribution</h5>
                    <div className="h-64">
                      <Pie
                        data={{
                          labels: Object.values(customerSegments).map(seg => seg.segment),
                          datasets: [{
                            data: Object.values(customerSegments).map(seg => seg.count),
                            backgroundColor: [
                              'rgba(13, 148, 136, 0.7)',
                              'rgba(249, 168, 37, 0.7)',
                              'rgba(220, 38, 38, 0.7)',
                              'rgba(139, 92, 246, 0.7)',
                              'rgba(20, 184, 166, 0.7)'
                            ],
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Segment Metrics</h5>
                    <div className="space-y-4">
                      {Object.values(customerSegments).map((segment, index) => (
                        <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{segment.segment}</span>
                            <span className="text-sm text-gray-500">{segment.count} customers</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Avg. Spend:</span> ${segment.averageSpend.toFixed(2)}
                            </div>
                            <div>
                              <span className="text-gray-500">Frequency:</span> {segment.frequency.toFixed(1)}/month
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Top Products by Segment</h5>
                    <div className="space-y-4">
                      {Object.values(customerSegments).map((segment, index) => (
                        <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                          <div className="font-medium mb-1">{segment.segment}</div>
                          <div className="flex flex-wrap gap-1">
                            {segment.products.slice(0, 5).map((product: string, pIndex: number) => (
                              <span key={pIndex} className="text-xs bg-gray-200 px-2 py-1 rounded">
                                {product}
                              </span>
                            ))}
                            {segment.products.length > 5 && (
                              <span className="text-xs text-gray-500">+{segment.products.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Lifetime Value */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Customer Value Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Spending Distribution</h5>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: Object.values(customerSegments).map(seg => seg.segment),
                          datasets: [{
                            label: 'Average Spend',
                            data: Object.values(customerSegments).map(seg => seg.averageSpend),
                            backgroundColor: 'rgba(13, 148, 136, 0.7)',
                            borderColor: 'rgba(13, 148, 136, 1)',
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Purchase Frequency</h5>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: Object.values(customerSegments).map(seg => seg.segment),
                          datasets: [{
                            label: 'Visits per Month',
                            data: Object.values(customerSegments).map(seg => seg.frequency),
                            backgroundColor: 'rgba(249, 168, 37, 0.7)',
                            borderColor: 'rgba(249, 168, 37, 1)',
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No customer segment data available for the selected filters
            </div>
          )}
        </div>
      )}

      {/* Pricing Insights */}
      {activeTab === 'pricing' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Pricing Insights</h3>
            </div>
            <div className="text-sm text-gray-500">
              {Object.values(pricingInsights).length} products analyzed
            </div>
          </div>

          {Object.values(pricingInsights).length > 0 ? (
            <div className="grid gap-8">
              {/* Pricing Elasticity */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Price Elasticity Analysis</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Optimal Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Elasticity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Competitor Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recommendation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.values(pricingInsights).map((insight, index) => {
                        const priceDifference = insight.optimalPrice - insight.currentPrice;
                        const competitorDifference = insight.currentPrice - insight.competitorPrice;
                        
                        let recommendation = '';
                        let recommendationColor = '';
                        
                        if (Math.abs(insight.priceElasticity) > 1) {
                          // Elastic demand
                          if (priceDifference > 0) {
                            recommendation = 'Increase price';
                            recommendationColor = 'text-green-600';
                          } else {
                            recommendation = 'Decrease price';
                            recommendationColor = 'text-red-600';
                          }
                        } else {
                          // Inelastic demand
                          if (competitorDifference > 0) {
                            recommendation = 'Match competitor price';
                            recommendationColor = 'text-yellow-600';
                          } else {
                            recommendation = 'Maintain current price';
                            recommendationColor = 'text-gray-600';
                          }
                        }
                        
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {insight.product}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${insight.currentPrice.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${insight.optimalPrice.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {insight.priceElasticity.toFixed(2)}
                              <span className="ml-1 text-xs">
                                ({Math.abs(insight.priceElasticity) > 1 ? 'Elastic' : 'Inelastic'})
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${insight.competitorPrice.toFixed(2)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${recommendationColor}`}>
                              {recommendation}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Price Optimization Opportunities */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Price Optimization Opportunities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Potential Revenue Impact</h5>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: Object.values(pricingInsights).map(insight => insight.product),
                          datasets: [{
                            label: 'Current Revenue',
                            data: Object.values(pricingInsights).map(insight => insight.currentPrice * 100),
                            backgroundColor: 'rgba(156, 163, 175, 0.7)',
                            borderColor: 'rgba(156, 163, 175, 1)',
                            borderWidth: 1
                          }, {
                            label: 'Optimal Revenue',
                            data: Object.values(pricingInsights).map(insight => insight.optimalPrice * 100),
                            backgroundColor: 'rgba(13, 148, 136, 0.7)',
                            borderColor: 'rgba(13, 148, 136, 1)',
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Revenue Index (100 = baseline)'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Price Sensitivity Distribution</h5>
                    <div className="h-64">
                      <Pie
                        data={{
                          labels: ['High Sensitivity', 'Low Sensitivity'],
                          datasets: [{
                            data: [
                              Object.values(pricingInsights).filter(i => Math.abs(i.priceElasticity) > 1).length,
                              Object.values(pricingInsights).filter(i => Math.abs(i.priceElasticity) <= 1).length
                            ],
                            backgroundColor: [
                              'rgba(220, 38, 38, 0.7)',
                              'rgba(13, 148, 136, 0.7)'
                            ],
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No pricing insights available for the selected filters
            </div>
          )}
        </div>
      )}

      {/* Promotion Analysis */}
      {activeTab === 'promotions' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Promotion Analysis</h3>
            </div>
            <div className="text-sm text-gray-500">
              {Object.values(promotionAnalysis).length} promotions analyzed
            </div>
          </div>

          {Object.values(promotionAnalysis).length > 0 ? (
            <div className="grid gap-8">
              {/* Promotion Performance */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Promotion Performance</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Promotion
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sales Uplift
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ROI
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Redemptions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Effectiveness
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.values(promotionAnalysis).map((promo, index) => {
                        let effectiveness = '';
                        let effectivenessColor = '';
                        
                        if (promo.roi > 300) {
                          effectiveness = 'Excellent';
                          effectivenessColor = 'text-green-600';
                        } else if (promo.roi > 150) {
                          effectiveness = 'Good';
                          effectivenessColor = 'text-teal-600';
                        } else if (promo.roi > 100) {
                          effectiveness = 'Average';
                          effectivenessColor = 'text-yellow-600';
                        } else {
                          effectiveness = 'Poor';
                          effectivenessColor = 'text-red-600';
                        }
                        
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {promo.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              +{promo.uplift.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {promo.roi.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {promo.redemptions}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${promo.cost.toFixed(2)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${effectivenessColor}`}>
                              {effectiveness}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Promotion Insights */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Promotion Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">ROI vs Uplift</h5>
                    <div className="h-64">
                      <Line
                        data={{
                          labels: Object.values(promotionAnalysis).map(promo => promo.name),
                          datasets: [
                            {
                              label: 'ROI (%)',
                              data: Object.values(promotionAnalysis).map(promo => promo.roi),
                              borderColor: 'rgb(13, 148, 136)',
                              backgroundColor: 'rgba(13, 148, 136, 0.1)',
                              yAxisID: 'y',
                              tension: 0.3
                            },
                            {
                              label: 'Sales Uplift (%)',
                              data: Object.values(promotionAnalysis).map(promo => promo.uplift),
                              borderColor: 'rgb(249, 168, 37)',
                              backgroundColor: 'rgba(249, 168, 37, 0.1)',
                              yAxisID: 'y1',
                              tension: 0.3
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          },
                          scales: {
                            y: {
                              type: 'linear',
                              display: true,
                              position: 'left',
                              title: {
                                display: true,
                                text: 'ROI (%)'
                              }
                            },
                            y1: {
                              type: 'linear',
                              display: true,
                              position: 'right',
                              title: {
                                display: true,
                                text: 'Uplift (%)'
                              },
                              grid: {
                                drawOnChartArea: false
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Cost vs Redemptions</h5>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: Object.values(promotionAnalysis).map(promo => promo.name),
                          datasets: [
                            {
                              label: 'Cost ($)',
                              data: Object.values(promotionAnalysis).map(promo => promo.cost),
                              backgroundColor: 'rgba(220, 38, 38, 0.7)',
                              borderColor: 'rgba(220, 38, 38, 1)',
                              borderWidth: 1,
                              yAxisID: 'y'
                            },
                            {
                              label: 'Redemptions',
                              data: Object.values(promotionAnalysis).map(promo => promo.redemptions),
                              backgroundColor: 'rgba(13, 148, 136, 0.7)',
                              borderColor: 'rgba(13, 148, 136, 1)',
                              borderWidth: 1,
                              yAxisID: 'y1'
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          },
                          scales: {
                            y: {
                              type: 'linear',
                              display: true,
                              position: 'left',
                              title: {
                                display: true,
                                text: 'Cost ($)'
                              }
                            },
                            y1: {
                              type: 'linear',
                              display: true,
                              position: 'right',
                              title: {
                                display: true,
                                text: 'Redemptions'
                              },
                              grid: {
                                drawOnChartArea: false
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No promotion data available for the selected filters
            </div>
          )}
        </div>
      )}

      {/* Geographic Performance */}
      {activeTab === 'geographic' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Geographic Performance</h3>
            </div>
            <div className="text-sm text-gray-500">
              {Object.values(geographicPerformance).length} locations analyzed
            </div>
          </div>

          {Object.values(geographicPerformance).length > 0 ? (
            <div className="grid gap-8">
              {/* Location Performance */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Location Performance</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Sales
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Growth
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Top Product
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.values(geographicPerformance).map((location, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {location.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${location.sales.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            location.growth > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {location.growth > 0 ? '+' : ''}{location.growth.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {location.topProduct}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Geographic Distribution */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Sales Distribution</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Sales by Location</h5>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: Object.values(geographicPerformance).map(loc => loc.location),
                          datasets: [{
                            label: 'Total Sales',
                            data: Object.values(geographicPerformance).map(loc => loc.sales),
                            backgroundColor: 'rgba(13, 148, 136, 0.7)',
                            borderColor: 'rgba(13, 148, 136, 1)',
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Sales ($)'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Growth by Location</h5>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: Object.values(geographicPerformance).map(loc => loc.location),
                          datasets: [{
                            label: 'Growth Rate',
                            data: Object.values(geographicPerformance).map(loc => loc.growth),
                            backgroundColor: Object.values(geographicPerformance).map(loc => 
                              loc.growth > 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'
                            ),
                            borderColor: Object.values(geographicPerformance).map(loc => 
                              loc.growth > 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
                            ),
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            }
                          },
                          scales: {
                            y: {
                              title: {
                                display: true,
                                text: 'Growth Rate (%)'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No geographic performance data available for the selected filters
            </div>
          )}
        </div>
      )}

      {/* Predictions */}
      {activeTab === 'predictions' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Predictions</h3>
            </div>
            <div className="text-sm text-gray-500">
              {predictions.length} predictions available
            </div>
          </div>

          {predictions.length > 0 ? (
            <div className="grid gap-6">
              {predictions.map((prediction, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 text-black">{prediction.date}</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Revenue:</span> ${prediction.predicted_revenue.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Units:</span> {prediction.predicted_units.toFixed(0)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Confidence:</span> {prediction.confidence.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No prediction data available for the selected filters
            </div>
          )}
        </div>
      )}

      {/* Advanced Analytics */}
      {activeTab === 'advanced' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Advanced Analytics</h3>
            </div>
            <div className="text-sm text-gray-500">
              {advancedAnalytics?.clv?.length || 0} customer lifetime value segments
            </div>
          </div>

          {(advancedAnalytics?.clv?.length || 0) > 0 ? (
            <div className="grid gap-6">
              {/* Customer Lifetime Value */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Customer Lifetime Value</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg. Order Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purchase Frequency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer Lifespan (days)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CLV
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {advancedAnalytics?.clv?.map((segment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {segment.customer_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${segment.total_revenue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${segment.avg_order_value.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {segment.purchase_frequency.toFixed(1)}/month
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {segment.customer_lifespan_days.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${segment.clv.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RFM Analysis */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">RFM Analysis</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Frequency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monetary
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          R Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          F Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          M Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Segment
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {advancedAnalytics?.rfm?.map((segment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {segment.customer_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {segment.recency} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {segment.frequency} visits
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${segment.monetary.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {segment.r_score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {segment.f_score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {segment.m_score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {segment.segment}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Market Basket Analysis */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Market Basket Analysis</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pair
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Support
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {advancedAnalytics?.marketBasket?.map((pair, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {pair.pair}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {pair.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {pair.support.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Correlations */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Price vs Quantity Correlation</h4>
                <div className="h-64">
                  <Pie
                    data={{
                      labels: ['Positive', 'Negative'],
                      datasets: [{
                        data: [(advancedAnalytics?.correlations?.price_quantity || 0) > 0 ? 1 : 0, (advancedAnalytics?.correlations?.price_quantity || 0) < 0 ? 1 : 0],
                        backgroundColor: [
                          'rgba(34, 197, 94, 0.7)',
                          'rgba(239, 68, 68, 0.7)'
                        ],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Churn Risk */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Churn Risk Analysis</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Churn Probability
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {advancedAnalytics?.churnRisk?.map((risk, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {risk.customer_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {risk.churn_probability.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Profitability */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Profitability Analysis</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profit Margin
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {advancedAnalytics?.profitability?.map((profit, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {profit.customer_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {profit.profit_margin.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No advanced analytics data available for the selected filters
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
