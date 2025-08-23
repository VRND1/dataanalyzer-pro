import { useState } from 'react';
import SWOTAnalysis from './SWOTAnalysis';
import { SWOTAnalysis as SWOTData } from '@/utils/analysis/swot/types';

export default function SWOTTest() {
  const [showSWOT, setShowSWOT] = useState(false);

  // Sample SWOT data for demonstration
  const sampleSWOTData: SWOTData = {
    strengths: [
      { description: "Strong brand recognition in the market", impact: "high" },
      { description: "Experienced management team", impact: "high" },
      { description: "Proprietary technology platform", impact: "medium" },
      { description: "Strong customer relationships", impact: "medium" }
    ],
    weaknesses: [
      { description: "Limited financial resources for expansion", impact: "high" },
      { description: "Small market share compared to competitors", impact: "medium" },
      { description: "Limited product portfolio", impact: "medium" },
      { description: "Dependency on key suppliers", impact: "low" }
    ],
    opportunities: [
      { description: "Growing market demand for our services", impact: "high" },
      { description: "Emerging technology trends we can leverage", impact: "high" },
      { description: "Potential for international expansion", impact: "medium" },
      { description: "Strategic partnerships with larger companies", impact: "medium" }
    ],
    threats: [
      { description: "Intense competition from established players", impact: "high" },
      { description: "Economic uncertainty affecting customer spending", impact: "high" },
      { description: "Rapid technological changes", impact: "medium" },
      { description: "Regulatory changes in the industry", impact: "medium" }
    ],
    score: {
      internal: 0.65,    // 65% - strengths outweigh weaknesses
      external: 0.45,    // 45% - threats slightly outweigh opportunities
      overall: 0.55,     // 55% - overall positive position
      confidence: 0.85   // 85% confidence in the analysis
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">SWOT Analysis Demo</h1>
        <p className="text-gray-600 mb-6">
          This demonstrates how the SWOT Analysis component works with sample business data.
        </p>
        
        <button
          onClick={() => setShowSWOT(!showSWOT)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showSWOT ? 'Hide SWOT Analysis' : 'Show SWOT Analysis'}
        </button>
      </div>

      {showSWOT && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Sample Data Used:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 4 Strengths (2 high impact, 2 medium impact)</li>
              <li>• 4 Weaknesses (1 high impact, 2 medium impact, 1 low impact)</li>
              <li>• 4 Opportunities (2 high impact, 2 medium impact)</li>
              <li>• 4 Threats (2 high impact, 2 medium impact)</li>
              <li>• Scores: Internal 65%, External 45%, Overall 55%</li>
            </ul>
          </div>
          
          <SWOTAnalysis analysis={sampleSWOTData} />
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">How to Use:</h3>
            <ol className="text-sm text-green-700 space-y-1">
              <li>1. Import the SWOTAnalysis component</li>
              <li>2. Prepare your SWOT data in the required format</li>
              <li>3. Pass the data as the 'analysis' prop</li>
              <li>4. The component will automatically render the SWOT grid and scores</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
} 