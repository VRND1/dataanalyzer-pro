import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { DataField } from "@/types/data";

/* ---------- Props ---------- */
interface TextAnalysisMatrixProps {
  field?: DataField;              // optional: single field
  fields?: DataField[];           // optional: multiple fields
}

/* ---------- Metrics ---------- */
interface AnalysisMetrics {
  basic: {
    wordCount: number;
    charCount: number;
    uniqueWords: number;
    sentences: number;
    paragraphs: number;
    readingTime: number;
    vocabulary: number; // unique / total * 100
  };
  complexity: {
    avgWordLength: number;
    avgWordsPerSentence: number;
    avgSentencesPerParagraph: number;
    readabilityScore: number;
    readabilityGrade: string;
    complexWordPercentage: number;
    mostFrequentWord: string;
    longestWord: string;
    syllableCount: number;
  };
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
    compound: number;
    emotions: Record<string, number>;
    overallTone: string;
  };
  distribution: {
    wordLength: Record<string, number>;
    topWords: Array<{ word: string; count: number; percentage: number }>;
    punctuationStats: Record<string, number>;
    partOfSpeech: Record<string, number>;
  };
  advanced: {
    lexicalDiversity: number;
    typeTokenRatio: number;
    averageSyllablesPerWord: number;
    difficultWords: string[];
    keyPhrases: Array<{ phrase: string; frequency: number }>;
    textDensity: number;
  };
}

/* ---------- Stop words ---------- */
const STOP_WORDS = new Set([
  "the","be","to","of","and","a","in","that","have","i","it","for","not","on","with","he","as","you","do","at","this","but","his",
  "by","from","they","we","say","her","she","or","an","will","my","one","all","would","there","their","what","so","up","out","if",
  "about","who","get","which","go","me","when","make","can","like","time","no","just","him","know","take","people","into","year",
  "your","good","some","could","them","see","other","than","then","now","look","only","come","its","over","think","also","back",
  "after","use","two","how","our","work","first","well","way","even","new","want","because","any","these","give","day","most","us"
]);

/* ---------- Sentiment lexicon ---------- */
const SENTIMENT_LEXICON = {
  positive: {
    joy: ["happy","joyful","delighted","cheerful","ecstatic","elated","jubilant"],
    love: ["love","adore","cherish","affection","romantic","devoted","passion"],
    excitement: ["excited","thrilled","enthusiastic","energetic","exhilarated"],
    satisfaction: ["satisfied","content","pleased","fulfilled","accomplished"],
    optimism: ["optimistic","hopeful","positive","confident","bright","promising"],
    appreciation: ["grateful","thankful","appreciate","blessed","fortunate"],
    admiration: ["amazing","wonderful","fantastic","excellent","outstanding","brilliant","magnificent"],
  },
  negative: {
    sadness: ["sad","depressed","melancholy","gloomy","sorrowful","miserable"],
    anger: ["angry","furious","irritated","annoying","rage","hostile","outraged"],
    fear: ["afraid","scared","terrified","anxious","worried","nervous","panic"],
    disgust: ["disgusting","revolting","repulsive","awful","horrible","terrible"],
    disappointment: ["disappointed","let down","frustrated","dissatisfied"],
    criticism: ["bad","poor","worst","disappointing","inadequate","inferior"],
  },
};

/* ====================================================================================== */
/* Component */
/* ====================================================================================== */
export function TextAnalysisMatrix({ field, fields }: TextAnalysisMatrixProps) {
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyzeText = async () => {
      try {
        /* ---------------- Get all text dynamically ---------------- */
        const chunks = gatherTexts(field, fields);
        if (!chunks.length) {
          setMetrics(null);
          setLoading(false);
          return;
        }

        // Join chunks with single newlines to preserve list items
        const joinedForParagraphs = chunks.join("\n");

        // "originalText" is what we analyze for punctuation/char count
        const originalText = joinedForParagraphs.trim();

        // For tokenization: normalize spaces, keep hyphen/apostrophe
        const cleanText = originalText.replace(/[ \t]+\n/g, "\n").replace(/\s+/g, " ").trim();

        /* ---------------- Paragraphs & sentences ---------------- */
        // Paragraphs: each chunk/row (avoids regex edge cases and blank lines)
        const paragraphsArr = chunks.map(s => String(s).trim()).filter(Boolean);

        // Sentences: punctuation only (perfect for prose, gives 1 sentence for lists)
        const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);

        /* ---------------- Words & characters ---------------- */
        // Keep hyphenated tokens like "free-range"; drop underscores/emoji etc.
        const words =
          cleanText
            .toLowerCase()
            .replace(/[^a-z0-9\s'-]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length > 0 && /[a-z]/.test(w)) ?? [];

        // Average word length = letters/digits/apostrophes (exclude hyphen from length math)
        const totalLetters = words
          .map((w) => w.replace(/[^a-z0-9']/gi, "")) // exclude hyphens for length math
          .reduce((s, w) => s + w.length, 0);
        const avgWordLength = words.length ? +(totalLetters / words.length).toFixed(2) : 0;

        const totalWords = words.length;

        // REPLACE charCount with letters-only (same basis as avgWordLength)
        const charCountLettersOnly = totalWords ? totalLetters : 0;

        /* ---------------- Frequencies & key phrases ---------------- */
        const wordFreq = new Map<string, number>();
        const bigrams = new Map<string, number>();

        words.forEach((word, i) => {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
          if (i < words.length - 1) {
            const next = words[i + 1];
            const bigram = `${word} ${next}`;
            if (!STOP_WORDS.has(word) && !STOP_WORDS.has(next)) {
              bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
            }
          }
        });
        const topWords = Array.from(wordFreq.entries())
          .filter(([w]) => !STOP_WORDS.has(w) && w.length > 2)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([word, count]) => ({
            word,
            count,
            percentage: +(100 * (count / totalWords)).toFixed(2),
          }));

        const keyPhrases = Array.from(bigrams.entries())
          .filter(([, f]) => f > 1)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([phrase, frequency]) => ({ phrase, frequency }));

        /* ---------------- Syllables, readability ---------------- */
        const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);
        const avgSyllablesPerWord = totalWords ? syllableCount / totalWords : 0;

        const complexWordsArr = words.filter((w) => countSyllables(w) >= 3);
        const complexWordPercentage = totalWords ? (complexWordsArr.length / totalWords) * 100 : 0;

        const avgWordsPerSentence = sentences.length ? totalWords / sentences.length : totalWords;
        const avgSentencesPerParagraph = paragraphsArr.length ? sentences.length / paragraphsArr.length : 0;

        // Flesch Reading Ease
        const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
        const readabilityGrade = getReadabilityGrade(fleschScore);

        /* ---------------- Sentiment ---------------- */
        const sentimentAnalysis = analyzeSentimentDetailed(words);

        /* ---------------- Distributions & other ---------------- */
        const wordLengthDist: Record<string, number> = {
          "Very Short (1-2)": 0,
          "Short (3-4)": 0,
          "Medium (5-6)": 0,
          "Long (7-9)": 0,
          "Very Long (10+)": 0,
        };
        words.forEach((w) => {
          const L = w.length;
          if (L <= 2) wordLengthDist["Very Short (1-2)"]++;
          else if (L <= 4) wordLengthDist["Short (3-4)"]++;
          else if (L <= 6) wordLengthDist["Medium (5-6)"]++;
          else if (L <= 9) wordLengthDist["Long (7-9)"]++;
          else wordLengthDist["Very Long (10+)"]++;
        });

        const punctuationStats = analyzePunctuation(originalText);

        const uniqueWords = new Set(words).size;
        const typeTokenRatio = totalWords ? uniqueWords / totalWords : 0;
        const lexicalDiversity = totalWords ? uniqueWords / Math.sqrt(totalWords) : 0;

        const longestWord = words.reduce((longest, cur) => (cur.length > longest.length ? cur : longest), "");
        const difficultWords = Array.from(new Set(complexWordsArr))
          .filter((w) => w.length > 6)
          .slice(0, 10);

        // Reading time: map Flesch (30→slow, 90→fast)
        const baseWpm = 200;
        const norm = Math.max(0, Math.min(1, (fleschScore - 30) / 60)); // 30..90 → 0..1
        const complexityFactor = 0.6 + norm * 0.8; // 0.6..1.4
        const adjustedWpm = baseWpm * complexityFactor;
        const readingTime = +(totalWords / adjustedWpm).toFixed(1);

        /* ---------------- Set metrics ---------------- */
        setMetrics({
          basic: {
            wordCount: totalWords,
            charCount: charCountLettersOnly,
            uniqueWords,
            sentences: sentences.length || 1,
            paragraphs: paragraphsArr.length || 1,
            readingTime,
            vocabulary: +(typeTokenRatio * 100).toFixed(2),
          },
          complexity: {
            avgWordLength,
            avgWordsPerSentence: +avgWordsPerSentence.toFixed(2),
            avgSentencesPerParagraph: +avgSentencesPerParagraph.toFixed(2),
            readabilityScore: +fleschScore.toFixed(2),
            readabilityGrade,
            complexWordPercentage: +complexWordPercentage.toFixed(2),
            mostFrequentWord: topWords[0]?.word || "",
            longestWord,
            syllableCount,
          },
          sentiment: sentimentAnalysis,
          distribution: {
            wordLength: wordLengthDist,
            topWords,
            punctuationStats,
            partOfSpeech: {}, // placeholder for NLP tagging
          },
          advanced: {
            lexicalDiversity: +lexicalDiversity.toFixed(3),
            typeTokenRatio: +typeTokenRatio.toFixed(3),
            averageSyllablesPerWord: +avgSyllablesPerWord.toFixed(2),
            difficultWords,
            keyPhrases,
            textDensity: +(+typeTokenRatio).toFixed(3), // same as unique/total
          },
        });
      } catch (e) {
        console.error("Error analyzing text:", e);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    analyzeText();
  }, [field, fields]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Analyzing text...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No text data available for analysis.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="complexity">Complexity</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard title="Word Count" value={metrics.basic.wordCount} />
            <MetricCard title="Character Count" value={metrics.basic.charCount} />
            <MetricCard title="Unique Words" value={metrics.basic.uniqueWords} />
            <MetricCard title="Sentences" value={metrics.basic.sentences} />
            <MetricCard title="Paragraphs" value={metrics.basic.paragraphs} />
            <MetricCard
              title="Reading Time"
              value={`${metrics.basic.readingTime} min`}
              subtitle="Adjusted for complexity"
            />
            <MetricCard
              title="Vocabulary Richness"
              value={`${metrics.basic.vocabulary}%`}
              subtitle="Unique words ratio"
            />
          </div>
        </TabsContent>

        <TabsContent value="complexity">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                title="Readability Score"
                value={metrics.complexity.readabilityScore}
                subtitle={metrics.complexity.readabilityGrade}
              />
              <MetricCard title="Average Word Length" value={`${metrics.complexity.avgWordLength} chars`} />
              <MetricCard title="Words per Sentence" value={metrics.complexity.avgWordsPerSentence} />
              <MetricCard title="Sentences per Paragraph" value={metrics.complexity.avgSentencesPerParagraph} />
              <MetricCard title="Complex Words" value={`${metrics.complexity.complexWordPercentage}%`} subtitle="3+ syllables" />
              <MetricCard title="Total Syllables" value={metrics.complexity.syllableCount} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Most Frequent Word</h4>
                <Badge variant="secondary" className="text-lg">
                  {metrics.complexity.mostFrequentWord}
                </Badge>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Longest Word</h4>
                <Badge variant="outline" className="text-lg">
                  {metrics.complexity.longestWord}
                </Badge>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sentiment">
          <div className="space-y-6">
            <Card className="p-4">
              <h4 className="font-semibold mb-4">Overall Sentiment</h4>
              <div className="text-center mb-4">
                <Badge
                  variant={
                    metrics.sentiment.overallTone === "Positive"
                      ? "default"
                      : metrics.sentiment.overallTone === "Negative"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-lg px-4 py-2"
                >
                  {metrics.sentiment.overallTone}
                </Badge>
              </div>

              <div className="space-y-3">
                <Meter label="Positive" value={metrics.sentiment.positive} />
                <Meter label="Negative" value={metrics.sentiment.negative} />
                <Meter label="Neutral" value={metrics.sentiment.neutral} />
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-4">Emotional Analysis</h4>
              <div className="grid gap-2">
                {Object.entries(metrics.sentiment.emotions)
                  .filter(([, v]) => v > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([emotion, intensity]) => (
                    <div key={emotion} className="flex items-center justify-between">
                      <span className="capitalize">{emotion}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={intensity} className="w-20 h-2" />
                        <span className="text-sm text-gray-500">{intensity.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="space-y-6">
            <Card className="p-4">
              <h4 className="font-semibold mb-4">Word Length Distribution</h4>
              <div className="space-y-3">
                {Object.entries(metrics.distribution.wordLength).map(([category, count]) => {
                  const percentage = (count / metrics.basic.wordCount) * 100;
                  return (
                    <div key={category}>
                      <div className="flex justify-between mb-1">
                        <span>{category}</span>
                        <span>
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-4">Top Words</h4>
              <div className="grid gap-2">
                {metrics.distribution.topWords.slice(0, 10).map(({ word, count, percentage }) => (
                  <div key={word} className="flex justify-between items-center">
                    <Badge variant="outline">{word}</Badge>
                    <div className="flex items-center gap-2">
                      {/* FIX: percentage is already 0–100 */}
                      <Progress value={percentage} className="w-20 h-2" />
                      <span className="text-sm text-gray-500">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-4">Punctuation Usage</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(metrics.distribution.punctuationStats).map(([punct, count]) => (
                  <div key={punct} className="flex justify-between">
                    <span className="font-mono">"{punct}"</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard title="Lexical Diversity" value={metrics.advanced.lexicalDiversity} subtitle="Higher = more varied vocabulary" />
              <MetricCard title="Type-Token Ratio" value={metrics.advanced.typeTokenRatio} subtitle="Vocabulary complexity" />
              <MetricCard title="Avg Syllables/Word" value={metrics.advanced.averageSyllablesPerWord} />
              <MetricCard title="Text Density" value={metrics.advanced.textDensity} subtitle="Information per word" />
            </div>

            <Card className="p-4">
              <h4 className="font-semibold mb-4">Key Phrases</h4>
              <div className="flex flex-wrap gap-2">
                {metrics.advanced.keyPhrases.map(({ phrase, frequency }) => (
                  <Badge key={phrase} variant="secondary">
                    {phrase} ({frequency})
                  </Badge>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-4">Complex Words</h4>
              <div className="flex flex-wrap gap-2">
                {metrics.advanced.difficultWords.map((w) => (
                  <Badge key={w} variant="outline">
                    {w}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- UI helpers ---------- */
function MetricCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <Card className="p-4">
      <h4 className="font-semibold text-sm text-gray-600 mb-1">{title}</h4>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </Card>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span>{value.toFixed(1)}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

/* ---------- Core helpers ---------- */
function gatherTexts(field?: DataField, fields?: DataField[]): string[] {
  const arr: DataField[] = [
    ...(fields ?? []),
    ...(field ? [field] : []),
  ];
  return arr.flatMap((f) => extractText(f?.value)).map((s) => s.trim()).filter(Boolean);
}

// Extract text from strings, numbers, arrays, and objects (skip ids/prices/dates)
function extractText(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string" || typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(extractText);

  if (typeof value === "object") {
    const skip = /(^id$|^_id$|uuid|email|phone|price|amount|qty|quantity|date|timestamp|time|ts)/i;
    return Object.entries(value as Record<string, unknown>)
      .filter(([k, v]) => !skip.test(k) && (typeof v === "string" || typeof v === "number"))
      .map(([, v]) => String(v));
  }
  return [];
}

/* ---------- NLP-ish helpers ---------- */
function countSyllables(word: string): number {
  if (!word) return 0;
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 1;
  if (w.length <= 3) return 1;
  w = w.replace(/e$/, "");
  const groups = w.match(/[aeiouy]+/g);
  let syl = groups ? groups.length : 1;
  if (/le$/.test(w)) syl++;
  if (/[^aeiou]y$/.test(w)) syl++;
  return Math.max(1, syl);
}

function getReadabilityGrade(score: number): string {
  if (score >= 90) return "Very Easy (5th grade)";
  if (score >= 80) return "Easy (6th grade)";
  if (score >= 70) return "Fairly Easy (7th grade)";
  if (score >= 60) return "Standard (8th-9th grade)";
  if (score >= 50) return "Fairly Difficult (10th-12th grade)";
  if (score >= 30) return "Difficult (College level)";
  return "Very Difficult (Graduate level)";
}

function analyzeSentimentDetailed(words: string[]) {
  const emotions = {
    joy: 0, love: 0, excitement: 0, satisfaction: 0, optimism: 0, appreciation: 0, admiration: 0,
    sadness: 0, anger: 0, fear: 0, disgust: 0, disappointment: 0, criticism: 0,
  };
  let pos = 0, neg = 0;

  words.forEach((w) => {
    Object.entries(SENTIMENT_LEXICON.positive).forEach(([em, list]) => {
      if (list.includes(w)) { (emotions as any)[em]++; pos++; }
    });
    Object.entries(SENTIMENT_LEXICON.negative).forEach(([em, list]) => {
      if (list.includes(w)) { (emotions as any)[em]++; neg++; }
    });
  });

  const total = pos + neg;
  const positive = total ? (pos / words.length) * 100 : 0;
  const negative = total ? (neg / words.length) * 100 : 0;
  const neutral = Math.max(0, 100 - positive - negative);
  const compound = total ? ((pos - neg) / total) * 100 : 0;

  let overallTone: "Positive" | "Negative" | "Neutral" = "Neutral";
  if (compound > 10) overallTone = "Positive";
  else if (compound < -10) overallTone = "Negative";

  const emotionPercentages: Record<string, number> = {};
  Object.entries(emotions).forEach(([em, c]) => {
    emotionPercentages[em] = total ? (c / total) * 100 : 0;
  });

  return { positive, negative, neutral, compound, emotions: emotionPercentages, overallTone };
}

function analyzePunctuation(text: string): Record<string, number> {
  const map: Record<string, number> = { ".": 0, "!": 0, "?": 0, ",": 0, ";": 0, ":": 0, "-": 0, '"': 0, "'": 0 };
  for (const ch of text) if (ch in map) map[ch]++;
  return map;
} 