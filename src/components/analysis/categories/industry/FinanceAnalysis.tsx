import React from 'react';
import { PiggyBank, DollarSign, TrendingUp, AlertTriangle, HelpCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import type { DataField } from '@/types/data';
import { FinanceAnalyzer } from '@/utils/analysis/industry/finance';

/* =========================================================
   Helper functions
   ========================================================= */
const lower = (str: string) => str?.toLowerCase() || '';
const numCol = (fields: DataField[], names: string[]): number[] => {
  for (const name of names) {
    const field = fields.find(f => lower(f.name) === lower(name));
    if (field?.value && Array.isArray(field.value)) {
      return field.value.map(v => typeof v === 'number' ? v : parseFloat(v as any) || 0);
    }
  }
  return [];
};
const strCol = (fields: DataField[], names: string[]): string[] => {
  for (const name of names) {
    const field = fields.find(f => lower(f.name) === lower(name));
    if (field?.value && Array.isArray(field.value)) {
      return field.value.map(v => String(v ?? ''));
    }
  }
  return [];
};

/* =========================================================
   Types (local)
   ========================================================= */
interface CustomMetric {
  label: string;
  value: number | string;
  formatter?: (value: number | string) => string;
  icon?: React.ReactNode;
  description?: string;
  tooltip?: string;
}

interface MetricCardsConfig {
  metrics?: {
    [key: string]: boolean | undefined;
  };
  customMetrics?: CustomMetric[];
}

interface ChartOptions {
  lineChart?: {
    datasets?: string[];
    colors?: {
      line?: string;
      fill?: string;
    };
    title?: string;
  };
  barChart?: {
    datasets?: string[];
    title?: string;
  };
  showPieChart?: boolean;
  pieChartTitle?: string;
}

interface FinanceAnalysisConfig {
  showTrends?: boolean;
  showRiskAnalysis?: boolean;
  metricCards?: MetricCardsConfig;
  chartOptions?: ChartOptions;
  showHelpText?: boolean;
  showDataQualityWarnings?: boolean;
}

interface FinanceAnalysisProps {
  data: {
    fields: DataField[];
    metadata?: {
      currency?: string;
      timePeriod?: string;
      [key: string]: any;
    };
  };
  config?: FinanceAnalysisConfig;
}

interface FinancialData {
  [key: string]: any;
  trends?: Array<{
    period: string;
    [key: string]: any;
  }>;
  availableMetrics?: string[];
  dataQuality?: {
    completeness: number;
    consistency: number;
    timeliness: number;
    warnings?: string[];
  };
}

interface Metric {
  label: string;
  value: number;
  formatter: (value: number) => string;
  icon?: React.ReactNode;
  description?: string;
  tooltip?: string;
  historicalAverage?: number;
}

/* =========================================================
   Core builder – returns VALUES, plus decimals for compatibility
   ========================================================= */
export function buildFinancialDataFromFields(fields: DataField[]): { financialData: FinancialData; issues: string[] } {
  const issues: string[] = [];

  // 1) Detect columns (aliases)
  const qty       = numCol(fields, ['quantity','qty','units','unit']);
  const price     = numCol(fields, ['price','unit_price','sellingprice']);
  let   sales     = numCol(fields, ['sales','revenue']);
  const unitCost  = numCol(fields, ['competitorprice','cost','unitcost','cogs']);
  let   dates     = strCol(fields, ['date','day','timestamp','event_timestamp']);
  let   sectors   = strCol(fields, ['category','sector','segment','type']);

  // 2) Revenue = sales or qty*price
  if (!sales.length && qty.length && price.length) {
    const L = Math.min(qty.length, price.length);
    sales = Array.from({ length: L }, (_, i) => (qty[i] || 0) * (price[i] || 0));
  }
  if (!sales.length) {
    issues.push('No revenue columns found');
  }

  // 3) Cost/COGS – qty * unitCost preferred; else if per-row cost exists, use it; else 0
  let cogsRow: number[] = [];
  if (qty.length && unitCost.length) {
    const L = Math.min(qty.length, unitCost.length);
    cogsRow = Array.from({ length: L }, (_, i) => (qty[i] || 0) * (unitCost[i] || 0));
  } else if (unitCost.length && unitCost.length === sales.length) {
    cogsRow = [...unitCost];
  } else {
    cogsRow = new Array(sales.length).fill(0);
    issues.push('No cost columns found; cost set to 0');
  }

  // 4) Totals – VALUES (not %)
  const revenue = sales.reduce((s, x) => s + (x || 0), 0);
  const cost    = cogsRow.reduce((s, x) => s + (x || 0), 0);
  const profit  = revenue - cost; // Used as Cash Flow proxy
  const marginValue = revenue > 0 ? profit / revenue : 0; // e.g., 0.0512338765
  const roiValue    = cost > 0    ? profit / cost    : 0; // e.g., 0.0540005331

  // 5) Build daily revenue series
  if (!dates.length || dates.every(d => !d || d === 'NaT')) {
    dates = Array.from({ length: sales.length }, (_, i) => `t${String(i).padStart(4,'0')}`);
  }
  const dayMap = new Map<string, number>();
  for (let i = 0; i < sales.length; i++) {
    const d = dates[i] || `t${i}`;
    dayMap.set(d, (dayMap.get(d) ?? 0) + (sales[i] || 0));
  }
  const days = Array.from(dayMap.keys()).filter(Boolean).sort();
  const revSeries = days.map(d => dayMap.get(d) || 0);

  // 6) Returns & volatility
  const rets: number[] = [];
  for (let i = 1; i < revSeries.length; i++) {
    const prev = revSeries[i - 1], curr = revSeries[i];
    rets.push(prev > 0 ? (curr - prev) / prev : 0);
  }
  const mean = (a:number[]) => (a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0);
  const stdev = (a:number[]) => { if(!a.length) return 0; const m=mean(a); return Math.sqrt(mean(a.map(x => (x-m)*(x-m)))); };

  const avgRetRaw = mean(rets);
  let vol = stdev(rets);
  if (vol < 0.01) vol = 0.01;
  if (vol > 0.5)  vol = 0.5;

  // 7) Stress & Scenarios (decimals) + profit-equivalent VALUES
  const stressTests = {
    crisis2008:    -3.0 * vol,
    pandemic2020:  -2.5 * vol,
    inflationShock:-1.0 * vol,
    rateHike:      -0.8 * vol
  } as const;
  const scenarios = {
    bull:  avgRetRaw + 2 * vol,
    base:  avgRetRaw,
    bear:  avgRetRaw - 2 * vol
  } as const;

  const stressProfitValues = {
    crisis2008:     profit * stressTests.crisis2008,
    pandemic2020:   profit * stressTests.pandemic2020,
    inflationShock: profit * stressTests.inflationShock,
    rateHike:       profit * stressTests.rateHike
  };
  const scenarioProfitValues = {
    bull: profit * scenarios.bull,
    base: profit * scenarios.base,
    bear: profit * scenarios.bear
  };

  // 8) Brinson – keep decimals; also give value equivalents
  if (!sectors.length) sectors = new Array(sales.length).fill('Uncategorized');
  const totalReturn = avgRetRaw;
  const benchmarkReturn = 0;
  const activeReturn = totalReturn - benchmarkReturn;
  const attributionValues = {
    totalReturnValue:     revenue * totalReturn,
    activeReturnValue:    revenue * activeReturn,
    selectionEffectValue: revenue * totalReturn
  };

  const financialData: FinancialData = {
    // VALUES
    revenue,
    cost,
    profit,
    marginValue,
    roiValue,
    cashFlow: profit,

    // decimals (for compatibility)
    profitMargin: marginValue,
    roi: roiValue,
    portfolioSummary: { currentValue: revenue, yield: marginValue },

    // risk
    stressTests,
    scenarios,
    stressProfitValues,
    scenarioProfitValues,

    // attribution
    brinson: {
      totalReturn,
      benchmarkReturn,
      activeReturn,
      allocationEffect: 0,
      selectionEffect: totalReturn,
      interactionEffect: 0
    },
    attributionValues,

    trends: [],
    availableMetrics: [
      'revenue','cost','profit','marginValue','roiValue','cashFlow',
      'stressProfitValues','scenarioProfitValues','brinson'
    ],
    dataQuality: { completeness: 1, consistency: 1, timeliness: 1, warnings: issues }
  };

  return { financialData, issues };
}

/* =========================================================
   Component
   ========================================================= */
export function FinanceAnalysis({ data, config = {} }: FinanceAnalysisProps) {
  if (!data || !data.fields) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="text-center text-gray-500">
          <PiggyBank className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Financial Data Available</h3>
          <p className="text-sm">Please upload a file with financial data to perform analysis.</p>
        </div>
      </div>
    );
  }

  const {
    showTrends = true,
    showRiskAnalysis = true,
    showHelpText = true,
    showDataQualityWarnings = true,
    metricCards = { metrics: {}, customMetrics: [] }
  } = config;

  const currencySymbol = data.metadata?.currency || '$';

  const { financialData, issues: dataQualityIssues } = React.useMemo(() => {
    try {
      return buildFinancialDataFromFields(data.fields);
    } catch (e) {
      console.error('Error in financial analysis:', e);
      return {
        financialData: {
          trends: [],
          availableMetrics: [],
          dataQuality: { completeness: 0, consistency: 0, timeliness: 0, warnings: ['Error processing financial data'] }
        } as FinancialData,
        issues: ['Error processing financial data']
      };
    }
  }, [data.fields]);

  // Risk analysis using FinanceAnalyzer (kept as-is)
  const riskAnalysis = React.useMemo(() => {
    try {
      const analysis = FinanceAnalyzer.analyzeRisk(data.fields);
      return analysis.factors.map((factor: any) => ({
        category: factor.name,
        level: factor.impact > 0.7 ? 'high' : factor.impact > 0.4 ? 'medium' : 'low',
        metrics: {
          current: factor.impact,
          historical: factor.impact * 0.9,
          industryAverage: 0.3
        },
        recommendations: factor.recommendations,
        confidenceScore: Math.min(100, Math.max(0, 100 - (factor.impact * 20)))
      }));
    } catch (error) {
      console.error('Error analyzing risk data:', error);
      return [];
    }
  }, [data.fields]);

  /* ===== Formatters ===== */
  const currencyFormatter = (value: number) => {
    if (value >= 1_000_000) return `${currencySymbol}${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)     return `${currencySymbol}${(value / 1_000).toFixed(1)}K`;
    return `${currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };
  const percentFormatter = (value: number) => `${(value * 100).toFixed(4)}%`;
  const decimalFormatter = (value: number) => value.toFixed(10); // show raw value

  // ===== Default metric cards (VALUES) =====
  const getDefaultMetrics = () => {
    const metrics: Record<string, Metric> = {};
    if (!financialData || !financialData.availableMetrics) return metrics;

    if (typeof financialData.revenue === 'number') {
      metrics.revenue = {
        label: 'Revenue',
        value: financialData.revenue,
        formatter: currencyFormatter,
        icon: <DollarSign className="w-4 h-4" />,
        tooltip: 'Total sales (value)'
      };
    }
    if (typeof financialData.cost === 'number') {
      metrics.cost = {
        label: 'Cost',
        value: financialData.cost,
        formatter: currencyFormatter,
        icon: <DollarSign className="w-4 h-4" />,
        tooltip: 'Total cost (qty × competitorPrice)'
      };
    }
    if (typeof financialData.profit === 'number') {
      metrics.profit = {
        label: 'Profit',
        value: financialData.profit,
        formatter: currencyFormatter,
        icon: <PiggyBank className="w-4 h-4" />,
        tooltip: 'Revenue − Cost'
      };
    }
    if (typeof financialData.marginValue === 'number') {
      metrics.marginValue = {
        label: 'Margin (value)',
        value: financialData.marginValue,
        formatter: decimalFormatter,
        icon: <PiggyBank className="w-4 h-4" />,
        tooltip: 'Profit / Revenue (value form)'
      };
    }
    if (typeof financialData.roiValue === 'number') {
      metrics.roiValue = {
        label: 'ROI (value)',
        value: financialData.roiValue,
        formatter: decimalFormatter,
        icon: <TrendingUp className="w-4 h-4" />,
        tooltip: 'Profit / Cost (value form)'
      };
    }
    if (typeof financialData.cashFlow === 'number') {
      metrics.cashFlow = {
        label: 'Cash Flow',
        value: financialData.cashFlow,
        formatter: currencyFormatter,
        icon: <DollarSign className="w-4 h-4" />,
        tooltip: 'Net cash flow (using Profit as proxy)'
      };
    }
    return metrics;
  };

  const safeFinancialData = financialData || {};
  const defaultMetrics = getDefaultMetrics();
  const allMetrics = { ...defaultMetrics, ...metricCards.metrics } as Record<string, Metric>;

  return (
    <div className="space-y-6">
      {/* Data Quality Warnings */}
      {showDataQualityWarnings && dataQualityIssues.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Data Quality Issues</h4>
              <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                {dataQualityIssues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(allMetrics)
          .filter(([_, metric]) => metric && typeof metric === 'object' && 'value' in (metric as any))
          .map(([key, metric]) => {
            const metricObj = metric as Metric;
            return (
              <div key={key} className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {metricObj.icon}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{metricObj.label}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metricObj.formatter(metricObj.value)}
                      </p>
                    </div>
                  </div>
                  {metricObj.historicalAverage !== undefined && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Historical Avg</p>
                      <p className="text-sm font-medium text-gray-700">
                        {metricObj.formatter(metricObj.historicalAverage)}
                      </p>
                    </div>
                  )}
                </div>
                {metricObj.tooltip && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <HelpCircle className="w-3 h-3 mr-1" />
                    {metricObj.tooltip}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Comprehensive Financial Analysis */}
      {safeFinancialData.portfolioSummary && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Comprehensive Financial Analysis</h3>
            </div>
            {showHelpText && (
              <p className="text-sm text-gray-500">Advanced portfolio and risk metrics</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stress Tests – VALUES */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-3">Stress Test Results (Values)</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'crisis2008', label: '2008 Crisis' },
                  { key: 'pandemic2020', label: '2020 Pandemic' },
                  { key: 'inflationShock', label: 'Inflation Shock' },
                  { key: 'rateHike', label: 'Rate Hike' },
                ].map(({ key, label }) => {
                  const val = safeFinancialData.stressProfitValues?.[key] ?? 0;
                  const dec = safeFinancialData.stressTests?.[key] ?? 0;
                  return (
                    <div key={key} className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">{label}</p>
                      <p className="text-lg font-semibold text-gray-900">{currencyFormatter(val)}</p>
                      <p className="text-xs text-gray-500">decimal: {dec.toFixed(6)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scenarios – VALUES */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-3">Scenario Analysis (Values)</h4>
              <div className="space-y-3">
                {[
                  { key: 'bull', label: 'Bull Market' },
                  { key: 'base', label: 'Base Case' },
                  { key: 'bear', label: 'Bear Market' },
                ].map(({ key, label }) => {
                  const val = safeFinancialData.scenarioProfitValues?.[key] ?? 0;
                  const dec = safeFinancialData.scenarios?.[key] ?? 0;
                  return (
                    <div key={key} className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">{label}</p>
                      <p className="text-lg font-semibold text-gray-900">{currencyFormatter(val)}</p>
                      <p className="text-xs text-gray-500">decimal: {dec.toFixed(6)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Attribution – values AND % */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Performance Attribution (Brinson)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700">Return Metrics (%)</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Return</span>
                    <span className="text-sm font-medium">{percentFormatter(safeFinancialData.brinson?.totalReturn || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Benchmark Return</span>
                    <span className="text-sm font-medium">{percentFormatter(safeFinancialData.brinson?.benchmarkReturn || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Return</span>
                    <span className="text-sm font-medium">{percentFormatter(safeFinancialData.brinson?.activeReturn || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700">Attribution (Values)</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Return Value</span>
                    <span className="text-sm font-medium">{currencyFormatter(safeFinancialData.attributionValues?.totalReturnValue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Return Value</span>
                    <span className="text-sm font-medium">{currencyFormatter(safeFinancialData.attributionValues?.activeReturnValue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Selection Effect Value</span>
                    <span className="text-sm font-medium">{currencyFormatter(safeFinancialData.attributionValues?.selectionEffectValue || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Analysis */}
      {showRiskAnalysis && riskAnalysis.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
          <div className="space-y-4">
            {riskAnalysis.map((risk, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{risk.category}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    risk.level === 'high' ? 'bg-red-100 text-red-800' :
                    risk.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {risk.level.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Current</p>
                    <p className="text-sm font-medium">{(risk.metrics.current * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Historical</p>
                    <p className="text-sm font-medium">{(risk.metrics.historical * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Industry Avg</p>
                    <p className="text-sm font-medium">{(risk.metrics.industryAverage * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Recommendations:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {risk.recommendations.map((rec: string, recIndex: number) => (
                      <li key={recIndex}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends (kept for future – if you add trends later) */}
      {showTrends && safeFinancialData.trends && safeFinancialData.trends.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Trends</h3>
          <div className="h-64">
            <Line
              data={{
                labels: safeFinancialData.trends.map((t: any) => t.period),
                datasets: [
                  {
                    label: 'Revenue',
                    data: safeFinancialData.trends.map((t: any) => t.revenue || 0),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.1
                  },
                  {
                    label: 'Profit',
                    data: safeFinancialData.trends.map((t: any) => t.profit || 0),
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.1
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value: any) => currencyFormatter(Number(value))
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceAnalysis;
