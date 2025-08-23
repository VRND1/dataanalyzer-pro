import React, { useState } from 'react';
import { Shield, AlertTriangle, TrendingUp, AlertOctagon, BarChart3, PieChart,  Eye, EyeOff } from 'lucide-react';

// Types
interface SWOTItem {
  description: string;
  impact?: 'high' | 'medium' | 'low';
  priority?: number;
  category?: string;
}

interface SWOTScore {
  internal: number;
  external: number;
  overall: number;
}

interface SWOTData {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  score: SWOTScore;
}

// Sample data for demonstration
const sampleAnalysis: SWOTData = {
  strengths: [
    { description: "Strong brand recognition and customer loyalty", impact: "high", priority: 9, category: "Brand" },
    { description: "Experienced management team with proven track record", impact: "high", priority: 8, category: "Leadership" },
    { description: "Robust financial position with low debt-to-equity ratio", impact: "medium", priority: 7, category: "Finance" },
    { description: "Advanced technology infrastructure and R&D capabilities", impact: "high", priority: 9, category: "Technology" },
    { description: "Diverse product portfolio reducing market risks", impact: "medium", priority: 6, category: "Product" }
  ],
  weaknesses: [
    { description: "Limited presence in emerging markets", impact: "high", priority: 8, category: "Market" },
    { description: "High operational costs compared to competitors", impact: "medium", priority: 7, category: "Operations" },
    { description: "Slow decision-making processes in large organization", impact: "medium", priority: 6, category: "Management" },
    { description: "Dependence on legacy systems for core operations", impact: "high", priority: 8, category: "Technology" }
  ],
  opportunities: [
    { description: "Growing demand in Asia-Pacific markets", impact: "high", priority: 9, category: "Market" },
    { description: "Digital transformation trends creating new revenue streams", impact: "high", priority: 8, category: "Technology" },
    { description: "Strategic partnerships with key industry players", impact: "medium", priority: 7, category: "Partnerships" },
    { description: "Government incentives for sustainable business practices", impact: "medium", priority: 6, category: "Policy" }
  ],
  threats: [
    { description: "Increasing competition from low-cost providers", impact: "high", priority: 9, category: "Competition" },
    { description: "Economic uncertainty affecting consumer spending", impact: "high", priority: 8, category: "Economic" },
    { description: "Regulatory changes in key markets", impact: "medium", priority: 7, category: "Legal" },
    { description: "Cybersecurity risks and data privacy concerns", impact: "high", priority: 8, category: "Security" }
  ],
  score: {
    internal: 0.72,
    external: 0.58,
    overall: 0.65
  }
};

interface SWOTAnalysisProps {
  analysis?: SWOTData;
}

export default function SWOTAnalysis({ analysis = sampleAnalysis }: SWOTAnalysisProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'detailed'>('grid');
  const [filterBy, setFilterBy] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showPriorities, setShowPriorities] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>(['strengths', 'weaknesses', 'opportunities', 'threats']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const filteredItems = (items: SWOTItem[]) => {
    if (filterBy === 'all') return items;
    return items.filter(item => item.impact === filterBy);
  };

  const getImpactStats = () => {
    const allItems = [...analysis.strengths, ...analysis.weaknesses, ...analysis.opportunities, ...analysis.threats];
    const high = allItems.filter(item => item.impact === 'high').length;
    const medium = allItems.filter(item => item.impact === 'medium').length;
    const low = allItems.filter(item => item.impact === 'low').length;
    return { high, medium, low, total: allItems.length };
  };

  const stats = getImpactStats();

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl shadow-xl border border-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">SWOT Analysis</h2>
          <p className="text-slate-600">Strategic analysis of internal and external factors</p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'detailed' : 'grid')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            {viewMode === 'grid' ? <BarChart3 className="w-4 h-4" /> : <PieChart className="w-4 h-4" />}
            {viewMode === 'grid' ? 'Detailed View' : 'Grid View'}
          </button>
          
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Impact Levels</option>
            <option value="high">High Impact Only</option>
            <option value="medium">Medium Impact Only</option>
            <option value="low">Low Impact Only</option>
          </select>

          <button
            onClick={() => setShowPriorities(!showPriorities)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            {showPriorities ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Priorities
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Items"
          value={stats.total}
          icon={<BarChart3 className="w-5 h-5 text-slate-500" />}
          color="slate"
        />
        <StatCard
          label="High Impact"
          value={stats.high}
          icon={<AlertOctagon className="w-5 h-5 text-red-500" />}
          color="red"
        />
        <StatCard
          label="Medium Impact"
          value={stats.medium}
          icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
          color="yellow"
        />
        <StatCard
          label="Low Impact"
          value={stats.low}
          icon={<Shield className="w-5 h-5 text-green-500" />}
          color="green"
        />
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ScoreCard
          label="Internal Score"
          value={analysis.score.internal}
          description="Strengths vs Weaknesses"
          trend={analysis.score.internal > 0.6 ? 'positive' : analysis.score.internal > 0.4 ? 'neutral' : 'negative'}
        />
        <ScoreCard
          label="External Score"
          value={analysis.score.external}
          description="Opportunities vs Threats"
          trend={analysis.score.external > 0.6 ? 'positive' : analysis.score.external > 0.4 ? 'neutral' : 'negative'}
        />
        <ScoreCard
          label="Overall Score"
          value={analysis.score.overall}
          description="Combined Performance"
          trend={analysis.score.overall > 0.6 ? 'positive' : analysis.score.overall > 0.4 ? 'neutral' : 'negative'}
        />
      </div>

      {/* SWOT Grid */}
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        <SWOTSection
          title="Strengths"
          items={filteredItems(analysis.strengths)}
          icon={<Shield className="w-6 h-6 text-green-600" />}
          className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
          isExpanded={expandedSections.includes('strengths')}
          onToggle={() => toggleSection('strengths')}
          showPriorities={showPriorities}
          viewMode={viewMode}
        />
        <SWOTSection
          title="Weaknesses"
          items={filteredItems(analysis.weaknesses)}
          icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
          isExpanded={expandedSections.includes('weaknesses')}
          onToggle={() => toggleSection('weaknesses')}
          showPriorities={showPriorities}
          viewMode={viewMode}
        />
        <SWOTSection
          title="Opportunities"
          items={filteredItems(analysis.opportunities)}
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
          isExpanded={expandedSections.includes('opportunities')}
          onToggle={() => toggleSection('opportunities')}
          showPriorities={showPriorities}
          viewMode={viewMode}
        />
        <SWOTSection
          title="Threats"
          items={filteredItems(analysis.threats)}
          icon={<AlertOctagon className="w-6 h-6 text-red-600" />}
          className="bg-gradient-to-br from-red-50 to-red-100 border-red-200"
          isExpanded={expandedSections.includes('threats')}
          onToggle={() => toggleSection('threats')}
          showPriorities={showPriorities}
          viewMode={viewMode}
        />
      </div>

      {/* Action Items */}
      <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Key Strategic Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <h4 className="font-medium text-green-700 mb-2">Leverage Strengths</h4>
            <p className="text-sm text-slate-600">
              Focus on high-impact strengths like brand recognition and technology capabilities to maximize competitive advantage.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <h4 className="font-medium text-red-700 mb-2">Address Critical Threats</h4>
            <p className="text-sm text-slate-600">
              Develop strategies to mitigate high-priority threats, especially increasing competition and economic uncertainty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    slate: 'bg-slate-50 border-slate-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200'
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color as keyof typeof colorClasses]} transition-all hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

interface ScoreCardProps {
  label: string;
  value: number;
  description: string;
  trend: 'positive' | 'neutral' | 'negative';
}

function ScoreCard({ label, value, description, trend }: ScoreCardProps) {
  const percentage = (value * 100).toFixed(1);
  
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'neutral': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getProgressColor = (trend: string) => {
    switch (trend) {
      case 'positive': return 'bg-green-500';
      case 'neutral': return 'bg-yellow-500';
      case 'negative': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className={`p-6 rounded-xl border transition-all hover:scale-105 ${getTrendColor(trend)}`}>
      <h3 className="text-sm font-semibold text-slate-700 mb-2">{label}</h3>
      <div className="flex items-end gap-3 mb-3">
        <p className="text-3xl font-bold">{percentage}%</p>
        <div className="flex-1 mb-2">
          <div className="w-full bg-white rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor(trend)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-600">{description}</p>
    </div>
  );
}

interface SWOTSectionProps {
  title: string;
  items: SWOTItem[];
  icon: React.ReactNode;
  className?: string;
  isExpanded: boolean;
  onToggle: () => void;
  showPriorities: boolean;
  viewMode: 'grid' | 'detailed';
}

function SWOTSection({ 
  title, 
  items, 
  icon, 
  className, 
  isExpanded, 
  onToggle, 
  showPriorities,
  viewMode 
}: SWOTSectionProps) {
  const sortedItems = [...items].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return (
    <div className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <span className="px-2 py-1 bg-white bg-opacity-70 rounded-full text-sm font-medium text-slate-700">
            {items.length}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
        >
          {isExpanded ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className={`space-y-3 ${viewMode === 'detailed' ? 'max-h-none' : 'max-h-80 overflow-y-auto'}`}>
          {sortedItems.map((item, index) => (
            <div key={index} className="bg-white bg-opacity-70 p-4 rounded-lg border border-white border-opacity-50 hover:bg-opacity-90 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">{item.description}</p>
                  {item.category && (
                    <span className="inline-block mt-2 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {showPriorities && item.priority && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">Priority:</span>
                      <span className="text-sm font-bold text-slate-700">{item.priority}</span>
                    </div>
                  )}
                  {item.impact && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      item.impact === 'high' ? 'bg-red-100 text-red-700' :
                      item.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.impact} impact
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}