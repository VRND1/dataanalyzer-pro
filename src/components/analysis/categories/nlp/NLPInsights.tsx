import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Tag, 
  FileText, 
  Smile, 
  Frown, 
  Meh, 
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Info,
  BarChart3,
  Zap,
  Brain,
  Eye,
  Target,
  Layers
} from 'lucide-react';

interface NLPInsightsProps {
  sentiment: {
    score: number;
    label: string;
    confidence: number;
    magnitude?: number;
    mixed?: boolean;
  };
  keywords: {
    text: string;
    relevance: number;
    category?: string;
    mentions?: number;
  }[];
  summary: string;
  categories: {
    label: string;
    confidence: number;
    subcategories?: string[];
  }[];
  entities?: {
    text: string;
    type: string;
    confidence: number;
    mentions: number;
  }[];
  emotions?: {
    label: string;
    confidence: number;
  }[];
  complexity?: {
    readabilityScore: number;
    avgWordsPerSentence: number;
    uniqueWordsRatio: number;
    level: string;
  };
  loading?: boolean;
  error?: string | null;
}

export default function NLPInsights({ 
  sentiment, 
  keywords = [], 
  summary, 
  categories = [], 
  entities = [],
  emotions = [],
  complexity,
  loading = false, 
  error = null
}: NLPInsightsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'entities' | 'emotions' | 'complexity'>('overview');
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate sentiment score
  useEffect(() => {
    if (sentiment?.confidence) {
      const timer = setTimeout(() => {
        setAnimatedScore(sentiment.confidence * 100);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sentiment?.confidence]);

  const getSentimentColor = (label: string, includeBackground = false) => {
    const colors = {
      positive: includeBackground ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-emerald-600',
      negative: includeBackground ? 'bg-red-50 text-red-700 border-red-200' : 'text-red-600',
      neutral: includeBackground ? 'bg-amber-50 text-amber-700 border-amber-200' : 'text-amber-600',
      mixed: includeBackground ? 'bg-purple-50 text-purple-700 border-purple-200' : 'text-purple-600'
    };
    return colors[label as keyof typeof colors] || colors.neutral;
  };

  const getSentimentIcon = (label: string, trend?: 'up' | 'down' | 'stable') => {
    const iconClass = `w-5 h-5 ${getSentimentColor(label)}`;
    
    if (trend === 'up') return <TrendingUp className={iconClass} />;
    if (trend === 'down') return <TrendingDown className={iconClass} />;
    if (trend === 'stable') return <Minus className={iconClass} />;
    
    switch (label) {
      case 'positive':
        return <Smile className={iconClass} />;
      case 'negative':
        return <Frown className={iconClass} />;
      case 'mixed':
        return <AlertCircle className={iconClass} />;
      default:
        return <Meh className={iconClass} />;
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.9) return { label: 'Very High', color: 'text-green-600', bgColor: 'bg-green-500' };
    if (confidence >= 0.7) return { label: 'High', color: 'text-blue-600', bgColor: 'bg-blue-500' };
    if (confidence >= 0.5) return { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    if (confidence >= 0.3) return { label: 'Low', color: 'text-orange-600', bgColor: 'bg-orange-500' };
    return { label: 'Very Low', color: 'text-red-600', bgColor: 'bg-red-500' };
  };

  const getReadabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Brain className="w-6 h-6 text-indigo-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Analyzing Content...</h3>
              <p className="text-sm text-gray-500">Processing natural language insights</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
                <div className="h-6 bg-gray-100 rounded-lg w-full animate-pulse"></div>
                <div className="flex gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-8 bg-gray-100 rounded-full w-20 animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Analysis Error</h3>
              <p className="text-sm text-gray-500">Failed to process content</p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">{error}</p>
            <p className="text-red-600 text-sm mt-2">
              Please check your input and try again. Ensure the text is readable and in a supported language.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'keywords', label: 'Keywords', icon: Tag },
    { id: 'entities', label: 'Entities', icon: Target },
    { id: 'emotions', label: 'Emotions', icon: Zap },
    { id: 'complexity', label: 'Readability', icon: BarChart3 }
  ].filter(tab => {
    if (tab.id === 'entities' && (!entities || entities.length === 0)) return false;
    if (tab.id === 'emotions' && (!emotions || emotions.length === 0)) return false;
    if (tab.id === 'complexity' && !complexity) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">NLP Analysis Insights</h3>
            <p className="text-indigo-100 text-sm">Advanced text understanding and sentiment analysis</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Sentiment Analysis */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Sentiment Analysis
                </h4>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getSentimentColor(sentiment.label, true)}`}>
                  {getSentimentIcon(sentiment.label)}
                  <span className="font-semibold capitalize">
                    {sentiment.label}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Confidence</span>
                    <span className={`text-sm font-bold ${getConfidenceLevel(sentiment.confidence).color}`}>
                      {getConfidenceLevel(sentiment.confidence).label}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ease-out ${getConfidenceLevel(sentiment.confidence).bgColor}`}
                        style={{ width: `${animatedScore}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round(sentiment.confidence * 100)}% confident
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-600">Sentiment Score</span>
                  <div className="text-2xl font-bold text-gray-800">
                    {sentiment.score > 0 ? '+' : ''}{sentiment.score.toFixed(3)}
                  </div>
                  <span className="text-xs text-gray-500">Range: -1.0 to +1.0</span>
                </div>

                {sentiment.magnitude !== undefined && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-600">Magnitude</span>
                    <div className="text-2xl font-bold text-gray-800">
                      {sentiment.magnitude.toFixed(2)}
                    </div>
                    <span className="text-xs text-gray-500">Emotional intensity</span>
                  </div>
                )}
              </div>

              {sentiment.mixed && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Mixed Sentiment Detected</span>
                  </div>
                  <p className="text-xs text-purple-700 mt-1">
                    This text contains both positive and negative sentiments.
                  </p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Intelligent Summary
              </h4>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{summary}</p>
              </div>
            </div>

            {/* Top Categories */}
            {categories.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Content Categories
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.slice(0, 4).map((category, index) => {
                    const confidenceLevel = getConfidenceLevel(category.confidence);
                    return (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800">{category.label}</span>
                          <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${confidenceLevel.color}`}>
                            {confidenceLevel.label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${confidenceLevel.bgColor}`}
                            style={{ width: `${category.confidence * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {Math.round(category.confidence * 100)}% match
                          </span>
                          {category.subcategories && category.subcategories.length > 0 && (
                            <span className="text-xs text-indigo-600">
                              +{category.subcategories.length} subtopics
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'keywords' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-800">Key Terms & Phrases</h4>
              <span className="text-sm text-gray-500">{keywords.length} terms found</span>
            </div>
            
            <div className="grid gap-4">
              {keywords
                .sort((a, b) => b.relevance - a.relevance)
                .map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-indigo-600">#{index + 1}</div>
                      <div>
                        <span className="font-medium text-gray-800">{keyword.text}</span>
                        {keyword.category && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                            {keyword.category}
                          </span>
                        )}
                        {keyword.mentions && (
                          <p className="text-xs text-gray-500 mt-1">
                            Mentioned {keyword.mentions} time{keyword.mentions !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">
                        {Math.round(keyword.relevance * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">relevance</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'entities' && entities && entities.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-800">Named Entities</h4>
              <span className="text-sm text-gray-500">{entities.length} entities detected</span>
            </div>
            
            <div className="grid gap-4">
              {entities.map((entity, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{entity.text}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase">
                        {entity.type}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {Math.round(entity.confidence * 100)}% confidence
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${entity.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {entity.mentions} mention{entity.mentions !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'emotions' && emotions && emotions.length > 0 && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-800">Emotional Analysis</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emotions
                .sort((a, b) => b.confidence - a.confidence)
                .map((emotion, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-800 capitalize">{emotion.label}</span>
                      <span className="text-sm font-medium text-purple-600">
                        {Math.round(emotion.confidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-3">
                      <div
                        className="h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${emotion.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'complexity' && complexity && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-800">Readability Analysis</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-3xl font-bold ${getReadabilityColor(complexity.readabilityScore)}`}>
                  {complexity.readabilityScore}
                </div>
                <div className="text-sm text-gray-600 mt-1">Readability Score</div>
                <div className="text-xs text-gray-500 mt-2">
                  {complexity.level}
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {complexity.avgWordsPerSentence.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Avg Words</div>
                <div className="text-xs text-gray-500 mt-2">per sentence</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(complexity.uniqueWordsRatio * 100)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Unique Words</div>
                <div className="text-xs text-gray-500 mt-2">vocabulary diversity</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {complexity.level.charAt(0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Reading Level</div>
                <div className="text-xs text-gray-500 mt-2">{complexity.level}</div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-800 mb-2">Readability Insights</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• {complexity.readabilityScore >= 80 ? 'Very easy to read' : complexity.readabilityScore >= 60 ? 'Easy to read' : complexity.readabilityScore >= 40 ? 'Moderate difficulty' : complexity.readabilityScore >= 20 ? 'Difficult to read' : 'Very difficult to read'}</li>
                <li>• Average sentence length: {complexity.avgWordsPerSentence > 20 ? 'Long sentences may reduce readability' : complexity.avgWordsPerSentence > 15 ? 'Moderate sentence length' : 'Short, clear sentences'}</li>
                <li>• Vocabulary diversity: {complexity.uniqueWordsRatio > 0.7 ? 'High vocabulary variety' : complexity.uniqueWordsRatio > 0.5 ? 'Good vocabulary variety' : 'Limited vocabulary variety'}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 