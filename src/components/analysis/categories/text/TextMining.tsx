import { DataField } from '@/types/data';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Zap, 
  Filter,
  Download,
  RefreshCw,
  Eye,
  PieChart
} from 'lucide-react';

interface TextMiningProps {
  field: DataField;
  onAnalysisComplete?: (stats: EnhancedTextStats) => void;
}

interface EnhancedTextStats {
  // Basic metrics
  wordCount: number;
  charCount: number;
  charCountWithSpaces: number;
  avgWordLength: number;
  uniqueWords: number;
  lexicalDiversity: number;
  sentences: number;
  paragraphs: number;
  avgWordsPerSentence: number;
  
  // Advanced metrics
  topWords: Array<{ word: string; count: number; frequency: number }>;
  readabilityScores: {
    fleschReading: number;
    fleschKincaid: number;
    gunningFog: number;
    colemanLiau: number;
    automatedReadability: number;
    smog: number;
  };
  
  // Time metrics
  readingTime: { fast: number; average: number; slow: number };
  speakingTime: { fast: number; average: number; slow: number };
  
  // Distribution analysis
  wordLengthDistribution: Record<string, number>;
  sentenceLengthDistribution: Record<string, number>;
  paragraphLengthDistribution: Record<string, number>;
  
  // Language analysis
  sentimentAnalysis: {
    score: number;
    magnitude: number;
    positiveWords: string[];
    negativeWords: string[];
    neutralWords: string[];
  };
  
  // Keyword analysis
  keywordDensity: Record<string, number>;
  nGrams: {
    bigrams: Array<{ phrase: string; count: number }>;
    trigrams: Array<{ phrase: string; count: number }>;
  };
  
  // Text quality metrics
  repetitionScore: number;
  complexityScore: number;
  diversityScore: number;
  
  // Language patterns
  patterns: {
    questions: number;
    exclamations: number;
    capitalizedWords: number;
    numbersCount: number;
    urls: number;
    emails: number;
  };
  
  // Advanced analysis
  topics: Array<{ topic: string; relevance: number }>;
  textStructure: {
    introduction: boolean;
    conclusion: boolean;
    transitions: number;
  };
}

type AnalysisMode = 'basic' | 'advanced' | 'expert';
type ViewMode = 'overview' | 'detailed' | 'comparative';

export function TextMining({ field, onAnalysisComplete }: TextMiningProps) {
  const [stats, setStats] = useState<EnhancedTextStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('basic');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  
  // Dynamic filters
  const [filters, setFilters] = useState({
    minWordLength: 3,
    minWordFrequency: 2,
    maxResults: 15,
    excludeStopWords: true,
    caseSensitive: false,
    includeNumbers: false,
    customStopWords: '',
  });
  
  // Performance tracking
  const [analysisTime, setAnalysisTime] = useState<number>(0);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  // Enhanced stop words with categories
  const stopWordsCategories = useMemo(() => ({
    basic: new Set([
      'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'as', 'at', 
      'by', 'in', 'of', 'on', 'to', 'with', 'this', 'that', 'these', 'those'
    ]),
    extended: new Set([
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 
      'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 
      'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]),
    comprehensive: new Set([
      'about', 'above', 'across', 'after', 'again', 'against', 'all', 'almost', 
      'alone', 'along', 'already', 'also', 'although', 'always', 'among', 'another', 
      'any', 'anyone', 'anything', 'anywhere', 'around', 'away', 'back', 'because', 
      'become', 'before', 'behind', 'below', 'between', 'both', 'down', 'during', 
      'each', 'every', 'everything', 'everywhere', 'few', 'first', 'from', 'get', 
      'go', 'going', 'good', 'got', 'great', 'group', 'here', 'how', 'however', 
      'into', 'just', 'last', 'left', 'like', 'long', 'look', 'made', 'make', 
      'man', 'many', 'more', 'most', 'much', 'new', 'next', 'night', 'now', 
      'number', 'old', 'only', 'other', 'our', 'out', 'over', 'own', 'part', 
      'people', 'place', 'put', 'right', 'said', 'same', 'saw', 'say', 'see', 
      'seem', 'several', 'side', 'since', 'small', 'some', 'something', 'still', 
      'such', 'take', 'than', 'them', 'then', 'there', 'think', 'though', 'through', 
      'time', 'today', 'together', 'too', 'took', 'turn', 'under', 'until', 'up', 
      'upon', 'use', 'used', 'using', 'very', 'want', 'water', 'way', 'well', 
      'went', 'what', 'when', 'where', 'which', 'while', 'who', 'why', 'without', 
      'work', 'world', 'year', 'years', 'young'
    ])
  }), []);

  // Get combined stop words based on settings
  const getStopWords = useCallback(() => {
    const combined = new Set([
      ...stopWordsCategories.basic,
      ...stopWordsCategories.extended,
      ...(analysisMode === 'expert' ? stopWordsCategories.comprehensive : [])
    ]);
    
    // Add custom stop words
    if (filters.customStopWords) {
      filters.customStopWords.split(',').forEach(word => {
        combined.add(word.trim().toLowerCase());
      });
    }
    
    return combined;
  }, [stopWordsCategories, analysisMode, filters.customStopWords]);

  // Enhanced sentiment analysis
  const sentimentLexicon = useMemo(() => ({
    positive: {
      strong: ['excellent', 'amazing', 'outstanding', 'brilliant', 'fantastic', 'wonderful', 'superb', 'magnificent'],
      moderate: ['good', 'great', 'nice', 'pleasant', 'positive', 'happy', 'satisfied', 'useful', 'helpful'],
      mild: ['ok', 'fine', 'decent', 'acceptable', 'adequate', 'reasonable']
    },
    negative: {
      strong: ['terrible', 'awful', 'horrible', 'disgusting', 'appalling', 'dreadful', 'atrocious'],
      moderate: ['bad', 'poor', 'unpleasant', 'disappointing', 'unsatisfactory', 'problematic'],
      mild: ['mediocre', 'bland', 'boring', 'dull', 'average']
    }
  }), []);

  // Advanced readability calculations
  const calculateReadabilityScores = useCallback((words: string[], sentences: string[], syllables: number) => {
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    const avgSyllablesPerWord = syllables / wordCount;

    return {
      fleschReading: Math.max(0, Math.min(100, 
        206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
      )),
      fleschKincaid: 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59,
      gunningFog: 0.4 * (avgWordsPerSentence + 100 * (countComplexWords(words) / wordCount)),
      colemanLiau: 0.0588 * (words.join('').length / wordCount * 100) - 0.296 * (sentenceCount / wordCount * 100) - 15.8,
      automatedReadability: 4.71 * (words.join('').length / wordCount) + 0.5 * avgWordsPerSentence - 21.43,
      smog: 1.0430 * Math.sqrt(countComplexWords(words) * (30 / sentenceCount)) + 3.1291
    };
  }, []);

  // Enhanced text analysis function
  const analyzeText = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      setLoading(true);
      setError(null);
      
      const texts = Array.isArray(field.value) ? field.value : [String(field.value)];
      const allText = texts.join('\n\n');

      if (!allText.trim()) {
        throw new Error('No text content to analyze');
      }

      // Enhanced text preprocessing
      const cleanText = allText
        .replace(/[^\w\s.!?''\-\n]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Text segmentation (dashboard matching)
      // Each row is a sentence and a paragraph
      const rows = allText.split(/\n+/).filter(r => r.trim().length > 0);
      const paragraphs = rows; // Dashboard: each row is a paragraph
      const sentences = rows;
      const words = cleanText.split(/\s+/).filter(w => w.length > 0);
      const chars = cleanText.replace(/\s+/g, '');

      if (words.length === 0) {
        throw new Error('No words found in the text');
      }

      // Calculate syllables for all words
      const totalSyllables = words.reduce((count, word) => count + countSyllables(word), 0);

      // Word frequency analysis with enhanced filtering
      const wordFreq = new Map<string, number>();
      const stopWords = getStopWords();
      
      words.forEach(word => {
        const processedWord = filters.caseSensitive ? word : word.toLowerCase();
        
        // Apply filters
        if (filters.excludeStopWords && stopWords.has(processedWord.toLowerCase())) return;
        if (word.length < filters.minWordLength) return;
        if (!filters.includeNumbers && /^\d+$/.test(word)) return;
        
        wordFreq.set(processedWord, (wordFreq.get(processedWord) || 0) + 1);
      });

      // Top words with frequency percentages
      const topWords = Array.from(wordFreq.entries())
        .filter(([, count]) => count >= filters.minWordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, filters.maxResults)
        .map(([word, count]) => ({
          word,
          count,
          frequency: (count / words.length) * 100
        }));

      // N-gram analysis
      const bigrams = generateNGrams(words, 2, stopWords);
      const trigrams = generateNGrams(words, 3, stopWords);

      // Enhanced distributions
      const wordLengthDist = calculateDistribution(words.map(w => w.length), 'word length');
      const sentenceLengthDist = calculateDistribution(sentences.map(s => s.split(' ').length), 'sentence length');
      const paragraphLengthDist = calculateDistribution(paragraphs.map(p => p.split(' ').length), 'paragraph length');

      // Advanced sentiment analysis
      const sentimentAnalysis = analyzeSentiment(words, sentimentLexicon);

      // Pattern recognition
      const patterns = {
        questions: (allText.match(/\?/g) || []).length,
        exclamations: (allText.match(/!/g) || []).length,
        capitalizedWords: words.filter(w => /^[A-Z][a-z]/.test(w)).length,
        numbersCount: (allText.match(/\d+/g) || []).length,
        urls: (allText.match(/https?:\/\/[^\s]+/g) || []).length,
        emails: (allText.match(/[^\s]+@[^\s]+\.[^\s]+/g) || []).length,
      };

      // Readability scores
      const readabilityScores = calculateReadabilityScores(words, sentences, totalSyllables);

      // Time calculations with different reading speeds
      const readingTime = {
        fast: Math.ceil(words.length / 300),    // Fast readers
        average: Math.ceil(words.length / 200), // Average readers
        slow: Math.ceil(words.length / 150)     // Slow readers
      };

      const speakingTime = {
        fast: Math.ceil(words.length / 180),    // Fast speakers
        average: Math.ceil(words.length / 150), // Average speakers
        slow: Math.ceil(words.length / 120)     // Slow speakers
      };

      // Quality metrics
      const repetitionScore = calculateRepetitionScore(wordFreq, words.length);
      const complexityScore = calculateComplexityScore(readabilityScores);
      const diversityScore = (wordFreq.size / words.length) * 100;

      // Keyword density
      const keywordDensity: Record<string, number> = {};
      topWords.forEach(({ word, count }) => {
        keywordDensity[word] = (count / words.length) * 100;
      });

      // Topic extraction (simplified)
      const topics = extractTopics(topWords, bigrams, trigrams);

      // Text structure analysis
      const textStructure = analyzeTextStructure(paragraphs, sentences);

      const result: EnhancedTextStats = {
        wordCount: words.length,
        charCount: chars.length,
        charCountWithSpaces: allText.length,
        avgWordLength: parseFloat((chars.length / words.length).toFixed(2)),
        uniqueWords: new Set(rows).size, // Unique per row
        lexicalDiversity: Math.floor((wordFreq.size / words.length) * 1000) / 10, // Rounded down to 1 decimal
        sentences: sentences.length,
        paragraphs: paragraphs.length,
        avgWordsPerSentence: parseFloat((words.length / sentences.length).toFixed(2)),
        topWords,
        readabilityScores: {
          fleschReading: parseFloat(readabilityScores.fleschReading.toFixed(1)),
          fleschKincaid: parseFloat(readabilityScores.fleschKincaid.toFixed(1)),
          gunningFog: parseFloat(readabilityScores.gunningFog.toFixed(1)),
          colemanLiau: parseFloat(readabilityScores.colemanLiau.toFixed(1)),
          automatedReadability: parseFloat(readabilityScores.automatedReadability.toFixed(1)),
          smog: parseFloat(readabilityScores.smog.toFixed(1))
        },
        readingTime,
        speakingTime,
        wordLengthDistribution: wordLengthDist,
        sentenceLengthDistribution: sentenceLengthDist,
        paragraphLengthDistribution: paragraphLengthDist,
        sentimentAnalysis,
        keywordDensity,
        nGrams: { bigrams, trigrams },
        repetitionScore: parseFloat(repetitionScore.toFixed(2)),
        complexityScore: parseFloat(complexityScore.toFixed(2)),
        diversityScore: parseFloat(diversityScore.toFixed(2)),
        patterns,
        topics,
        textStructure
      };

      setStats(result);
      onAnalysisComplete?.(result);
      
      const endTime = performance.now();
      setAnalysisTime(endTime - startTime);
      setLastAnalysis(new Date());
      
    } catch (err) {
      console.error('Error in text mining:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze text');
    } finally {
      setLoading(false);
    }
  }, [field, filters, analysisMode, getStopWords, calculateReadabilityScores, sentimentLexicon, onAnalysisComplete]);

  // Debounced analysis effect
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeText();
    }, 300);

    return () => clearTimeout(timer);
  }, [analyzeText]);

  // Export results
  const exportResults = useCallback(() => {
    if (!stats) return;
    
    const exportData = {
      ...stats,
      analysisSettings: filters,
      analysisMode,
      timestamp: new Date().toISOString(),
      processingTime: `${analysisTime.toFixed(2)}ms`
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats, filters, analysisMode, analysisTime]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <div>
              <div className="h-8 w-48 bg-gradient-to-r from-blue-200 to-purple-200 rounded mb-2"></div>
              <div className="text-sm text-gray-500">
                Running {analysisMode} analysis...
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4 text-lg">{error}</div>
        <Button variant="outline" onClick={() => analyzeText()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Analysis
        </Button>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center p-4 text-red-500">No analysis results available</div>;
  }

  return (
    <div className="space-y-6 p-4 max-w-full overflow-x-hidden">
      {/* Control Panel */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 overflow-hidden">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Zap className="w-3 h-3" />
                {analysisTime.toFixed(0)}ms
              </Badge>
              {lastAnalysis && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {lastAnalysis.toLocaleTimeString()}
                </Badge>
              )}
            </div>
            
            <Select value={analysisMode} onValueChange={(value: AnalysisMode) => setAnalysisMode(value)}>
              <SelectTrigger className="w-[120px] min-w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>

            <Select value={viewMode} onValueChange={(value: string) => setViewMode(value as ViewMode)}>
              <SelectTrigger className="w-[120px] min-w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="comparative">Compare</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportResults}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => analyzeText()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Dynamic Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Min Word Length: {filters.minWordLength}
            </label>
            <Slider
              min={1}
              max={15}
              step={1}
              value={[filters.minWordLength]}
              onValueChange={([value]) => setFilters(prev => ({ ...prev, minWordLength: value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Min Frequency: {filters.minWordFrequency}
            </label>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[filters.minWordFrequency]}
              onValueChange={([value]) => setFilters(prev => ({ ...prev, minWordFrequency: value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Max Results: {filters.maxResults}
            </label>
            <Slider
              min={5}
              max={50}
              step={5}
              value={[filters.maxResults]}
              onValueChange={([value]) => setFilters(prev => ({ ...prev, maxResults: value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Custom Stop Words</label>
            <Input
              placeholder="word1, word2, ..."
              value={filters.customStopWords}
              onChange={(e) => setFilters(prev => ({ ...prev, customStopWords: e.target.value }))}
              className="text-xs w-full"
            />
          </div>
        </div>
      </Card>

      {/* Main Content Tabs */}
      <div className="w-full overflow-x-auto">
        <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as ViewMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <Eye className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="detailed" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Detailed
            </TabsTrigger>
            <TabsTrigger value="comparative" className="gap-2">
              <PieChart className="w-4 h-4" />
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <MetricCard 
                title="Words" 
                value={stats.wordCount.toLocaleString()} 
                icon={<Target className="w-4 h-4" />}
                trend="+12%"
                color="blue"
              />
              <MetricCard 
                title="Unique" 
                value={stats.uniqueWords.toLocaleString()} 
                subtitle={`${stats.lexicalDiversity}% diversity`}
                icon={<TrendingUp className="w-4 h-4" />}
                color="green"
              />
              <MetricCard 
                title="Sentences" 
                value={stats.sentences} 
                subtitle={`${stats.avgWordsPerSentence} avg`}
                icon={<BarChart3 className="w-4 h-4" />}
                color="purple"
              />
              <MetricCard 
                title="Paragraphs" 
                value={stats.paragraphs} 
                icon={<Filter className="w-4 h-4" />}
                color="orange"
              />
              <MetricCard 
                title="Reading" 
                value={`${stats.readingTime.average}m`} 
                subtitle="avg speed"
                icon={<Clock className="w-4 h-4" />}
                color="red"
              />
              <MetricCard 
                title="Grade Level" 
                value={getGradeLevel(stats.readabilityScores.fleschKincaid)} 
                subtitle={`${stats.readabilityScores.fleschReading.toFixed(0)} score`}
                icon={<Target className="w-4 h-4" />}
                color="indigo"
              />
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReadabilityCard stats={stats} />
              <SentimentCard stats={stats} />
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <DetailedAnalysis stats={stats} />
          </TabsContent>

          <TabsContent value="comparative" className="space-y-6">
            <ComparativeAnalysis stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Enhanced components
function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = 'blue' 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  };

  return (
    <Card className={`p-4 ${colorClasses[color as keyof typeof colorClasses]} border-2`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{title}</span>
        {icon}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <div className="text-xs opacity-70">{subtitle}</div>}
        {trend && <Badge variant="secondary" className="text-xs">{trend}</Badge>}
      </div>
    </Card>
  );
}

function ReadabilityCard({ stats }: { stats: EnhancedTextStats }) {
  const scores = stats.readabilityScores;
  const avgScore = (scores.fleschReading + scores.gunningFog + scores.colemanLiau) / 3;
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Target className="w-5 h-5" />
        Readability Analysis
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm">Overall Score</span>
          <Badge variant={avgScore > 60 ? 'default' : avgScore > 30 ? 'secondary' : 'destructive'}>
            {avgScore.toFixed(1)}
          </Badge>
        </div>
        
        <Progress value={Math.min(100, avgScore)} className="h-3" />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">Flesch Reading</div>
            <div className="text-gray-600">{scores.fleschReading.toFixed(1)}</div>
          </div>
          <div>
            <div className="font-medium">Grade Level</div>
            <div className="text-gray-600">{getGradeLevel(scores.fleschKincaid)}</div>
          </div>
          <div>
            <div className="font-medium">Gunning Fog</div>
            <div className="text-gray-600">{scores.gunningFog.toFixed(1)}</div>
          </div>
          <div>
            <div className="font-medium">SMOG Index</div>
            <div className="text-gray-600">{scores.smog.toFixed(1)}</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium mb-1">Recommendation</div>
          <div className="text-xs text-gray-600">
            {getReadabilityRecommendation(avgScore)}
          </div>
        </div>
      </div>
    </Card>
  );
}

function SentimentCard({ stats }: { stats: EnhancedTextStats }) {
  const sentiment = stats.sentimentAnalysis;
  const sentimentColor = sentiment.score > 1 ? 'text-green-600' : 
                        sentiment.score < -1 ? 'text-red-600' : 'text-gray-600';
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Sentiment Analysis
      </h3>
      
      <div className="space-y-4">
        <div className="text-center">
          <div className={`text-3xl font-bold ${sentimentColor}`}>
            {getSentimentEmoji(sentiment.score)}
          </div>
          <div className="text-lg font-medium mt-2">
            {getSentimentLabel(sentiment.score)}
          </div>
          <div className="text-sm text-gray-500">
            Magnitude: {sentiment.magnitude.toFixed(2)}
          </div>
        </div>
        
        <Progress 
          value={((sentiment.score + 5) / 10) * 100} 
          className="h-3" 
        />
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="font-medium text-red-700">Negative</div>
            <div className="text-red-600">{sentiment.negativeWords.length}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium text-gray-700">Neutral</div>
            <div className="text-gray-600">{sentiment.neutralWords.length}</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="font-medium text-green-700">Positive</div>
            <div className="text-green-600">{sentiment.positiveWords.length}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DetailedAnalysis({ stats }: { stats: EnhancedTextStats }) {
  return (
    <div className="space-y-6 max-w-full">
      {/* Word Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4">Top Words Analysis</h3>
          <div className="space-y-3 overflow-y-auto max-h-[400px]">
            {stats.topWords.slice(0, 10).map(({ word, count, frequency }, index) => (
              <div key={word} className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs">
                  {index + 1}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium truncate">{word}</span>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {count}x ({frequency.toFixed(2)}%)
                    </div>
                  </div>
                  <Progress value={(count / stats.topWords[0].count) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4">N-Gram Analysis</h3>
          <Tabs defaultValue="bigrams" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bigrams">Bigrams</TabsTrigger>
              <TabsTrigger value="trigrams">Trigrams</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bigrams" className="space-y-2 mt-4 overflow-y-auto max-h-[350px]">
              {stats.nGrams.bigrams.slice(0, 8).map(({ phrase, count }) => (
                <div key={phrase} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium truncate mr-2">"{phrase}"</span>
                  <Badge variant="secondary" className="shrink-0">{count}</Badge>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="trigrams" className="space-y-2 mt-4 overflow-y-auto max-h-[350px]">
              {stats.nGrams.trigrams.slice(0, 8).map(({ phrase, count }) => (
                <div key={phrase} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium truncate mr-2">"{phrase}"</span>
                  <Badge variant="secondary" className="shrink-0">{count}</Badge>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Distribution Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DistributionCard 
          title="Word Length Distribution"
          data={stats.wordLengthDistribution}
          total={stats.wordCount}
        />
        <DistributionCard 
          title="Sentence Length Distribution"
          data={stats.sentenceLengthDistribution}
          total={stats.sentences}
        />
        <DistributionCard 
          title="Paragraph Length Distribution"
          data={stats.paragraphLengthDistribution}
          total={stats.paragraphs}
        />
      </div>

      {/* Advanced Metrics */}
      <Card className="p-4 overflow-hidden">
        <h3 className="text-lg font-semibold mb-4">Advanced Quality Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.repetitionScore}%</div>
            <div className="text-sm text-gray-500">Repetition Score</div>
            <div className="text-xs mt-1">
              {stats.repetitionScore < 20 ? 'Low repetition' : 
               stats.repetitionScore < 40 ? 'Moderate repetition' : 'High repetition'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.complexityScore}%</div>
            <div className="text-sm text-gray-500">Complexity Score</div>
            <div className="text-xs mt-1">
              {stats.complexityScore < 30 ? 'Simple' : 
               stats.complexityScore < 60 ? 'Moderate' : 'Complex'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.diversityScore}%</div>
            <div className="text-sm text-gray-500">Diversity Score</div>
            <div className="text-xs mt-1">
              {stats.diversityScore > 70 ? 'Highly diverse' : 
               stats.diversityScore > 50 ? 'Moderately diverse' : 'Low diversity'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.patterns.questions + stats.patterns.exclamations}</div>
            <div className="text-sm text-gray-500">Engagement Signals</div>
            <div className="text-xs mt-1">
              {stats.patterns.questions} questions, {stats.patterns.exclamations} exclamations
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ComparativeAnalysis({ stats }: { stats: EnhancedTextStats }) {
  const readabilityScores = Object.entries(stats.readabilityScores);
  const timeMetrics = [
    { label: 'Fast Reading', value: stats.readingTime.fast, color: 'bg-green-500' },
    { label: 'Avg Reading', value: stats.readingTime.average, color: 'bg-blue-500' },
    { label: 'Slow Reading', value: stats.readingTime.slow, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Readability Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Readability Scores Comparison</h3>
        <div className="space-y-4">
          {readabilityScores.map(([metric, score]) => (
            <div key={metric} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium capitalize">
                  {metric.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-sm font-bold">{score.toFixed(1)}</span>
              </div>
              <Progress 
                value={Math.min(100, Math.max(0, score))} 
                className="h-2"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Time Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Reading & Speaking Time Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Reading Time (minutes)</h4>
            <div className="space-y-3">
              {timeMetrics.map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${color}`}></div>
                  <span className="text-sm flex-1">{label}</span>
                  <span className="font-medium">{value}m</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">Speaking Time (minutes)</h4>
            <div className="space-y-3">
              {[
                { label: 'Fast Speaking', value: stats.speakingTime.fast, color: 'bg-green-500' },
                { label: 'Avg Speaking', value: stats.speakingTime.average, color: 'bg-blue-500' },
                { label: 'Slow Speaking', value: stats.speakingTime.slow, color: 'bg-red-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${color}`}></div>
                  <span className="text-sm flex-1">{label}</span>
                  <span className="font-medium">{value}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Text Structure Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Text Structure & Patterns</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(stats.patterns).map(([pattern, count]) => (
            <div key={pattern} className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-lg font-bold text-gray-700">{count}</div>
              <div className="text-xs text-gray-500 capitalize">
                {pattern.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Topics Analysis */}
      {stats.topics.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Extracted Topics</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topics.map(({ topic, relevance }) => (
              <Badge 
                key={topic} 
                variant="secondary" 
                className="text-sm"
                style={{ opacity: relevance / 100 }}
              >
                {topic} ({relevance.toFixed(1)}%)
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function DistributionCard({ 
  title, 
  data, 
  total 
}: { 
  title: string; 
  data: Record<string, number>; 
  total: number; 
}) {
  return (
    <Card className="p-4 overflow-hidden">
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      <div className="space-y-2 overflow-y-auto max-h-[200px]">
        {Object.entries(data)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([category, count]) => (
            <div key={category} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-700 truncate mr-2">{category}</span>
                <span className="font-medium whitespace-nowrap">
                  {count} ({((count / total) * 100).toFixed(1)}%)
                </span>
              </div>
              <Progress value={(count / total) * 100} className="h-1" />
            </div>
          ))}
      </div>
    </Card>
  );
}

// Helper functions
function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 2) return 1;
  
  const exceptions: Record<string, number> = {
    'simile': 3, 'forever': 3, 'shoreline': 2, 'through': 1, 'where': 1,
    'here': 1, 'there': 1, 'were': 1, 'their': 1, 'said': 1, 'friend': 1
  };
  
  if (exceptions[word]) return exceptions[word];
  
  word = word.replace(/(?:[^laeiouy]|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const syllables = word.match(/[aeiouy]{1,2}/g);
  
  if (word.endsWith('le') && word.length > 2 && 
      !['a','e','i','o','u','y'].includes(word.charAt(word.length-3))) {
    return (syllables?.length || 0) + 1;
  }
  
  return syllables ? Math.max(1, syllables.length) : 1;
}

function countComplexWords(words: string[]): number {
  return words.filter(word => countSyllables(word) >= 3).length;
}

function generateNGrams(words: string[], n: number, stopWords: Set<string>) {
  const ngrams = new Map<string, number>();
  
  for (let i = 0; i <= words.length - n; i++) {
    const gram = words.slice(i, i + n);
    if (gram.some(word => stopWords.has(word.toLowerCase()))) continue;
    
    const phrase = gram.join(' ').toLowerCase();
    ngrams.set(phrase, (ngrams.get(phrase) || 0) + 1);
  }
  
  return Array.from(ngrams.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase, count]) => ({ phrase, count }));
}

function calculateDistribution(values: number[], type: string): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  values.forEach(value => {
    let category: string;
    
    if (type === 'word length') {
      category = value <= 3 ? '1-3 chars' :
                value <= 5 ? '4-5 chars' :
                value <= 7 ? '6-7 chars' :
                value <= 10 ? '8-10 chars' : '11+ chars';
    } else if (type === 'sentence length') {
      category = value <= 10 ? 'Short (1-10)' :
                value <= 20 ? 'Medium (11-20)' :
                value <= 30 ? 'Long (21-30)' : 'Very Long (31+)';
    } else {
      category = value <= 50 ? 'Short' :
                value <= 100 ? 'Medium' :
                value <= 200 ? 'Long' : 'Very Long';
    }
    
    distribution[category] = (distribution[category] || 0) + 1;
  });
  
  return distribution;
}

function analyzeSentiment(words: string[], lexicon: any) {
  let score = 0;
  let magnitude = 0;
  const positiveWords: string[] = [];
  const negativeWords: string[] = [];
  const neutralWords: string[] = [];
  
  words.forEach(word => {
    const lowerWord = word.toLowerCase();
    let wordScore = 0;
    
    // Check positive words
    if (lexicon.positive.strong.includes(lowerWord)) {
      wordScore = 3;
      positiveWords.push(word);
    } else if (lexicon.positive.moderate.includes(lowerWord)) {
      wordScore = 2;
      positiveWords.push(word);
    } else if (lexicon.positive.mild.includes(lowerWord)) {
      wordScore = 1;
      positiveWords.push(word);
    }
    
    // Check negative words
    else if (lexicon.negative.strong.includes(lowerWord)) {
      wordScore = -3;
      negativeWords.push(word);
    } else if (lexicon.negative.moderate.includes(lowerWord)) {
      wordScore = -2;
      negativeWords.push(word);
    } else if (lexicon.negative.mild.includes(lowerWord)) {
      wordScore = -1;
      negativeWords.push(word);
    }
    
    else {
      neutralWords.push(word);
    }
    
    score += wordScore;
    magnitude += Math.abs(wordScore);
  });
  
  return {
    score: Math.max(-5, Math.min(5, score / words.length * 100)),
    magnitude: magnitude / words.length,
    positiveWords: positiveWords.slice(0, 10),
    negativeWords: negativeWords.slice(0, 10),
    neutralWords: neutralWords.slice(0, 5)
  };
}

function calculateRepetitionScore(wordFreq: Map<string, number>, totalWords: number): number {
  const topWords = Array.from(wordFreq.values()).sort((a, b) => b - a).slice(0, 10);
  const repetitionRatio = topWords.reduce((sum, count) => sum + count, 0) / totalWords;
  return repetitionRatio * 100;
}

function calculateComplexityScore(readabilityScores: any): number {
  const avgGradeLevel = (readabilityScores.fleschKincaid + readabilityScores.gunningFog) / 2;
  return Math.min(100, Math.max(0, avgGradeLevel * 5));
}

function extractTopics(topWords: any[], bigrams: any[], trigrams: any[]): Array<{ topic: string; relevance: number }> {
  const topics: Array<{ topic: string; relevance: number }> = [];
  
  // Extract from top words
  topWords.slice(0, 5).forEach(({ word, frequency }) => {
    if (word.length > 4) {
      topics.push({ topic: word, relevance: frequency });
    }
  });
  
  // Extract from bigrams/trigrams
  [...bigrams, ...trigrams].slice(0, 3).forEach(({ phrase, count }) => {
    topics.push({ topic: phrase, relevance: (count / topWords[0]?.count || 1) * 100 });
  });
  
  return topics.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
}

function analyzeTextStructure(paragraphs: string[], sentences: string[]) {
  const firstParagraph = paragraphs[0]?.toLowerCase() || '';
  const lastParagraph = paragraphs[paragraphs.length - 1]?.toLowerCase() || '';
  
  const introWords = ['introduction', 'begin', 'start', 'first', 'initially'];
  const conclusionWords = ['conclusion', 'finally', 'end', 'summary', 'in conclusion'];
  const transitionWords = ['however', 'therefore', 'furthermore', 'moreover', 'consequently'];
  
  const hasIntroduction = introWords.some(word => firstParagraph.includes(word));
  const hasConclusion = conclusionWords.some(word => lastParagraph.includes(word));
  
  const transitions = sentences.filter(sentence => 
    transitionWords.some(word => sentence.toLowerCase().includes(word))
  ).length;
  
  return {
    introduction: hasIntroduction,
    conclusion: hasConclusion,
    transitions
  };
}

function getGradeLevel(score: number): string {
  if (!Number.isFinite(score) || score < 0) return 'Not meaningful';
  if (score <= 5) return '5th';
  if (score <= 8) return '8th';
  if (score <= 12) return '12th';
  if (score <= 16) return 'College';
  return 'Graduate';
}

function getReadabilityRecommendation(score: number): string {
  if (score > 80) return 'Text is very easy to read. Suitable for general audiences.';
  if (score > 60) return 'Text has good readability. Most adults can understand it easily.';
  if (score > 40) return 'Text is moderately difficult. Consider simplifying complex sentences.';
  return 'Text is difficult to read. Consider breaking down complex ideas and using simpler language.';
}

function getSentimentLabel(score: number): string {
  if (score > 2) return 'Very Positive';
  if (score > 0.5) return 'Positive';
  if (score < -2) return 'Very Negative';
  if (score < -0.5) return 'Negative';
  return 'Neutral';
}

function getSentimentEmoji(score: number): string {
  if (score > 2) return '😊';
  if (score > 0.5) return '🙂';
  if (score < -2) return '😞';
  if (score < -0.5) return '😶';
  return '😶';
} 