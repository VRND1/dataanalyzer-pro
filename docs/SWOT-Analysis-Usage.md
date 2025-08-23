# SWOT Analysis Component Usage Guide

## Overview

The `SWOTAnalysis` component is a React component that displays a comprehensive SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis in a visually appealing dashboard format. It's designed to provide strategic insights for business intelligence and data analysis applications.

## Component Features

### 1. Score Overview
- **Internal Score**: Measures strengths vs weaknesses (0-100%)
- **External Score**: Measures opportunities vs threats (0-100%)
- **Overall Score**: Combined performance indicator (0-100%)

### 2. SWOT Grid
- **Strengths**: Positive internal factors (green theme)
- **Weaknesses**: Negative internal factors (yellow theme)
- **Opportunities**: Positive external factors (blue theme)
- **Threats**: Negative external factors (red theme)

### 3. Impact Indicators
Each SWOT item can have impact levels:
- **High Impact**: Red indicator
- **Medium Impact**: Yellow indicator
- **Low Impact**: Green indicator

## Basic Usage

### 1. Import the Component

```tsx
import SWOTAnalysis from '@/components/analysis/SWOTAnalysis';
import { SWOTAnalysis as SWOTData } from '@/utils/analysis/swot/types';
```

### 2. Prepare Your Data

The component expects data in this format:

```tsx
const swotData: SWOTData = {
  strengths: [
    { description: "Strong market position", impact: "high" },
    { description: "Excellent product quality", impact: "medium" }
  ],
  weaknesses: [
    { description: "Limited financial resources", impact: "high" },
    { description: "Small team size", impact: "medium" }
  ],
  opportunities: [
    { description: "Growing market demand", impact: "high" },
    { description: "Technology advancement", impact: "medium" }
  ],
  threats: [
    { description: "Intense competition", impact: "high" },
    { description: "Economic uncertainty", impact: "medium" }
  ],
  score: {
    internal: 0.65,    // 65% internal score
    external: 0.45,    // 45% external score
    overall: 0.55      // 55% overall score
  }
};
```

### 3. Use the Component

```tsx
function MyComponent() {
  return (
    <div>
      <h1>Business Analysis</h1>
      <SWOTAnalysis analysis={swotData} />
    </div>
  );
}
```

## Advanced Usage with Data Analysis

### 1. Using the Analyzer Utility

```tsx
import { generateSWOTAnalysis } from '@/utils/analysis/swot/analyzer';
import { DataField } from '@/types/data';

function BusinessAnalysis({ data }: { data: { fields: DataField[] } }) {
  const [swotData, setSwotData] = useState<any>(null);

  useEffect(() => {
    // Generate SWOT analysis from your data
    const analysis = generateSWOTAnalysis(data);
    setSwotData(analysis);
  }, [data]);

  return (
    <div>
      {swotData && <SWOTAnalysis analysis={swotData} />}
    </div>
  );
}
```

### 2. Integration with Business Metrics

The SWOT analysis is already integrated into the BusinessMetrics component. You can access it through the "SWOT" tab in the business analysis section.

## Integration Examples

### 1. Standalone Analysis Page

```tsx
import React, { useState, useEffect } from 'react';
import SWOTAnalysis from '@/components/analysis/SWOTAnalysis';
import { generateSWOTAnalysis } from '@/utils/analysis/swot/analyzer';

function SWOTAnalysisPage({ data }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateAnalysis = async () => {
      setLoading(true);
      const result = generateSWOTAnalysis(data);
      setAnalysis(result);
      setLoading(false);
    };

    generateAnalysis();
  }, [data]);

  if (loading) {
    return <div>Loading SWOT analysis...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">SWOT Analysis</h1>
      <SWOTAnalysis analysis={analysis} />
    </div>
  );
}
```

### 2. Dashboard Integration

```tsx
import React from 'react';
import SWOTAnalysis from '@/components/analysis/SWOTAnalysis';

function Dashboard({ businessData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Business Metrics</h2>
        {/* Your business metrics component */}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <SWOTAnalysis analysis={businessData.swot} />
      </div>
    </div>
  );
}
```

### 3. Report Generation

```tsx
import React from 'react';
import SWOTAnalysis from '@/components/analysis/SWOTAnalysis';

function BusinessReport({ analysisData }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Business Analysis Report</h1>
        <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
      </div>
      
      <SWOTAnalysis analysis={analysisData.swot} />
      
      {/* Other report sections */}
    </div>
  );
}
```

## Data Generation Strategies

### 1. Automated Analysis

The `generateSWOTAnalysis` function automatically analyzes your data fields and generates SWOT insights based on:

- **Data Structure**: Number of fields, data types
- **Data Quality**: Completeness, consistency
- **Business Context**: Field names, patterns

### 2. Custom Analysis

You can create custom SWOT analysis by manually defining the SWOT items:

```tsx
const customSWOTData = {
  strengths: [
    { description: "Your custom strength", impact: "high" }
  ],
  weaknesses: [
    { description: "Your custom weakness", impact: "medium" }
  ],
  opportunities: [
    { description: "Your custom opportunity", impact: "high" }
  ],
  threats: [
    { description: "Your custom threat", impact: "medium" }
  ],
  score: {
    internal: 0.7,
    external: 0.6,
    overall: 0.65
  }
};
```

## Styling and Customization

The component uses Tailwind CSS classes and can be customized by:

1. **Modifying the component styles** in `SWOTAnalysis.tsx`
2. **Wrapping with custom CSS classes**
3. **Using CSS-in-JS solutions**

## Best Practices

1. **Data Preparation**: Ensure your data is clean and well-structured
2. **Context**: Provide meaningful descriptions for SWOT items
3. **Regular Updates**: Update SWOT analysis regularly as business conditions change
4. **Integration**: Use SWOT analysis as part of a comprehensive business intelligence strategy

## Troubleshooting

### Common Issues

1. **Empty Analysis**: Ensure your data has sufficient fields for analysis
2. **Missing Scores**: Check that all score values are between 0 and 1
3. **Type Errors**: Verify that your data matches the expected TypeScript interfaces

### Performance Considerations

- The component is lightweight and renders efficiently
- Large datasets should be processed before passing to the component
- Consider memoization for repeated analyses

## API Reference

### Props

```tsx
interface SWOTAnalysisProps {
  analysis: SWOTData;
}
```

### Types

```tsx
interface SWOTData {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  score: {
    internal: number;
    external: number;
    overall: number;
  };
}

interface SWOTItem {
  description: string;
  impact?: 'low' | 'medium' | 'high';
}
``` 