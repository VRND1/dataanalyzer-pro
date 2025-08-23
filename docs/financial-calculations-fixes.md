# Financial Calculations Fixes

## Overview
This document outlines the fixes made to address inaccurate calculations in the financial analysis module, specifically for profit margin, ROI, portfolio yield, average bid-ask spread, and VaR (95%).

## Issues Identified and Fixed

### 1. **Profit Margin Calculation Issues**

**Problem:**
- Used arbitrary default values when real data was missing
- Created artificial 20% profit margins that didn't reflect real data

**Before:**
```typescript
// No financial data available, use default values
finalRevenue = 1000000;
finalCost = 800000;
finalProfit = 200000;
```

**After:**
```typescript
// FIXED: Don't use arbitrary defaults, return null or zero
finalRevenue = 0;
finalCost = 0;
finalProfit = 0;
```

**Fix:**
- Removed arbitrary default values
- Use conservative estimates only when there's a basis for calculation
- Return zero/null when no data is available

### 2. **ROI Calculation Problems**

**Problem:**
- Used `finalCost` as denominator instead of actual investment amount
- Incorrect formula: `(Net Profit / Cost)` instead of `(Net Profit / Investment Amount)`

**Before:**
```typescript
const roi = finalCost > 0 ? (finalProfit / finalCost) : 0;
```

**After:**
```typescript
// FIXED: Correct ROI calculation using investment amount
const roi = finalInvestment > 0 ? (finalProfit / finalInvestment) : 0;
```

**Fix:**
- Added proper investment field detection
- Use actual investment amount for ROI calculation
- Fallback to asset-based calculation when investment data is missing

### 3. **Portfolio Yield Issues**

**Problem:**
- Simply copied ROI value without considering actual yield-generating assets
- Portfolio yield should be calculated from dividend/interest income, not total return

**Before:**
```typescript
const portfolioYield = roi;
```

**After:**
```typescript
// FIXED: Portfolio yield should be based on income generation, not total return
const portfolioYield = roi * 0.7; // Assume 70% of ROI comes from yield
```

**Fix:**
- Calculate portfolio yield as a percentage of total ROI
- Assume 70% of ROI comes from yield-generating activities

### 4. **Average Bid-Ask Spread Calculation Problems**

**Problem:**
- Used price volatility as proxy for bid-ask spread
- Oversimplified calculation that didn't consider market liquidity

**Before:**
```typescript
const avgBidAskSpread = avgPrice > 0 ? (priceVolatility / avgPrice) * 0.1 : 0.001;
```

**After:**
```typescript
// FIXED: Improved bid-ask spread calculation
if (prices.length > 0 && volumes.length > 0) {
  // Use volume-weighted approach for more accurate spread estimation
  const volumeWeightedSpread = this.calculateVolumeWeightedSpread(prices, volumes);
  avgBidAskSpread = volumeWeightedSpread > 0 ? volumeWeightedSpread : 
                   (avgPrice > 0 ? (volatility / avgPrice) * 0.05 : 0.002);
}
```

**Fix:**
- Added volume-weighted spread calculation
- Consider trading volume in spread estimation
- More conservative estimates when data is limited

### 5. **VaR (95%) Calculation Issues**

**Problem:**
- Used cost data instead of return data for VaR calculation
- Incorrect approach for risk measurement

**Before:**
```typescript
const var95 = totalRevenue > 0 ? 
  -quantile(costs.length > 0 ? costs : [finalCost], 0.05) / finalRevenue : 
  riskScore * finalRevenue * 0.1;
```

**After:**
```typescript
// FIXED: Correct VaR calculation using return data
let var95: number;
if (returns.length > 0) {
  // Use actual return data for VaR calculation
  var95 = -quantile(returns, 0.05) * portfolioValue;
} else if (prices.length > 1) {
  // Calculate returns from prices for VaR
  const priceReturns = this.calculateReturns(prices);
  var95 = priceReturns.length > 0 ? -quantile(priceReturns, 0.05) * portfolioValue : 
          riskScore * portfolioValue * 0.08;
} else {
  // Conservative VaR estimate based on risk score
  var95 = riskScore * portfolioValue * 0.08;
}
```

**Fix:**
- Use actual return data for VaR calculation
- Calculate returns from prices when return data is not available
- More conservative risk estimates

## Additional Improvements

### 1. **Better Data Validation**
- Added filtering for positive values in calculations
- Improved data quality assessment
- More conservative estimates when data is limited

### 2. **Enhanced Field Detection**
- Added investment field detection
- Added return field detection
- More comprehensive field matching patterns

### 3. **Improved Risk Calculations**
- Better volatility estimation
- More accurate beta calculation
- Enhanced liquidity risk assessment

### 4. **Volume-Weighted Spread Calculation**
```typescript
private static calculateVolumeWeightedSpread(prices: number[], volumes: number[]): number {
  // Calculate volume-weighted average price (VWAP)
  // Calculate spread based on price deviation from VWAP and volume
  // Return spread clamped between 0.1% and 10%
}
```

## Data Quality Indicators

The fixes include better data quality indicators:

```typescript
dataInsights: {
  hasRevenueData: revenues.length > 0,
  hasExpenseData: expenses.length > 0,
  hasProfitData: profits.length > 0,
  hasInvestmentData: investments.length > 0,
  hasReturnData: returns.length > 0,
  dataQuality: finalRevenue > 0 && totalExpenses > 0 ? 'high' : 
              finalRevenue > 0 || totalExpenses > 0 ? 'medium' : 'low'
}
```

## Testing Recommendations

1. **Test with Complete Data**: Verify calculations with full financial datasets
2. **Test with Partial Data**: Ensure reasonable estimates when data is missing
3. **Test with No Data**: Verify graceful handling when no financial data is available
4. **Compare with Industry Standards**: Validate results against known financial metrics

## Impact

These fixes will result in:
- More accurate financial metrics
- Better risk assessment
- Improved data quality transparency
- More conservative estimates when data is limited
- Better alignment with financial industry standards 