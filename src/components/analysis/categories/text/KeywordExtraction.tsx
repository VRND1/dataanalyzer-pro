import { DataField } from '@/types/data';
import { Card } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KeywordExtractionProps {
  field: DataField;
  maxKeywords?: number;
  minWordLength?: number;
  customStopWords?: string[];
  fileType?: 'text' | 'csv' | 'json' | 'html' | 'markdown' | 'auto';
}

interface Keyword {
  term: string;
  frequency: number;
  score: number;
  density: number;
  positions: number[];
}

interface KeywordStats {
  totalWords: number;
  uniqueWords: number;
  avgWordLength: number;
  lexicalDiversity: number;
  topKeywordDensity: number;
}

export function KeywordExtraction({ 
  field, 
  maxKeywords = 30,
  minWordLength = 2,
  customStopWords = [],
  fileType = 'auto'
}: KeywordExtractionProps) {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [stats, setStats] = useState<KeywordStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced stop words list
  const defaultStopWords = useMemo(() => new Set([
    // Common English stop words
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
    'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now', 'i', 'me', 'my',
    'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
    'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
    'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what',
    'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
    'does', 'did', 'doing', 'would', 'could', 'should', 'ought', 'might', 'must',
    // Common technical/file-related words
    'null', 'undefined', 'true', 'false', 'var', 'let', 'const', 'function', 'return',
    'if', 'else', 'for', 'while', 'break', 'continue', 'try', 'catch', 'throw',
    ...customStopWords
  ]), [customStopWords]);

  // Dynamic text extraction based on file type and content structure
  const extractTextContent = (fieldData: DataField): string => {
    try {
      let textContent = '';

      if (!fieldData.value || (Array.isArray(fieldData.value) && fieldData.value.length === 0)) {
        return '';
      }

      // Handle different data structures
      if (Array.isArray(fieldData.value)) {
        textContent = fieldData.value.map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            return JSON.stringify(item);
          }
          return String(item);
        }).join(' ');
      } else if (typeof fieldData.value === 'object' && fieldData.value !== null) {
        textContent = JSON.stringify(fieldData.value);
      } else {
        textContent = String(fieldData.value);
      }

      // File type specific processing
      switch (fileType) {
        case 'html':
          // Remove HTML tags and decode entities
          textContent = textContent
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&[a-z]+;/gi, ' ');
          break;
        
        case 'markdown':
          // Remove markdown syntax
          textContent = textContent
            .replace(/#{1,6}\s/g, '') // Headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
            .replace(/\*(.*?)\*/g, '$1') // Italic
            .replace(/`(.*?)`/g, '$1') // Code
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
            .replace(/!\[.*?\]\(.*?\)/g, '') // Images
            .replace(/^\s*[-\*\+]\s/gm, '') // Lists
            .replace(/^\s*\d+\.\s/gm, ''); // Numbered lists
          break;
        
        case 'json':
          // Extract meaningful text from JSON, skip keys and common JSON syntax
          textContent = textContent
            .replace(/[{}\[\]",:]/g, ' ')
            .replace(/\b(true|false|null)\b/gi, '');
          break;
        
        case 'csv':
          // Replace commas and common CSV delimiters with spaces
          textContent = textContent.replace(/[,;|\t]/g, ' ');
          break;
      }

      return textContent;
    } catch (error) {
      console.error('Error extracting text content:', error);
      return '';
    }
  };

  // Advanced keyword extraction with position tracking
  const extractKeywords = (text: string): { keywords: Keyword[], stats: KeywordStats } => {
    if (!text.trim()) {
      return { 
        keywords: [], 
        stats: { 
          totalWords: 0, 
          uniqueWords: 0, 
          avgWordLength: 0, 
          lexicalDiversity: 0, 
          topKeywordDensity: 0 
        } 
      };
    }

    // Clean and normalize text
    const cleanText = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Extract words
    const words = cleanText
      .split(/\s+/)
      .filter(word => 
        word.length >= minWordLength && 
        !defaultStopWords.has(word) &&
        !/^\d+$/.test(word) // Exclude pure numbers
      );

    // Calculate frequencies and positions
    const wordData: { [key: string]: { frequency: number; positions: number[] } } = {};
    words.forEach((word, index) => {
      if (!wordData[word]) {
        wordData[word] = { frequency: 0, positions: [] };
      }
      wordData[word].frequency++;
      wordData[word].positions.push(index);
    });

    // Create keyword objects with enhanced metrics
    const keywordArray: Keyword[] = Object.entries(wordData)
      .map(([term, data]) => ({
        term,
        frequency: data.frequency,
        score: data.frequency / words.length,
        density: (data.frequency / words.length) * 100,
        positions: data.positions
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, maxKeywords);

    // Calculate statistics
    const totalWords = words.length;
    const uniqueWords = Object.keys(wordData).length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / totalWords;
    const lexicalDiversity = uniqueWords / totalWords;
    const topKeywordDensity = keywordArray[0]?.density || 0;

    return {
      keywords: keywordArray,
      stats: {
        totalWords,
        uniqueWords,
        avgWordLength: Math.round(avgWordLength * 100) / 100,
        lexicalDiversity: Math.round(lexicalDiversity * 100) / 100,
        topKeywordDensity: Math.round(topKeywordDensity * 100) / 100
      }
    };
  };

  useEffect(() => {
    const performExtraction = async () => {
      setLoading(true);
      setError(null);

      try {
        const textContent = extractTextContent(field);
        
        if (!textContent.trim()) {
          setError('No extractable text content found in the field.');
          setKeywords([]);
          setStats(null);
          return;
        }

        const { keywords: extractedKeywords, stats: extractedStats } = extractKeywords(textContent);
        
        setKeywords(extractedKeywords);
        setStats(extractedStats);
      } catch (error) {
        console.error('Error during keyword extraction:', error);
        setError('An error occurred while extracting keywords.');
      } finally {
        setLoading(false);
      }
    };

    performExtraction();
  }, [field, maxKeywords, minWordLength, fileType, defaultStopWords]);

  // Prepare chart data
  const chartData = useMemo(() => 
    keywords.slice(0, 10).map(keyword => ({
      term: keyword.term.length > 12 ? keyword.term.substring(0, 12) + '...' : keyword.term,
      frequency: keyword.frequency,
      density: keyword.density
    }))
  , [keywords]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Analyzing keywords...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="text-red-600 font-medium">Error</div>
        <div className="text-red-500 text-sm mt-1">{error}</div>
      </Card>
    );
  }

  if (keywords.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        <div className="text-lg font-medium">No keywords found</div>
        <div className="text-sm mt-1">The content may be too short or contain only common words.</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalWords}</div>
            <div className="text-sm text-gray-600">Total Words</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.uniqueWords}</div>
            <div className="text-sm text-gray-600">Unique Words</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.avgWordLength}</div>
            <div className="text-sm text-gray-600">Avg Word Length</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.lexicalDiversity}</div>
            <div className="text-sm text-gray-600">Lexical Diversity</div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords List */}
        <Card className="p-6">
          <h4 className="font-semibold text-lg mb-4">Top Keywords</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {keywords.slice(0, 15).map((keyword, index) => (
              <div key={keyword.term} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium">{keyword.term}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{keyword.frequency}</div>
                  <div className="text-xs text-gray-500">{keyword.density.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Frequency Chart */}
        <Card className="p-6">
          <h4 className="font-semibold text-lg mb-4">Keyword Frequency</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="term" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === 'frequency' ? 'Frequency' : 'Density (%)']}
                labelFormatter={(label) => `Keyword: ${label}`}
              />
              <Bar dataKey="frequency" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Keyword Cloud */}
      <Card className="p-6">
        <h4 className="font-semibold text-lg mb-4">Keyword Distribution</h4>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => {
            const sizeMultiplier = Math.max(0.8, Math.min(2, keyword.score * 10));
            const opacity = Math.max(0.6, Math.min(1, 0.6 + keyword.score * 4));
            
            return (
              <span
                key={keyword.term}
                className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 rounded-full border border-blue-200 hover:shadow-md transition-all duration-200 cursor-default"
                style={{
                  fontSize: `${sizeMultiplier * 0.875}rem`,
                  opacity: opacity,
                  fontWeight: index < 5 ? 'bold' : 'normal'
                }}
                title={`Frequency: ${keyword.frequency} | Density: ${keyword.density.toFixed(2)}%`}
              >
                {keyword.term}
              </span>
            );
          })}
        </div>
      </Card>

      {/* Advanced Insights */}
      {stats && (
        <Card className="p-6">
          <h4 className="font-semibold text-lg mb-4">Content Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Content Density:</span>{' '}
              {stats.lexicalDiversity > 0.7 ? 'High' : stats.lexicalDiversity > 0.4 ? 'Medium' : 'Low'} vocabulary diversity
            </div>
            <div>
              <span className="font-medium">Top Keyword Dominance:</span>{' '}
              {stats.topKeywordDensity > 5 ? 'High' : stats.topKeywordDensity > 2 ? 'Medium' : 'Low'} ({stats.topKeywordDensity}%)
            </div>
            <div>
              <span className="font-medium">Content Type:</span>{' '}
              {fileType === 'auto' ? 'Auto-detected' : fileType.toUpperCase()}
            </div>
            <div>
              <span className="font-medium">Processing:</span>{' '}
              {keywords.length} of {stats.uniqueWords} unique words analyzed
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 