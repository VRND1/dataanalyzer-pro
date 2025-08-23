import { Card } from '@/components/ui/card';
import type { DataField } from '@/types/data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface InventoryOptimizationProps {
  data: {
    fields: DataField[];
  };
}

interface InventoryMetrics {
  inventoryCost: number;
  inventoryLevel: number;
  totalCost: number;
  return: number;
  roi: number;
  stockoutRisk: number;
  turnoverRatio: number;
  carryingCost: number;
  serviceLevel: number;
  excessValue: number;
  shortageValue: number;
  healthScore: number;
}

export function InventoryOptimization({ data }: InventoryOptimizationProps) {
  // Scale factor for costs
  const COST_SCALE = 1_000_000;
  
  // Extract metrics from CSV data
  let inventoryMetrics: InventoryMetrics = {
    inventoryCost: 0,
    inventoryLevel: 0,
    totalCost: 0,
    return: 0,
    roi: 0,
    stockoutRisk: 0,
    turnoverRatio: 0,
    carryingCost: 0,
    serviceLevel: 0,
    excessValue: 0,
    shortageValue: 0,
    healthScore: 0
  };

  try {
    // Process all data rows to get aggregate values
    const dataRows = data.fields.slice(1); // Skip header row
    const rowCount = dataRows.length;

    if (rowCount > 0) {
      const aggregate = dataRows.reduce((acc, field) => {
        const row = field.value;
        acc.inventoryCost += Number(row[0]) || 0;
        acc.inventoryLevel += Number(row[1]) || 0;
        acc.totalCost += Number(row[2]) || 0;
        acc.return += Number(row[3]) || 0;
        acc.roi += Number(row[4]) || 0;
        return acc;
      }, {
        inventoryCost: 0,
        inventoryLevel: 0,
        totalCost: 0,
        return: 0,
        roi: 0,
      });

      // Calculate averages and apply scaling
      inventoryMetrics = {
        inventoryCost: aggregate.inventoryCost * COST_SCALE,
        inventoryLevel: aggregate.inventoryLevel / rowCount, // Average level
        totalCost: aggregate.totalCost * COST_SCALE,
        return: aggregate.return * COST_SCALE,
        roi: aggregate.roi / rowCount, // Average ROI
        stockoutRisk: 0,
        turnoverRatio: 0,
        carryingCost: 0,
        serviceLevel: 0,
        excessValue: 0,
        shortageValue: 0,
        healthScore: 0
      };

      // Calculate derived metrics from aggregated values
      const carryingRate = 0.20;
      inventoryMetrics.carryingCost = inventoryMetrics.inventoryCost * carryingRate;
      
      // Turnover Ratio = Return / Inventory Cost. A higher ratio is better.
      inventoryMetrics.turnoverRatio = inventoryMetrics.inventoryCost > 0 
        ? inventoryMetrics.return / inventoryMetrics.inventoryCost 
        : 0;

      // Estimate an optimal inventory level. A higher turnover suggests lower optimal inventory is needed.
      // Let's cap the impact of turnover to prevent optimal level from going to zero.
      const turnoverImpactFactor = 1 - (Math.min(inventoryMetrics.turnoverRatio, 10) * 0.05); // Max 50% reduction
      const optimalInventoryLevel = Math.max(0.1, 0.8 * turnoverImpactFactor); // Base optimal level is 0.8

      // Reorder point is a fraction of the optimal level.
      const reorderPoint = optimalInventoryLevel * 0.4; // 40% of optimal

      // More nuanced Stockout Risk calculation.
      if (inventoryMetrics.inventoryLevel < reorderPoint) {
        // The further below the reorder point, the higher the risk.
        const shortfall = (reorderPoint - inventoryMetrics.inventoryLevel) / reorderPoint;
        inventoryMetrics.stockoutRisk = 10 + (shortfall * 40); // Base risk 10%, scales up to 50%
      } else {
        inventoryMetrics.stockoutRisk = 5; // A baseline 5% risk if above reorder point.
      }
      inventoryMetrics.stockoutRisk = Math.min(inventoryMetrics.stockoutRisk, 100); // Cap at 100%

      inventoryMetrics.serviceLevel = Math.min(99, 100 - inventoryMetrics.stockoutRisk);

      // Refined Excess/Shortage Value
      if (inventoryMetrics.inventoryLevel > optimalInventoryLevel) {
        const excessRatio = (inventoryMetrics.inventoryLevel - optimalInventoryLevel) / optimalInventoryLevel;
        inventoryMetrics.excessValue = inventoryMetrics.inventoryCost * excessRatio;
      } else if (inventoryMetrics.inventoryLevel < optimalInventoryLevel) {
        const shortageRatio = (optimalInventoryLevel - inventoryMetrics.inventoryLevel) / optimalInventoryLevel;
        inventoryMetrics.shortageValue = inventoryMetrics.inventoryCost * shortageRatio;
      }

      // Refined Health Score
      // Weights: Service Level: 40%, Turnover: 30%, Cost-Efficiency (lack of excess): 30%
      const excessPenalty = Math.max(0, 100 - (inventoryMetrics.excessValue / inventoryMetrics.inventoryCost) * 200);
      inventoryMetrics.healthScore = Math.round(
        (inventoryMetrics.serviceLevel * 0.4) +
        (Math.min(100, inventoryMetrics.turnoverRatio * 15) * 0.3) + // Adjusted multiplier for turnover
        (excessPenalty * 0.3)
      );
    }
  } catch (error) {
    console.error('Error processing inventory data:', error);
  }

  // If no valid data was found, show a message
  if (inventoryMetrics.inventoryCost === 0 && inventoryMetrics.totalCost === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Enhanced Inventory Optimization</h3>
        <p className="text-gray-500">No valid inventory data found. Please ensure your data contains the required fields in the correct format.</p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-black mb-2">Expected CSV Format:</h4>
          <p className="text-sm text-gray-700">InventoryCost, InventoryLevel, TotalCost, Return, ROI</p>
          <p className="text-xs text-gray-600 mt-2">
            • InventoryCost: Total cost of inventory (will be scaled by 1M)<br/>
            • InventoryLevel: Current inventory level (0-1 scale)<br/>
            • TotalCost: Total operational costs (will be scaled by 1M)<br/>
            • Return: Revenue/returns (will be scaled by 1M)<br/>
            • ROI: Return on Investment percentage
          </p>
        </div>
      </Card>
    );
  }

  // Normalize inventory level for display
  const normalizedInventoryLevel = Math.min(100, inventoryMetrics.inventoryLevel * 100);

  // Prepare data for charts
  const metricsData = [
    { name: 'Inventory Cost', value: inventoryMetrics.inventoryCost, color: '#3b82f6' },
    { name: 'Total Cost', value: inventoryMetrics.totalCost, color: '#ef4444' },
    { name: 'Return', value: inventoryMetrics.return, color: '#10b981' }
  ];

  const performanceData = [
    { name: 'Service Level', value: inventoryMetrics.serviceLevel, color: '#10b981' },
    { name: 'Stockout Risk', value: inventoryMetrics.stockoutRisk, color: '#f59e0b' },
    { name: 'Turnover Ratio', value: Math.min(100, inventoryMetrics.turnoverRatio * 10), color: '#8b5cf6' }
  ];

  // Format currency using compact notation for large numbers to prevent overflow
  const formatCurrency = (value: number) => {
    // Use scientific notation for extremely large values to guarantee fit
    if (Math.abs(value) >= 1e12) { // Use for values a trillion or higher
      return `$${value.toExponential(2)}`;
    }
    if (Math.abs(value) > 999999) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 2,
      }).format(value);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    if (Math.abs(value) >= 1_000_000) { // Use scientific notation for extreme values
      return `${value.toExponential(2)}%`;
    }
    return `${value.toFixed(1)}%`;
  };

  // Pre-format all display values to check their length for responsive font sizes
  const stockoutRiskDisplay = formatPercent(inventoryMetrics.stockoutRisk);
  const inventoryLevelDisplay = formatPercent(normalizedInventoryLevel);
  const serviceLevelDisplay = formatPercent(inventoryMetrics.serviceLevel);
  const turnoverRatioDisplay = `${inventoryMetrics.turnoverRatio.toFixed(1)}x`;
  const roiDisplay = formatPercent(inventoryMetrics.roi);

  const inventoryCostDisplay = formatCurrency(inventoryMetrics.inventoryCost);
  const excessValueDisplay = formatCurrency(inventoryMetrics.excessValue);
  const shortageValueDisplay = formatCurrency(inventoryMetrics.shortageValue);
  const carryingCostDisplay = formatCurrency(inventoryMetrics.carryingCost);

  const healthScoreDisplay = `${inventoryMetrics.healthScore}/100`;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-black mb-4">Enhanced Inventory Optimization</h3>
      
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4 bg-red-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Stockout Risk</h4>
          <p className={`font-bold text-red-600 ${stockoutRiskDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>{stockoutRiskDisplay}</p>
          <p className="text-xs text-gray-500">Risk of stockout</p>
        </Card>
        <Card className="p-4 bg-yellow-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Inventory Level</h4>
          <p className={`font-bold text-yellow-600 ${inventoryLevelDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>{inventoryLevelDisplay}</p>
          <p className="text-xs text-gray-500">Current level (normalized)</p>
        </Card>
        <Card className="p-4 bg-green-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Service Level</h4>
          <p className={`font-bold text-green-600 ${serviceLevelDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>{serviceLevelDisplay}</p>
          <p className="text-xs text-gray-500">Service reliability</p>
        </Card>
        <Card className="p-4 bg-orange-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Turnover Ratio</h4>
          <p className={`font-bold text-orange-600 ${turnoverRatioDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>{turnoverRatioDisplay}</p>
          <p className="text-xs text-gray-500">Inventory efficiency</p>
        </Card>
        <Card className="p-4 bg-blue-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">ROI</h4>
          <p className={`font-bold text-blue-600 ${roiDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>{roiDisplay}</p>
          <p className="text-xs text-gray-500">Return on investment</p>
        </Card>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-purple-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Inventory Cost</h4>
          <p className={`font-bold ${inventoryCostDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>{inventoryCostDisplay}</p>
        </Card>
        <Card className="p-4 bg-indigo-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Excess Value</h4>
          <p className={`font-bold text-red-600 ${excessValueDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>{excessValueDisplay}</p>
        </Card>
        <Card className="p-4 bg-pink-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Shortage Value</h4>
          <p className={`font-bold text-yellow-600 ${shortageValueDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>{shortageValueDisplay}</p>
        </Card>
        <Card className="p-4 bg-teal-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Annual Carrying Cost</h4>
          <p className={`font-bold ${carryingCostDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>{carryingCostDisplay}</p>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-emerald-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Service Level</h4>
          <p className={`font-bold text-emerald-600 ${serviceLevelDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>{serviceLevelDisplay}</p>
        </Card>
        <Card className="p-4 bg-amber-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Stockout Risk</h4>
          <p className={`font-bold text-amber-600 ${stockoutRiskDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>{stockoutRiskDisplay}</p>
        </Card>
        <Card className="p-4 bg-cyan-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Turnover Ratio</h4>
          <p className={`font-bold text-cyan-600 ${turnoverRatioDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>{turnoverRatioDisplay}</p>
        </Card>
        <Card className="p-4 bg-lime-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Health Score</h4>
          <p className={`font-bold ${
            inventoryMetrics.healthScore > 80 ? 'text-green-600' : 
            inventoryMetrics.healthScore > 60 ? 'text-yellow-600' : 'text-red-600'
          } ${healthScoreDisplay.length > 9 ? 'text-lg' : 'text-2xl'}`}>
            {healthScoreDisplay}
          </p>
        </Card>
      </div>

      {/* Health Score Visualization */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-black">Overall Inventory Health</h4>
          <span className="text-sm text-gray-500">
            {inventoryMetrics.healthScore > 85 ? 'Excellent' : 
             inventoryMetrics.healthScore > 70 ? 'Good' : 
             inventoryMetrics.healthScore > 50 ? 'Fair' : 'Poor'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              inventoryMetrics.healthScore > 80 ? 'bg-green-500' : 
              inventoryMetrics.healthScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${inventoryMetrics.healthScore}%` }}
          ></div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Financial Metrics Chart */}
        <div className="h-80">
          <h4 className="text-sm font-medium text-black mb-2">Financial Metrics (Scaled by 1M)</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={metricsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Value']} />
              <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics Chart */}
        <div className="h-80">
          <h4 className="text-sm font-medium text-black mb-2">Performance Metrics</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4 bg-red-50">
          <h5 className="font-medium text-black mb-3">🚨 Risk Alerts</h5>
          <div className="space-y-2 text-sm">
            {inventoryMetrics.stockoutRisk > 15 && (
              <div className="p-2 bg-white rounded">
                <span className="font-medium text-black">High Stockout Risk</span>
                <div className="text-xs text-gray-500">
                  Current risk: {stockoutRiskDisplay}
                </div>
                <span className="font-bold text-red-600">
                  Consider increasing inventory levels or improving forecast accuracy.
                </span>
              </div>
            )}
            {inventoryMetrics.turnoverRatio < 3 && (
              <div className="p-2 bg-white rounded">
                <span className="font-medium text-black">Low Turnover</span>
                <div className="text-xs text-gray-500">
                  Current ratio: {turnoverRatioDisplay}
                </div>
                <span className="font-bold text-red-600">
                  Consider reducing inventory levels to improve cash flow.
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4 bg-orange-50">
          <h5 className="font-medium text-black mb-3">📊 Financial Insights</h5>
          <div className="space-y-2 text-sm">
            {inventoryMetrics.excessValue > inventoryMetrics.inventoryCost * 0.1 && (
              <div className="p-2 bg-white rounded">
                <span className="font-medium text-black">Excess Inventory</span>
                <div className="text-xs text-gray-500">
                  Value: {excessValueDisplay}
                </div>
                <span className="font-bold text-orange-600">
                  Consider reducing stock levels to tie up capital.
                </span>
              </div>
            )}
            {inventoryMetrics.shortageValue > 0 && (
              <div className="p-2 bg-white rounded">
                <span className="font-medium text-black">Inventory Shortage</span>
                <div className="text-xs text-gray-500">
                  Value: {shortageValueDisplay}
                </div>
                <span className="font-bold text-orange-600">
                  Consider increasing stock levels
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <Card className="p-4 bg-blue-50">
        <h5 className="font-medium text-black mb-3">💡 Key Insights & Recommendations</h5>
        <div className="space-y-2 text-sm text-black">
          {inventoryMetrics.stockoutRisk > 15 && (
            <p className="p-2 bg-red-100 rounded">⚠️ High stockout risk ({stockoutRiskDisplay}). Consider increasing inventory levels or improving forecast accuracy.</p>
          )}
          {inventoryMetrics.turnoverRatio < 3 && (
            <p className="p-2 bg-yellow-100 rounded">📈 Low inventory turnover ({turnoverRatioDisplay}). This may indicate overstocking or slow-moving items. Aim to increase sales or reduce stock.</p>
          )}
          {inventoryMetrics.excessValue > inventoryMetrics.inventoryCost * 0.1 && (
            <p className="p-2 bg-orange-100 rounded">💰 High excess inventory value ({excessValueDisplay}). This ties up capital. Focus on reducing overstock through sales or promotions.</p>
          )}
          {inventoryMetrics.healthScore < 65 && (
            <p className="p-2 bg-red-100 rounded">🏥 Inventory health score is {healthScoreDisplay}. Immediate attention is recommended to balance service levels, turnover, and costs.</p>
          )}
          {inventoryMetrics.roi > 15 && (
            <p className="p-2 bg-green-100 rounded">✅ Strong ROI ({roiDisplay}) indicates that your inventory investments are generating good returns.</p>
          )}
        </div>
      </Card>

      <p className="text-sm text-gray-500 mt-4">
        Analyzed aggregate inventory data from your input file. 
        All cost values scaled by 1,000,000x. Health score based on service level (40%), turnover (30%), and cost-efficiency (30%).
      </p>
    </Card>
  );
} 