import { useState, useMemo } from 'react';
import { DataField } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PredictiveAnalysisContainerProps {
  data: {
    fields: DataField[];
  };
}

export function PredictiveAnalysisContainer({ data }: PredictiveAnalysisContainerProps) {
  const [activeTab, setActiveTab] = useState('machine-learning');
  
  // Process predictive data
  const predictiveData = useMemo(() => {
    const numericFields = data.fields.filter(field => field.type === 'number');
    const categoricalFields = data.fields.filter(field => field.type === 'string');
    
    return {
      numericFields,
      categoricalFields,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Predictive Analysis Header */}
      <div className="bg-blue-600 text-white px-4 py-2 text-lg font-semibold rounded-md flex items-center gap-2">
        Predictive Analysis
        <span className="text-sm font-normal">
          ({predictiveData.numericFields.length} numeric fields, {predictiveData.categoricalFields.length} categorical fields)
        </span>
      </div>
      
      <Card className="p-4">
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="machine-learning" className="text-black">Machine Learning</TabsTrigger>
              <TabsTrigger value="time-series" className="text-black">Time Series</TabsTrigger>
              <TabsTrigger value="root-cause" className="text-black">Root Cause</TabsTrigger>
              <TabsTrigger value="drill-down" className="text-black">Drill Down</TabsTrigger>
              <TabsTrigger value="clustering" className="text-black">Clustering</TabsTrigger>
            </TabsList>
            
            <TabsContent value="machine-learning" className="mt-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 text-black">Machine Learning Analysis</h3>
                <p className="text-black">Machine learning analysis component will be implemented here.</p>
              </Card>
            </TabsContent>
            
            <TabsContent value="time-series" className="mt-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 text-black">Time Series Analysis</h3>
                <p className="text-black">Time series analysis component will be implemented here.</p>
              </Card>
            </TabsContent>
            
            <TabsContent value="root-cause" className="mt-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 text-black">Root Cause Analysis</h3>
                <p className="text-black">Root cause analysis component will be implemented here.</p>
              </Card>
            </TabsContent>
            
            <TabsContent value="drill-down" className="mt-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 text-black">Drill Down Analysis</h3>
                <p className="text-black">Drill down analysis component will be implemented here.</p>
              </Card>
            </TabsContent>
            
            <TabsContent value="clustering" className="mt-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 text-black">Clustering Analysis</h3>
                <p className="text-black">Clustering analysis component will be implemented here.</p>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 