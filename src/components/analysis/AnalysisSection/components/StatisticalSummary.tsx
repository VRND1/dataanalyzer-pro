import { Calculator, Info, Filter, Sliders } from 'lucide-react';
import type { DataField } from '@/types/data';
import type { AnalyzedData } from '@/types/analysis';
import { FieldStats } from './FieldStats';
import { AnalysisHeader } from './AnalysisHeader';
import { BasicStats } from '../../categories/descriptive/BasicStats';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface StatisticalSummaryProps {
  data: {
    fields: DataField[];
  };
  results: AnalyzedData | null;
}

export function StatisticalSummary({ data }: StatisticalSummaryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Filter numeric fields based on search and selection
  const numericFields = data.fields.filter(f => 
    f.type === 'number' && 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedFields.length === 0 || selectedFields.includes(f.name))
  );

  const toggleFieldSelection = (fieldName: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldName)
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName]
    );
  };

  if (data.fields.filter(f => f.type === 'number').length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <AnalysisHeader 
          title="Statistical Analysis" 
          icon={<Calculator className="w-5 h-5 text-black" />}
        />
        <div className="text-center py-8 text-gray-500">
          <p>No numeric fields found in the dataset.</p>
          <p className="text-sm mt-2">Statistical analysis requires numeric data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <AnalysisHeader 
          title="Statistical Analysis" 
          icon={<Calculator className="w-5 h-5 text-black" />}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {numericFields.map(field => (
            <FieldStats key={field.name} field={field} />
          ))}
        </div>
      </div>

      {/* Basic Statistics Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <AnalysisHeader title="Basic Statistics" />
        <div className="space-y-6">
          {numericFields.map(field => (
            <div key={field.name} className="border-t pt-4 first:border-t-0 first:pt-0">
              <h4 className="font-medium text-gray-900 mb-4">{field.name}</h4>
              <BasicStats field={field} />
            </div>
          ))}
        </div>
      </div>

      {/* Controls Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search numeric fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={showAdvanced ? "default" : "outline"}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <Sliders className="mr-2 h-4 w-4" />
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle advanced statistical options</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {showAdvanced && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2 mb-4">
              <Switch 
                id="field-selection" 
                checked={selectedFields.length > 0}
                onCheckedChange={(checked: boolean) => {
                  if (!checked) setSelectedFields([]);
                }}
              />
              <Label htmlFor="field-selection">
                Select specific fields to analyze
              </Label>
            </div>

            {selectedFields.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {data.fields
                  .filter(f => f.type === 'number')
                  .map(field => (
                    <div key={field.name} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`field-${field.name}`}
                        checked={selectedFields.includes(field.name)}
                        onChange={() => toggleFieldSelection(field.name)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label htmlFor={`field-${field.name}`} className="text-sm">
                        {field.name}
                      </Label>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">
            <div className="flex items-center gap-2">
              <span>Basic Statistics</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Count, sum, mean, median, min, max, range</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TabsTrigger>
          <TabsTrigger value="detailed">
            <div className="flex items-center gap-2">
              <span>Detailed Analysis</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Variance, standard deviation, quartiles, outliers</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          {numericFields.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 mt-4">
              {numericFields.map(field => (
                <div key={field.name} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium">{field.name}</h5>
                    <span className="text-sm text-gray-500">
                      {field.value.length} samples
                    </span>
                  </div>
                  <BasicStats field={field} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No matching numeric fields found.</p>
              <p className="text-sm mt-2">Try adjusting your search or field selection.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="detailed">
          {numericFields.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {numericFields.map(field => (
                <FieldStats key={field.name} field={field} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No matching numeric fields found.</p>
              <p className="text-sm mt-2">Try adjusting your search or field selection.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Data Quality Note */}
      {numericFields.length > 0 && (
        <div className="mt-6 text-sm text-gray-500 flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Analysis accuracy depends on data quality. Missing or invalid values are automatically 
            excluded from calculations. For large datasets, consider sampling for better performance.
          </p>
        </div>
      )}
    </div>
  );
}