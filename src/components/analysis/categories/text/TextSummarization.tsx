import { DataField } from '@/types/data';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Info, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// API configuration
const API_BASE_URL = 'http://localhost:8000';  // Using port 8003
const API_TIMEOUT = 30000; // 30 seconds timeout

// Debug log to verify API URL
console.log('Using API URL:', API_BASE_URL);

interface TextSummarizationProps {
  field: DataField;
  defaultMaxSentences?: number;
}

interface ScoredSentence {
  text: string;
  score: number;
  position: number;
}

interface SummaryStats {
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  keyPhrases: string[];
  readabilityScore: number;
  sentimentScore: number;
  timeSaved: string;
}

export function TextSummarization({ 
  field, 
  defaultMaxSentences = 3 
}: TextSummarizationProps) {
  const [summary, setSummary] = useState<ScoredSentence[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxSentences, setMaxSentences] = useState(defaultMaxSentences);
  const [highlightKeyPhrases, setHighlightKeyPhrases] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Enhanced sentence splitting that handles abbreviations
  const splitSentences = (text: string): string[] => {
    // Handle common abbreviations that shouldn't end sentences
    const abbrev = ['Mr.', 'Mrs.', 'Dr.', 'Prof.', 'e.g.', 'i.e.', 'etc.', 'vs.'];
    const placeholders = abbrev.map((_, i) => `ABBREV${i}`);
    
    // First replace abbreviations with placeholders
    let processedText = text;
    abbrev.forEach((abbr, i) => {
      processedText = processedText.replace(new RegExp(abbr, 'g'), placeholders[i]);
    });
    
    // Split sentences
    const sentences = processedText.match(/[^.!?]+[.!?]+/g) || [];
    
    // Restore abbreviations
    return sentences.map(sentence => {
      let restored = sentence;
      abbrev.forEach((abbr, i) => {
        restored = restored.replace(new RegExp(placeholders[i], 'g'), abbr);
      });
      return restored.trim();
    });
  };

  // Calculate text readability (Flesch-Kincaid grade level approximation)
  const calculateReadability = (text: string): number => {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = splitSentences(text).length;
    const syllables = words.reduce((count, word) => {
      // Simple syllable estimation
      word = word.toLowerCase();
      if (word.length <= 3) return count + 1;
      return count + word.replace(/([^aeiouy])\1+/g, '$1')
                         .replace(/^[^aeiouy]+/, '')
                         .replace(/e$/, '')
                         .split(/[aeiouy]+/).filter(Boolean).length;
    }, 0);
    
    return Math.max(0, Math.min(10, 
      0.39 * (words.length / sentences) + 
      11.8 * (syllables / words.length) - 
      15.59
    ));
  };

  // Calculate text sentiment (very basic implementation)
  const calculateSentiment = (text: string): number => {
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'happy', 'joy', 'love'];
    const negativeWords = ['bad', 'poor', 'negative', 'unhappy', 'sad', 'hate', 'angry'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, score / 10));
  };

  const generateSummary = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const texts = Array.isArray(field.value) ? field.value : [String(field.value)];
      const fullText = texts.join(' ');

      if (fullText.trim().length === 0) {
        throw new Error('Input text is empty');
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const apiUrl = `${API_BASE_URL}/analyze/summarize`;
        console.log('Making request to:', apiUrl);
        console.log('Request payload:', { texts: [fullText] });
        
        // Call backend for summarization
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: [fullText] }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (!data) {
          throw new Error('No response data received from server');
        }

        if (data.error) {
          throw new Error(data.error);
        }

        // Handle Node.js backend response format: { success: true, data: { summaries: [...] } }
        let summaryText = '';
        let stats: {
          originalLength: number;
          summaryLength: number;
          compressionRatio: number;
        } = {
          originalLength: 0,
          summaryLength: 0,
          compressionRatio: 0
        };
        
        if (data.success && data.data) {
          // Node.js backend format
          const summaryData = data.data.summaries?.[0];
          if (summaryData) {
            summaryText = summaryData.summary || '';
            stats = {
              originalLength: summaryData.original_length || 0,
              summaryLength: summaryData.summary_length || 0,
              compressionRatio: summaryData.compression_ratio || 0
            };
          }
        } else if (data.results) {
          // Python backend format (fallback)
          summaryText = data.results[0] || '';
          stats = {
            originalLength: data.stats?.original_length || 0,
            summaryLength: data.stats?.summary_length || 0,
            compressionRatio: data.stats?.compression_ratio || 0
          };
        }
        
        if (!summaryText) {
          throw new Error('No summary returned from backend');
        }

        setSummary([{ text: summaryText, score: 1, position: 0 }]);
        setStats({
          originalLength: stats.originalLength,
          summaryLength: stats.summaryLength,
          compressionRatio: stats.compressionRatio,
          keyPhrases: [], // You may want to implement key phrase extraction
          readabilityScore: calculateReadability(fullText),
          sentimentScore: calculateSentiment(fullText),
          timeSaved: `${Math.round(fullText.split(/\s+/).length / 200)} min`
        });
        setLoading(false);
      } catch (fetchError: unknown) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      let errorMessage = 'Failed to generate summary';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to the server. Please check if the server is running.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateSummary();
  }, [field, maxSentences]);

  const highlightText = (text: string) => {
    if (!stats || !highlightKeyPhrases) return text;
    
    return text.split(/(\s+)/).map((word, i) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (stats.keyPhrases.includes(cleanWord)) {
        return (
          <span key={i} className="bg-yellow-100 text-yellow-800 font-medium">
            {word}
          </span>
        );
      }
      return word;
    });
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={generateSummary}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </>
          )}
        </Button>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600">Analyzing text and generating summary...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Text Summary</h3>
          <p className="text-sm text-gray-500">
            Key sentences extracted from your content
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="sentenceCount" className="text-sm whitespace-nowrap">
              Summary length:
            </label>
            <Slider
              id="sentenceCount"
              min={1}
              max={Math.min(10, summary.length * 2 || 5)}
              step={1}
              value={[maxSentences]}
              onValueChange={([value]) => setMaxSentences(value)}
              className="w-[120px]"
              disabled={isGenerating}
            />
            <span className="text-sm font-medium w-6">{maxSentences}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={generateSummary}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Generated Summary</h4>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setHighlightKeyPhrases(!highlightKeyPhrases)}
                className={highlightKeyPhrases ? 'bg-blue-50' : ''}
              >
                {highlightKeyPhrases ? 'Hide' : 'Show'} Key Phrases
              </Button>
            </div>
          </div>
          
          <div className="space-y-3 text-gray-700">
            {summary.length > 0 ? (
              summary.map((sentence, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="leading-relaxed">
                    {highlightKeyPhrases ? highlightText(sentence.text) : sentence.text}
                  </p>
                  <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
                    <span>Sentence {sentence.position + 1}</span>
                    <span>Score: {sentence.score.toFixed(2)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No summary could be generated from the input text.</p>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h4 className="font-semibold mb-4">Text Analysis</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Readability</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Flesch-Kincaid grade level (0-10)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(stats?.readabilityScore || 0) * 10}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Simple</span>
                  <span>Complex</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Sentiment</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Text sentiment score (-1 to 1)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ 
                      width: `${((stats?.sentimentScore || 0) + 1) * 50}%`,
                      marginLeft: `${((stats?.sentimentScore || 0) + 1) * 50}%`,
                      transform: 'translateX(-100%)'
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Negative</span>
                  <span>Positive</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="text-sm font-medium mb-1">Original Length</div>
                  <div className="text-2xl font-semibold text-gray-700">
                    {stats?.originalLength}
                  </div>
                  <div className="text-xs text-gray-500">words</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Summary Length</div>
                  <div className="text-2xl font-semibold text-gray-700">
                    {stats?.summaryLength}
                  </div>
                  <div className="text-xs text-gray-500">words</div>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-sm font-medium mb-2">Key Phrases</div>
                <div className="flex flex-wrap gap-2">
                  {stats?.keyPhrases.map((phrase, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <div className="text-sm font-medium mb-1">Time Saved</div>
                <div className="text-lg font-semibold text-green-600">
                  {stats?.timeSaved}
                </div>
                <div className="text-xs text-gray-500">
                  Based on average reading speed
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 
