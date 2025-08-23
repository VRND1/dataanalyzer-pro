import { useMemo } from 'react';
import { Card } from '../../../../components/ui/card';
import { NetworkNode, NetworkEdge, NetworkAnalysis } from '@/utils/analysis/network/NetworkAnalysis';

interface CommunityDetectionProps {
  nodes?: NetworkNode[];
  edges?: NetworkEdge[];
  // Optionally, allow passing fields for internal analysis
  fields?: any[];
}

export function CommunityDetection({ nodes, edges, fields }: CommunityDetectionProps) {
  // Compute clusters (communities) using NetworkAnalysis if nodes/edges not provided
  const { clusters, clusterCount, error } = useMemo(() => {
    try {
      let _nodes = nodes;
      let _edges = edges;
      if ((!_nodes || !_edges) && fields && fields.length >= 2) {
        // If nodes/edges not provided, compute from fields
        const analysis = new NetworkAnalysis(fields);
        const result = analysis.analyze();
        _nodes = result.nodes;
        _edges = result.edges;
      }
      if (!_nodes || !_edges) {
        return { clusters: [], clusterCount: 0, error: 'No network data available.' };
      }
      // Use the same cluster detection as NetworkAnalysis
      const analysis = new NetworkAnalysis(
        fields && fields.length >= 2 ? fields : _nodes.map(n => ({ name: n.id, type: 'number', value: [n.value] }))
      );
      const clusters = analysis['identifyClusters'](_nodes, _edges);
      return { clusters, clusterCount: clusters.length, error: null };
    } catch (e: any) {
      return { clusters: [], clusterCount: 0, error: e.message || 'Community detection failed.' };
    }
  }, [nodes, edges, fields]);

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-black mb-4">Community Detection</h3>
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          <p className="text-gray-700 mb-2">
            {clusterCount > 0
              ? `Detected ${clusterCount} communit${clusterCount === 1 ? 'y' : 'ies'} in the network.`
              : 'No communities detected.'}
          </p>
          {clusters.length > 0 && (
            <div className="space-y-4">
              {clusters.map((cluster, idx) => (
                <div key={idx} className="border rounded p-2 bg-gray-50">
                  <div className="font-semibold text-blue-700 mb-1">Community {idx + 1} ({cluster.size} nodes)</div>
                  <div className="flex flex-wrap gap-2">
                    {[...cluster].map(nodeId => (
                      <span key={nodeId} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {nodeId}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
} 