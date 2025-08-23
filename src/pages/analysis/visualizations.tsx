import { useState, useMemo } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  ScatterChart, 
  TrendingUp, 
  Download, 
  Share2, 
  Settings,
  AlertCircle,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { ChartView } from '@/components/visualization/ChartView';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'radar';

interface VisualizationConfig {
  type: ChartType;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  colorScheme: string;
}

const visualizationConfigs: VisualizationConfig[] = [
  {
    type: 'bar',
    title: 'Bar Chart',
    description: 'Compare values across categories',
    icon: BarChart3,
    colorScheme: 'default'
  },
  {
    type: 'line',
    title: 'Line Chart',
    description: 'Show trends over time or sequences',
    icon: LineChart,
    colorScheme: 'gradient'
  },
  {
    type: 'pie',
    title: 'Pie Chart',
    description: 'Show proportions and percentages',
    icon: PieChart,
    colorScheme: 'pastel'
  },
  {
    type: 'scatter',
    title: 'Scatter Plot',
    description: 'Show relationships between variables',
    icon: ScatterChart,
    colorScheme: 'vibrant'
  },
  {
    type: 'radar',
    title: 'Radar Chart',
    description: 'Compare multiple variables',
    icon: TrendingUp,
    colorScheme: 'monochrome'
  }
];

export function VisualizationsPage() {
  const { results, isAnalyzing, error } = useAnalysis();
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('bar');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const numericFields = useMemo(() => {
    if (!results?.fields) return [];
    return results.fields.filter(field => field.type === 'number');
  }, [results?.fields]);

  const textFields = useMemo(() => {
    if (!results?.fields) return [];
    return results.fields.filter(field => field.type === 'string');
  }, [results?.fields]);

  const dataQualityScore = useMemo(() => {
    if (!results?.dataQuality) return null;
    const { completeness, validity } = results.dataQuality;
    return Math.round((completeness + validity) / 2);
  }, [results?.dataQuality]);

  const handleFieldToggle = (fieldName: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldName) 
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName]
    );
  };

  const handleExportChart = () => {
    // TODO: Implement chart export functionality
    console.log('Exporting chart...');
  };

  const handleShareChart = () => {
    // TODO: Implement chart sharing functionality
    console.log('Sharing chart...');
  };

  if (isAnalyzing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading visualizations: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
              Data Visualizations
            </CardTitle>
            <CardDescription>
              Upload and analyze your data to see interactive visualizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Data Available
              </h3>
              <p className="text-gray-600 mb-6">
                Please upload a dataset to view visualizations and insights.
              </p>
              <Button variant="outline">
                Upload Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentConfig = visualizationConfigs.find(config => config.type === selectedChartType);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Visualizations</h1>
            <p className="text-gray-600 mt-1">
              Interactive charts and insights from your data analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportChart}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareChart}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Data Quality Indicator */}
        {dataQualityScore !== null && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Data Quality Score</span>
                  </div>
                  <Badge variant={dataQualityScore >= 80 ? "default" : dataQualityScore >= 60 ? "secondary" : "destructive"}>
                    {dataQualityScore}%
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Completeness: {results.dataQuality?.completeness}%</span>
                  <span>Validity: {results.dataQuality?.validity}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="custom">Custom Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Chart Type Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Chart Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {visualizationConfigs.map((config) => {
                    const Icon = config.icon;
                    return (
                      <Button
                        key={config.type}
                        variant={selectedChartType === config.type ? "default" : "outline"}
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => setSelectedChartType(config.type)}
                      >
                        <Icon className="h-5 w-5" />
                        <div className="text-center">
                          <div className="font-medium text-sm">{config.title}</div>
                          <div className="text-xs opacity-70">{config.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>

                {/* Field Selection */}
                {numericFields.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Select Fields:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFields(numericFields.map(f => f.name))}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFields([])}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {numericFields.map((field) => (
                        <Button
                          key={field.name}
                          variant={selectedFields.includes(field.name) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFieldToggle(field.name)}
                          className="flex items-center gap-2"
                        >
                          {selectedFields.includes(field.name) ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {field.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={showStats ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowStats(!showStats)}
                  >
                    {showStats ? "Hide" : "Show"} Statistics
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Main Chart */}
            {numericFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {currentConfig && <currentConfig.icon className="h-5 w-5" />}
                    {currentConfig?.title || 'Data Visualization'}
                  </CardTitle>
                  <CardDescription>
                    {currentConfig?.description || 'Interactive data visualization'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[500px]">
                    <ChartView
                      data={numericFields}
                      type={selectedChartType}
                      title={`${currentConfig?.title} - Data Overview`}
                      selectedFields={selectedFields.length > 0 ? selectedFields : numericFields.map(f => f.name)}
                      showStats={showStats}
                      colorScheme={currentConfig?.colorScheme || 'default'}
                      onError={(error) => console.error('Chart error:', error)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Numeric Fields</p>
                      <p className="text-2xl font-bold">{numericFields.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Text Fields</p>
                      <p className="text-2xl font-bold">{textFields.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Total Fields</p>
                      <p className="text-2xl font-bold">{results.fields?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">Insights</p>
                      <p className="text-2xl font-bold">{results.insights?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analysis</CardTitle>
                <CardDescription>
                  Advanced visualizations and statistical analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Detailed analysis features coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Charts</CardTitle>
                <CardDescription>
                  Create and customize your own visualizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Custom chart builder coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default VisualizationsPage; 