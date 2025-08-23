import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DataField } from '@/types/data';

interface CustomerSegment {
  id: string;
  name: string;
  value: number;
  color: string;
  avgPurchaseValue: number;
  purchaseFrequency: number;
  demographics: {
    ageRange: string;
    location: string;
  };
}

interface CustomerData {
  [key: string]: any;
  customerId?: string;
  totalSpent?: number;
  purchaseCount?: number;
  age?: number | string;
  location?: string;
  lastPurchaseDate?: string;
  segment?: string;
}

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A4DE6C'];

interface CustomerSegmentationProps {
  data: {
    fields: DataField[];
  };
}

function columnarToRows(fields: DataField[]): any[] {
  if (!fields || fields.length === 0) return [];
  const length = Array.isArray(fields[0].value) ? fields[0].value.length : 0;
  const rows = [];
  for (let i = 0; i < length; i++) {
    const row: Record<string, any> = {};
    for (const field of fields) {
      row[field.name] = Array.isArray(field.value) ? field.value[i] : field.value;
    }
    rows.push(row);
  }
  return rows;
}

export default function CustomerSegmentation({ data }: CustomerSegmentationProps) {
  const [rawData, setRawData] = useState<CustomerData[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState<Omit<CustomerSegment, 'id'>>({
    name: '',
    value: 0,
    color: DEFAULT_COLORS[0],
    avgPurchaseValue: 0,
    purchaseFrequency: 0,
    demographics: {
      ageRange: '',
      location: ''
    }
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mapping, setMapping] = useState({
    segmentField: '',
    spendField: '',
    frequencyField: '',
    ageField: '',
    locationField: ''
  });

  // Process data from dashboard input
  const processDashboardData = (dashboardData: any[]) => {
    if (!Array.isArray(dashboardData)) return;
    
    setRawData(dashboardData);
    
    // Auto-detect potential field mappings
    if (dashboardData.length > 0) {
      const firstRow = dashboardData[0];
      const autoMapping = {
        segmentField: Object.keys(firstRow).find(k => 
          k.toLowerCase().includes('segment') || 
          k.toLowerCase().includes('group')) || '',
        spendField: Object.keys(firstRow).find(k => 
          k.toLowerCase().includes('spend') || 
          k.toLowerCase().includes('total') || 
          k.toLowerCase().includes('amount')) || '',
        frequencyField: Object.keys(firstRow).find(k => 
          k.toLowerCase().includes('frequency') || 
          k.toLowerCase().includes('count') || 
          k.toLowerCase().includes('purchases')) || '',
        ageField: Object.keys(firstRow).find(k => 
          k.toLowerCase().includes('age')) || '',
        locationField: Object.keys(firstRow).find(k => 
          k.toLowerCase().includes('location') || 
          k.toLowerCase().includes('city') || 
          k.toLowerCase().includes('region')) || ''
      };
      setMapping(autoMapping);
    }
  };

  // Generate segments from raw data
  const generateSegmentsFromData = () => {
    if (rawData.length === 0 || !mapping.segmentField) return;

    const segmentMap = new Map<string, {
      count: number;
      totalSpend: number;
      totalFrequency: number;
      ages: (number | string)[];
      locations: string[];
    }>();

    rawData.forEach(customer => {
      const segmentName = customer[mapping.segmentField] || 'Uncategorized';
      const spend = mapping.spendField ? Number(customer[mapping.spendField]) || 0 : 0;
      const frequency = mapping.frequencyField ? Number(customer[mapping.frequencyField]) || 0 : 0;
      const age = mapping.ageField ? customer[mapping.ageField] : '';
      const location = mapping.locationField ? String(customer[mapping.locationField]) : '';

      if (!segmentMap.has(segmentName)) {
        segmentMap.set(segmentName, {
          count: 0,
          totalSpend: 0,
          totalFrequency: 0,
          ages: [],
          locations: []
        });
      }

      const segment = segmentMap.get(segmentName)!;
      segment.count += 1;
      segment.totalSpend += spend;
      segment.totalFrequency += frequency;
      if (age) segment.ages.push(age);
      if (location) segment.locations.push(location);
    });

    const newSegments: CustomerSegment[] = [];
    let colorIndex = 0;

    segmentMap.forEach((stats, name) => {
      // Calculate average age range
      let ageRange = '';
      if (stats.ages.length > 0) {
        const numericAges = stats.ages.filter(a => typeof a === 'number' || !isNaN(Number(a)))
          .map(a => typeof a === 'number' ? a : Number(a));
        
        if (numericAges.length > 0) {
          const minAge = Math.min(...numericAges);
          const maxAge = Math.max(...numericAges);
          ageRange = `${Math.floor(minAge/10)*10}-${Math.ceil(maxAge/10)*10}`;
        } else {
          ageRange = stats.ages[0]?.toString() || '';
        }
      }

      // Determine most common location
      let location = '';
      if (stats.locations.length > 0) {
        const locationCounts = stats.locations.reduce((acc, loc) => {
          acc[loc] = (acc[loc] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        location = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0][0];
      }

      newSegments.push({
        id: `auto-${name}-${colorIndex}`,
        name: name,
        value: stats.count,
        color: DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length],
        avgPurchaseValue: stats.count > 0 ? stats.totalSpend / stats.count : 0,
        purchaseFrequency: stats.count > 0 ? stats.totalFrequency / stats.count : 0,
        demographics: {
          ageRange,
          location
        }
      });
      colorIndex++;
    });

    setSegments(newSegments);
  };

  // Calculate derived metrics
  const { totalValue, totalCustomers, avgPurchaseValueOverall, avgFrequencyOverall } = useMemo(() => {
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    const totalCustomers = segments.reduce((sum, segment) => sum + segment.value, 0);
    const weightedPurchase = segments.reduce((sum, segment) => 
      sum + (segment.avgPurchaseValue * segment.value), 0);
    const weightedFrequency = segments.reduce((sum, segment) => 
      sum + (segment.purchaseFrequency * segment.value), 0);
    
    return {
      totalValue: total,
      totalCustomers,
      avgPurchaseValueOverall: totalCustomers > 0 ? weightedPurchase / totalCustomers : 0,
      avgFrequencyOverall: totalCustomers > 0 ? weightedFrequency / totalCustomers : 0
    };
  }, [segments]);

  // Prepare data for charts
  const purchaseData = useMemo(() => segments.map(segment => ({
    name: segment.name,
    avgPurchaseValue: segment.avgPurchaseValue,
    purchaseFrequency: segment.purchaseFrequency,
    color: segment.color,
    customerPercentage: totalValue > 0 ? (segment.value / totalValue * 100) : 0,
    customerCount: segment.value
  })), [segments, totalValue]);

  // Calculate segment performance metrics
  const segmentPerformance = useMemo(() => {
    return segments.map(segment => {
      const segmentPercentage = totalValue > 0 ? (segment.value / totalValue) : 0;
      const valueIndex = segment.avgPurchaseValue / (avgPurchaseValueOverall || 1);
      const frequencyIndex = segment.purchaseFrequency / (avgFrequencyOverall || 1);
      const performanceScore = (valueIndex + frequencyIndex) * segmentPercentage;
      
      return {
        ...segment,
        valueIndex,
        frequencyIndex,
        performanceScore,
        segmentPercentage
      };
    });
  }, [segments, avgPurchaseValueOverall, avgFrequencyOverall, totalValue]);

  // Handle form field changes
  const handleInputChange = (field: string, value: string | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'demographics') {
        setCurrentSegment(prev => ({
          ...prev,
          demographics: {
            ...prev.demographics,
            [child]: value
          }
        }));
      }
    } else {
      setCurrentSegment(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveSegment = () => {
    if (!currentSegment.name || currentSegment.value <= 0) return;

    if (editingId) {
      setSegments(prev => 
        prev.map(seg => 
          seg.id === editingId 
            ? { ...currentSegment, id: editingId, color: seg.color } 
            : seg
        )
      );
    } else {
      const newSegment = {
        ...currentSegment,
        id: Date.now().toString(),
        color: currentSegment.color || DEFAULT_COLORS[segments.length % DEFAULT_COLORS.length]
      };
      setSegments(prev => [...prev, newSegment]);
    }

    setCurrentSegment({
      name: '',
      value: 0,
      color: DEFAULT_COLORS[(segments.length + 1) % DEFAULT_COLORS.length],
      avgPurchaseValue: 0,
      purchaseFrequency: 0,
      demographics: {
        ageRange: '',
        location: ''
      }
    });
    setEditingId(null);
  };

  const handleEditSegment = (id: string) => {
    const segment = segments.find(s => s.id === id);
    if (segment) {
      setCurrentSegment({
        name: segment.name,
        value: segment.value,
        color: segment.color,
        avgPurchaseValue: segment.avgPurchaseValue,
        purchaseFrequency: segment.purchaseFrequency,
        demographics: { ...segment.demographics }
      });
      setEditingId(id);
    }
  };

  const handleDeleteSegment = (id: string) => {
    setSegments(prev => prev.filter(segment => segment.id !== id));
  };

  // Generate insights and recommendations
  const generateRecommendation = (segment: CustomerSegment) => {
    const segmentPerf = segmentPerformance.find(s => s.id === segment.id);
    if (!segmentPerf) return "No recommendation available.";

    if (segmentPerf.performanceScore > 1.5) {
      return "High-value segment! Focus on retention with exclusive offers.";
    } else if (segmentPerf.performanceScore > 1) {
      return "Performing well. Consider upselling opportunities.";
    } else if (segmentPerf.performanceScore > 0.5) {
      return "Average performance. Test targeted promotions.";
    } else {
      return "Underperforming. Investigate pain points.";
    }
  };

  const generateStrategicInsights = () => {
    if (segments.length === 0) return null;

    const insights = [];
    const largestSegment = [...segments].sort((a, b) => b.value - a.value)[0];
    insights.push(
      `Largest segment: "${largestSegment.name}" (${Math.round(largestSegment.value / totalValue * 100)}% of customers)`
    );

    const highestValueSegment = [...segments].sort((a, b) => 
      (b.avgPurchaseValue * b.purchaseFrequency) - (a.avgPurchaseValue * a.purchaseFrequency)
    )[0];
    insights.push(
      `Highest value segment: "${highestValueSegment.name}" ($${(highestValueSegment.avgPurchaseValue * highestValueSegment.purchaseFrequency).toFixed(2)} monthly value per customer)`
    );

    return insights;
  };

  const handleMappingChange = (field: string, value: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Process data from dashboard input when component mounts
  useMemo(() => {
    if (data.fields && data.fields.length > 0) {
      const dashboardData = columnarToRows(data.fields);
      processDashboardData(dashboardData);
    }
  }, [data.fields]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-black">Customer Segmentation Analysis</h1>
      
      {rawData.length > 0 && (
        <>
          <div className="pt-4">
            <h3 className="text-md font-medium text-black mb-2">Field Mapping</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-black">Segment Field</Label>
                <select
                  value={mapping.segmentField}
                  onChange={(e) => handleMappingChange('segmentField', e.target.value)}
                  className="w-full p-2 border rounded text-black"
                >
                  <option value="">Select field</option>
                  {data.fields && data.fields.length > 0 && data.fields.map(field => (
                    <option key={field.name} value={field.name}>{field.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-black">Spend Field</Label>
                <select
                  value={mapping.spendField}
                  onChange={(e) => handleMappingChange('spendField', e.target.value)}
                  className="w-full p-2 border rounded text-black"
                >
                  <option value="">Select field</option>
                  {data.fields && data.fields.length > 0 && data.fields.map(field => (
                    <option key={field.name} value={field.name}>{field.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-black">Frequency Field</Label>
                <select
                  value={mapping.frequencyField}
                  onChange={(e) => handleMappingChange('frequencyField', e.target.value)}
                  className="w-full p-2 border rounded text-black"
                >
                  <option value="">Select field</option>
                  {data.fields && data.fields.length > 0 && data.fields.map(field => (
                    <option key={field.name} value={field.name}>{field.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-black">Age Field</Label>
                <select
                  value={mapping.ageField}
                  onChange={(e) => handleMappingChange('ageField', e.target.value)}
                  className="w-full p-2 border rounded text-black"
                >
                  <option value="">Select field</option>
                  {data.fields && data.fields.length > 0 && data.fields.map(field => (
                    <option key={field.name} value={field.name}>{field.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-black">Location Field</Label>
                <select
                  value={mapping.locationField}
                  onChange={(e) => handleMappingChange('locationField', e.target.value)}
                  className="w-full p-2 border rounded text-black"
                >
                  <option value="">Select field</option>
                  {data.fields && data.fields.length > 0 && data.fields.map(field => (
                    <option key={field.name} value={field.name}>{field.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              onClick={generateSegmentsFromData}
              disabled={!mapping.segmentField}
              className="text-black"
            >
              Generate Segments
            </Button>
          </div>
          
          <div className="pt-4">
            <h3 className="text-md font-medium text-black mb-2">Data Preview</h3>
            <div className="max-h-60 overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(rawData[0]).map(key => (
                      <th key={`th-${key}`} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rawData.slice(0, 5).map((row, i) => (
                    <tr key={`row-${i}`}>
                      {Object.values(row).map((val, j) => (
                        <td key={`cell-${i}-${j}`} className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {val instanceof Date
                            ? val.toISOString()
                            : typeof val === 'object'
                              ? JSON.stringify(val)
                              : String(val)
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-1">Showing first 5 rows of {rawData.length} total</p>
          </div>
        </>
      )}

      {/* Manual Segment Management */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-black">
          {editingId ? 'Edit Segment' : 'Add New Segment'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-black">Segment Name</Label>
            <Input
              value={currentSegment.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Loyal Customers"
              className="text-black"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-black">Number of Customers</Label>
            <Input
              type="number"
              value={currentSegment.value}
              onChange={(e) => handleInputChange('value', Number(e.target.value))}
              min="0"
              placeholder="Customer count"
              className="text-black"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-black">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={currentSegment.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-12 h-10 p-1"
              />
              <span className="text-sm text-black">
                {currentSegment.color}
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-black">Avg Purchase Value ($)</Label>
            <Input
              type="number"
              value={currentSegment.avgPurchaseValue}
              onChange={(e) => handleInputChange('avgPurchaseValue', Number(e.target.value))}
              min="0"
              placeholder="Average spend"
              className="text-black"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-black">Purchase Frequency (per month)</Label>
            <Input
              type="number"
              value={currentSegment.purchaseFrequency}
              onChange={(e) => handleInputChange('purchaseFrequency', Number(e.target.value))}
              min="0"
              step="0.1"
              placeholder="Purchases per month"
              className="text-black"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-black">Age Range</Label>
            <Input
              value={currentSegment.demographics.ageRange}
              onChange={(e) => handleInputChange('demographics.ageRange', e.target.value)}
              placeholder="e.g., 25-40"
              className="text-black"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-black">Location</Label>
            <Input
              value={currentSegment.demographics.location}
              onChange={(e) => handleInputChange('demographics.location', e.target.value)}
              placeholder="e.g., Urban, Suburban"
              className="text-black"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-2">
          {editingId && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setCurrentSegment({
                  name: '',
                  value: 0,
                  color: DEFAULT_COLORS[segments.length % DEFAULT_COLORS.length],
                  avgPurchaseValue: 0,
                  purchaseFrequency: 0,
                  demographics: {
                    ageRange: '',
                    location: ''
                  }
                });
              }}
              className="text-black"
            >
              Cancel
            </Button>
          )}
          <Button onClick={handleSaveSegment} className="text-black">
            {editingId ? 'Update Segment' : 'Add Segment'}
          </Button>
        </div>
      </Card>

      {/* Analysis Results */}
      {segments.length > 0 ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
              <p className="text-2xl font-bold text-black">{totalCustomers.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Avg. Purchase Value</h3>
              <p className="text-2xl font-bold text-black">${avgPurchaseValueOverall.toFixed(2)}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Avg. Frequency</h3>
              <p className="text-2xl font-bold text-black">{avgFrequencyOverall.toFixed(1)}/month</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Avg. Monthly Value</h3>
              <p className="text-2xl font-bold text-black">${(avgPurchaseValueOverall * avgFrequencyOverall).toFixed(2)}</p>
            </Card>
          </div>

          {/* Insights */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-black">Key Insights</h2>
            <ul className="space-y-3">
              {generateStrategicInsights()?.map((insight, index) => (
                <li key={`insight-${index}`} className="flex items-start">
                  <span className="inline-block w-2 h-2 rounded-full mt-1.5 mr-2 flex-shrink-0 bg-blue-500" />
                  <p className="text-black">{insight}</p>
                </li>
              ))}
            </ul>
          </Card>

          {/* Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <h3 className="text-center font-medium mb-4 text-black">Customer Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => {
                        const percentage = totalValue > 0 
                          ? (value / totalValue * 100).toFixed(0) 
                          : '0';
                        return `${name}: ${percentage}%`;
                      }}
                    >
                      {segments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => {
                        const percentage = totalValue > 0 
                          ? (value / totalValue * 100).toFixed(1) 
                          : '0';
                        return [`${value} (${percentage}%)`, 'Customers'];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-center font-medium mb-4 text-black">Purchase Behavior</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={purchaseData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#0088FE" />
                    <YAxis yAxisId="right" orientation="right" stroke="#FF8042" />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      yAxisId="left" 
                      dataKey="avgPurchaseValue" 
                      fill="#0088FE" 
                      name="Avg Purchase ($)" 
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="purchaseFrequency" 
                      fill="#FF8042" 
                      name="Purchases/Month" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-center font-medium mb-4 text-black">Segment Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={segmentPerformance}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="performanceScore" 
                      fill="#8884d8" 
                      name="Performance Score" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Segment Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-black">Segment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {segmentPerformance.map(segment => (
                <Card key={`detail-${segment.id}`} className="p-4">
                  <div className="flex justify-between items-start">
                    <h4 
                      className="font-medium text-lg"
                      style={{ color: segment.color }}
                    >
                      {segment.name}
                    </h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditSegment(segment.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteSegment(segment.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Customers:</span> {segment.value}
                    </div>
                    <div>
                      <span className="text-gray-500">Share:</span> {(segment.segmentPercentage * 100).toFixed(1)}%
                    </div>
                    <div>
                      <span className="text-gray-500">Avg Spend:</span> ${segment.avgPurchaseValue.toFixed(2)}
                    </div>
                    <div>
                      <span className="text-gray-500">Frequency:</span> {segment.purchaseFrequency.toFixed(1)}/mo
                    </div>
                    <div>
                      <span className="text-gray-500">Monthly Value:</span> ${(segment.avgPurchaseValue * segment.purchaseFrequency).toFixed(2)}
                    </div>
                    <div>
                      <span className="text-gray-500">Performance:</span> {segment.performanceScore.toFixed(2)}
                    </div>
                    <div>
                      <span className="text-gray-500">Age:</span> {segment.demographics.ageRange || 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span> {segment.demographics.location || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t">
                    <p className="text-sm font-medium text-gray-700">Recommendation:</p>
                    <p className="text-sm text-black">{generateRecommendation(segment)}</p>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-black">
            Add segments manually to begin analysis.
          </p>
        </Card>
      )}

      <p className="text-sm text-gray-500">Analyzing {data.fields.length} data fields for segmentation.</p>
    </div>
  );
}