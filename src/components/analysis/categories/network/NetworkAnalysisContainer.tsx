import { useState, useMemo } from 'react';
import { DataField } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import your analysis class and NetworkView component
import { NetworkAnalysis, NetworkAnalysisResult } from '@/utils/analysis/network/NetworkAnalysis';
import { GraphTheory } from './GraphTheory';
import { FunnelAnalysis } from './FunnelAnalysis';
import { CohortAnalysis } from './CohortAnalysis';
import { PathAnalysis } from './PathAnalysis';
import { CommunityDetection } from './CommunityDetection';
// Import Centrality
import { Centrality } from './Centrality';

interface NetworkAnalysisContainerProps {
  data: {
    fields: DataField[];
  };
}

export function NetworkAnalysisContainer({ data }: NetworkAnalysisContainerProps) {
  const [activeTab, setActiveTab] = useState('graph-theory');

  // Run network analysis on numeric fields
  const analysisResult = useMemo<NetworkAnalysisResult | null>(() => {
    try {
      const numericFields = data.fields.filter(field => field.type === 'number');
      if (numericFields.length < 2) return null; // not enough data for analysis
      const analysis = new NetworkAnalysis(numericFields);
      return analysis.analyze();
    } catch (error) {
      console.error('Network analysis error:', error);
      return null;
    }
  }, [data.fields]);

  // Extract counts for header display
  const numericFieldsCount = data.fields.filter(f => f.type === 'number').length;
  const categoricalFieldsCount = data.fields.filter(f => f.type === 'string').length;

  // Prepare graphData for Centrality if analysisResult is available
  const centralityGraphData = analysisResult
    ? {
        nodes: analysisResult.nodes.map(n => ({
          id: n.id,
          label: n.id,
          x: Math.random() * 100,
          y: Math.random() * 100
        })),
        edges: analysisResult.edges.map(e => ({ source: e.source, target: e.target }))
      }
    : undefined;

  // Debug logs
  console.log('analysisResult:', analysisResult);
  console.log('Nodes:', analysisResult?.nodes);
  console.log('Edges:', analysisResult?.edges);
  console.log('centralityGraphData:', centralityGraphData);

  return (
    <div className="space-y-6">
      {/* Network Analysis Header */}
      <div className="bg-blue-600 text-white px-4 py-2 text-lg font-semibold rounded-md flex items-center gap-2">
        Network Analysis
        <span className="text-sm font-normal">
          ({numericFieldsCount} numeric fields, {categoricalFieldsCount} categorical fields)
        </span>
      </div>

      <Card className="p-4">
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="graph-theory" className="text-black">Graph Theory</TabsTrigger>
              <TabsTrigger value="centrality" className="text-black">Centrality</TabsTrigger>
              <TabsTrigger value="community" className="text-black">Community</TabsTrigger>
              <TabsTrigger value="funnel" className="text-black">Funnel</TabsTrigger>
              <TabsTrigger value="cohort" className="text-black">Cohort</TabsTrigger>
              <TabsTrigger value="path" className="text-black">Path</TabsTrigger>
            </TabsList>

            <TabsContent value="graph-theory" className="mt-4">
              {analysisResult ? (
                <GraphTheory nodes={analysisResult.nodes} edges={analysisResult.edges} />
              ) : (
                <p>No sufficient numeric data to perform graph theory analysis.</p>
              )}
            </TabsContent>

            <TabsContent value="centrality" className="mt-4">
              {centralityGraphData ? (
                <Centrality graphData={centralityGraphData} />
              ) : (
                <p>No sufficient numeric data to perform centrality analysis.</p>
              )}
            </TabsContent>

            <TabsContent value="community" className="mt-4">
              {analysisResult ? (
                <CommunityDetection nodes={analysisResult.nodes} edges={analysisResult.edges} />
              ) : (
                <CommunityDetection fields={data.fields} />
              )}
            </TabsContent>

            <TabsContent value="funnel" className="mt-4">
              <FunnelAnalysis data={data} />
            </TabsContent>

            <TabsContent value="cohort" className="mt-4">
              <CohortAnalysis data={data} />
            </TabsContent>

            <TabsContent value="path" className="mt-4">
              <PathAnalysis fields={data.fields} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}