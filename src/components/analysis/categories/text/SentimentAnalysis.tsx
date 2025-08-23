import { DataField } from '@/types/data';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { InfoIcon, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SentimentAnalysisProps {
  field: DataField;
  customLexicons?: {
    positive?: string[];
    negative?: string[];
  };
}

type SentimentLabel = 'Positive' | 'Negative' | 'Neutral';

interface SentimentScore {
  score: number;
  label: SentimentLabel;
  confidence: number;
  text: string;
}

interface SentimentStats {
  positive: number;
  negative: number;
  neutral: number;
  average: number;
  strongestPositive: SentimentScore | null;
  strongestNegative: SentimentScore | null;
}

export function SentimentAnalysis({ field, customLexicons }: SentimentAnalysisProps) {
  const [sentiments, setSentiments] = useState<SentimentScore[]>([]);
  const [stats, setStats] = useState<SentimentStats>({
    positive: 0,
    negative: 0,
    neutral: 0,
    average: 0,
    strongestPositive: null,
    strongestNegative: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lexiconInfo, setLexiconInfo] = useState({
    positiveWords: 0,
    negativeWords: 0
  });

  const transformDataToText = (data: any): string[] => {
    console.log('🔍 Transform input data:', { data, type: typeof data, isArray: Array.isArray(data) });
    
    if (!data) {
      throw new Error('No data provided for analysis');
    }
    
    if (Array.isArray(data)) {
      const transformed = data.map((item, index) => {
        console.log(`🔍 Processing item ${index}:`, { item, type: typeof item });
        
        if (typeof item === 'string') {
          return item.trim();
        }
        
        if (typeof item === 'object' && item !== null) {
          if (item.text || item.content || item.message || item.description) {
            return String(item.text || item.content || item.message || item.description);
          }
          
          if (item.productName || item.category || item.review) {
            return `Product: ${item.productName || 'Unknown'}. ` +
                   `Category: ${item.category || 'N/A'}. ` +
                   `Review: ${item.review || 'No review'}. ` +
                   `Rating: ${item.rating || 'N/A'}. ` +
                   `Price: ${item.price || 'N/A'}.`;
          }
          
          try {
            return JSON.stringify(item);
          } catch {
            return String(item);
          }
        }
        
        return String(item);
      }).filter(text => text && text.trim().length > 0);
      
      console.log('🔍 Transformed array result:', transformed);
      return transformed;
    }
    
    if (typeof data === 'string') {
      return [data.trim()];
    }
    
    if (typeof data === 'object' && data !== null) {
      if (data.value && Array.isArray(data.value)) {
        return transformDataToText(data.value);
      }
      
      try {
        return [JSON.stringify(data)];
      } catch {
        return [String(data)];
      }
    }
    
    return [String(data)];
  };

  useEffect(() => {
    const analyzeSentiment = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Starting sentiment analysis');
        console.log('🔍 Field data:', { 
          name: field.name, 
          type: field.type, 
          value: field.value,
          valueType: typeof field.value,
          isArray: Array.isArray(field.value),
          valueLength: Array.isArray(field.value) ? field.value.length : 'not array'
        });
        
        const texts = transformDataToText(field.value);
        console.log('✅ Transformed texts:', texts);
        
        if (!texts.length || texts.every(text => !text || text.trim() === '')) {
          throw new Error('No valid text data to analyze. Please ensure your data contains text content.');
        }

        const validTexts = texts
          .filter(text => text && typeof text === 'string' && text.trim() !== '')
          .map(text => text.trim())
          .filter(text => text.length > 0)
          .slice(0, 100);

        console.log('✅ Valid texts for analysis:', validTexts);

        if (validTexts.length === 0) {
          throw new Error('No valid text data to analyze after filtering. Please check your data format.');
        }

        const positiveWords = customLexicons && Array.isArray(customLexicons.positive) 
          ? customLexicons.positive.filter(word => typeof word === 'string' && word.trim().length > 0)
          : [];
        const negativeWords = customLexicons && Array.isArray(customLexicons.negative)
          ? customLexicons.negative.filter(word => typeof word === 'string' && word.trim().length > 0)
          : [];
        
        const customLexiconsData = {
          positive: positiveWords,
          negative: negativeWords
        };

        const payload = {
          texts: validTexts,
          custom_lexicons: customLexiconsData
        };

        console.log('📦 Final payload:', JSON.stringify(payload, null, 2));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          console.log('🌐 Sending request to API...');
          const response = await fetch('http://localhost:8000/api/sentiment', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          console.log('📥 Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { detail: errorText };
            }
            
            if (response.status === 422) {
              const errorMessage = 'Validation error from API: ' + JSON.stringify(errorData);
              throw new Error(errorMessage);
            }

            const errorDetail = errorData.detail || errorData.error || errorData.message || errorText;
            throw new Error(errorDetail || `API Error (${response.status}): ${response.statusText}`);
          }
          
          const responseText = await response.text();
          console.log('📥 Success Response (raw):', responseText);
          
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error('❌ Failed to parse response as JSON:', parseError);
            throw new Error('Invalid JSON response from API');
          }
          
          console.log('✅ Success Response (parsed):', JSON.stringify(data, null, 2));
          
          if (!data || !data.sentiments || !data.stats) {
            console.error('❌ Invalid response structure:', data);
            throw new Error('Invalid response format from sentiment analysis service');
          }

          // Add debug logging for confidence values
          console.log('🔍 Raw sentiment confidence values:', data.sentiments.map((s: any) => ({
            confidence: s.confidence,
            type: typeof s.confidence,
            text: s.text?.substring(0, 30)
          })));

          // Process sentiments with proper confidence handling
          const processedSentiments = data.sentiments.map((sentiment: any) => ({
            score: parseFloat(sentiment.score) || 0,
            label: sentiment.label || 'Neutral',
            // Handle different confidence formats from API
            confidence: sentiment.confidence !== undefined && sentiment.confidence !== null 
              ? (typeof sentiment.confidence === 'number' 
                  ? sentiment.confidence 
                  : parseFloat(sentiment.confidence) || 0)
              : 0,
            text: sentiment.text || ''
          }));

          console.log('🔧 Processed sentiments with confidence:', processedSentiments);
          
          setSentiments(processedSentiments);
          
          // Process stats with proper data mapping
          const processedStats = {
            positive: parseInt(data.stats.positive) || 0,
            negative: parseInt(data.stats.negative) || 0,
            neutral: parseInt(data.stats.neutral) || 0,
            average: parseFloat(data.stats.average) || 0,
            strongestPositive: data.stats.strongest_positive ? {
              ...data.stats.strongest_positive,
              confidence: data.stats.strongest_positive.confidence !== undefined 
                ? parseFloat(data.stats.strongest_positive.confidence) || 0 
                : 0
            } : null,
            strongestNegative: data.stats.strongest_negative ? {
              ...data.stats.strongest_negative,
              confidence: data.stats.strongest_negative.confidence !== undefined 
                ? parseFloat(data.stats.strongest_negative.confidence) || 0 
                : 0
            } : null
          };

          console.log('🔧 Processed stats:', processedStats);
          setStats(processedStats);

          // Handle lexicon info with multiple possible field names
          const lexiconData = data.lexicon_info || data.lexicon || {};
          console.log('📚 Raw lexicon data from API:', lexiconData);
          
          const positiveCount = parseInt(
            lexiconData.positive_words || 
            lexiconData.positiveWords || 
            lexiconData.positive || 
            lexiconData.pos || 
            0
          );
          
          const negativeCount = parseInt(
            lexiconData.negative_words || 
            lexiconData.negativeWords || 
            lexiconData.negative || 
            lexiconData.neg || 
            0
          );
          
          console.log('🔧 Setting lexicon info:', { positiveCount, negativeCount });
          
          setLexiconInfo({
            positiveWords: positiveCount,
            negativeWords: negativeCount
          });
          
          console.log('✅ Analysis completed successfully');
        } catch (fetchError: unknown) {
          clearTimeout(timeoutId);
          console.error('❌ Fetch error:', fetchError);
          
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            setError('Request timed out after 30 seconds');
          } else {
            setError(fetchError instanceof Error ? fetchError.message : 'Unknown fetch error occurred');
          }
        }
      } catch (error) {
        console.error('❌ Analysis error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    analyzeSentiment();
  }, [field, customLexicons]);

  const total = stats.positive + stats.negative + stats.neutral;
  const getPercentage = (value: number) => total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

  const getSentimentEmoji = (score: number) => {
    if (score > 0.2) return '😊';
    if (score > 0.05) return '🙂';
    if (score < -0.2) return '😠';
    if (score < -0.05) return '😞';
    return '😐';
  };

  // Helper function to format confidence properly
  const formatConfidence = (confidence: number | undefined | null): string => {
    if (confidence === undefined || confidence === null || isNaN(confidence)) {
      return '0%';
    }
    
    // Handle both decimal (0-1) and percentage (0-100) formats
    let percentage: number;
    if (confidence >= 0 && confidence <= 1) {
      percentage = confidence * 100;
    } else if (confidence >= 0 && confidence <= 100) {
      percentage = confidence;
    } else {
      return '0%';
    }
    
    return `${Math.round(percentage)}%`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analyzing sentiment patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h3 className="text-red-800 font-medium">Analysis Error</h3>
        <pre className="text-red-600 text-sm mt-1 whitespace-pre-wrap overflow-x-auto">{error}</pre>
        <div className="mt-3 p-3 bg-gray-100 rounded text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Field type: {field.type}</p>
          <p>Data type: {Array.isArray(field.value) ? 'array' : typeof field.value}</p>
          <p>Data length: {Array.isArray(field.value) ? field.value.length : 'N/A'}</p>
          <p>Sample data: {JSON.stringify(Array.isArray(field.value) ? field.value.slice(0, 2) : field.value).substring(0, 100)}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">      
      {/* Lexicon Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Using {lexiconInfo.positiveWords} positive and {lexiconInfo.negativeWords} negative words</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px]">
              <p>The analysis uses a built-in lexicon of sentiment words. 
                {customLexicons ? ' Custom words were added to improve accuracy.' : ''}
                You can provide your own word lists via the customLexicons prop.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Check if we have actual sentiment data */}
      {sentiments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No sentiment analysis results available.</p>
          <p className="text-sm text-muted-foreground mt-1">Please ensure your data contains text content for analysis.</p>
        </div>
      ) : (
        <>
          {/* Overall Sentiment Distribution */}
          <div>
            <h3 className="text-sm font-medium mb-3">Sentiment Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Positive</h4>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-green-600">{getPercentage(stats.positive)}%</span>
                      <span className="text-sm text-green-600 ml-2">({stats.positive} of {total})</span>
                    </div>
                  </div>
                  <span className="text-2xl">😊</span>
                </div>
                {stats.strongestPositive && (
                  <p className="text-xs text-green-700 mt-2 line-clamp-2">
                    "{stats.strongestPositive.text.substring(0, 60)}{stats.strongestPositive.text.length > 60 ? '...' : ''}"
                  </p>
                )}
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Negative</h4>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-red-600">{getPercentage(stats.negative)}%</span>
                      <span className="text-sm text-red-600 ml-2">({stats.negative} of {total})</span>
                    </div>
                  </div>
                  <span className="text-2xl">😞</span>
                </div>
                {stats.strongestNegative && (
                  <p className="text-xs text-red-700 mt-2 line-clamp-2">
                    "{stats.strongestNegative.text.substring(0, 60)}{stats.strongestNegative.text.length > 60 ? '...' : ''}"
                  </p>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">Neutral</h4>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-gray-600">{getPercentage(stats.neutral)}%</span>
                      <span className="text-sm text-gray-600 ml-2">({stats.neutral} of {total})</span>
                    </div>
                  </div>
                  <span className="text-2xl">😐</span>
                </div>
              </div>
            </div>
          </div>

          {/* Average Sentiment Score */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Average Sentiment Score</h3>
            <div className="flex items-center gap-4">
              <span className="text-3xl">{getSentimentEmoji(stats.average)}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Negative</span>
                  <span>Positive</span>
                </div>
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`absolute top-0 h-full ${
                      stats.average > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(Math.abs(stats.average) * 200, 100)}%`,
                      left: stats.average > 0 ? '50%' : `${50 - Math.min(Math.abs(stats.average) * 100, 50)}%`
                    }}
                  />
                  <div className="absolute top-0 left-1/2 h-full w-px bg-gray-400" />
                </div>
                <div className="mt-2 text-center">
                  <span className="text-sm font-medium">
                    Score: {stats.average.toFixed(3)} (range: -1 to 1)
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Sentiment Examples */}
          <div>
            <h3 className="text-sm font-medium mb-3">Sentiment Examples</h3>
            <div className="space-y-3">
              {sentiments.slice(0, 5).map((sentiment, index) => (
                <Card 
                  key={index}
                  className={`p-3 border ${
                    sentiment.label === 'Positive' ? 'border-green-100' :
                    sentiment.label === 'Negative' ? 'border-red-100' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-3 w-3 rounded-full ${
                        sentiment.label === 'Positive' ? 'bg-green-500' :
                        sentiment.label === 'Negative' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <span className={`text-sm font-medium ${
                        sentiment.label === 'Positive' ? 'text-green-800' :
                        sentiment.label === 'Negative' ? 'text-red-800' : 'text-gray-800'
                      }`}>
                        {sentiment.label}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Confidence: {formatConfidence(sentiment.confidence)}
                    </span>
                  </div>
                  <p className="text-sm mt-2 line-clamp-2">
                    "{sentiment.text.substring(0, 120)}{sentiment.text.length > 120 ? '...' : ''}"
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Score: {sentiment.score.toFixed(3)}
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          sentiment.label === 'Positive' ? 'bg-green-500' :
                          sentiment.label === 'Negative' ? 'bg-red-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${Math.min(Math.abs(sentiment.score) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 