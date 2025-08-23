import { NetworkAnalysisResult } from '@/utils/analysis/network/NetworkAnalysis'; // adjust path as per your project structure
import { GraphTheory } from './GraphTheory';

function NetworkView({ analysisResult }: { analysisResult: NetworkAnalysisResult }) {
  return (
    <GraphTheory
      nodes={analysisResult.nodes}
      edges={analysisResult.edges}
      width={800}
      height={600}
    />
  );
}

export default NetworkView;