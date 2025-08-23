import { useEffect, useState } from 'react';
import _ from 'lodash';
import { DataField } from '@/types/data';
import { Card } from '@/components/ui/card';

interface TopicModelingProps {
  field: DataField;
}

interface Topic {
  id: number;
  keywords: Array<{ term: string; weight: number }>;
  score: number;
  documents: number;
  coherence: number;
  topDocuments: string[];
}

export function TopicModeling({ field }: TopicModelingProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalWords: 0,
    uniqueWords: 0,
    avgDocLength: 0
  });

  // Enhanced stop words list
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i',
    'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
    'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
    'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'what', 'which', 'who', 'whom', 'whose', 'this', 'that', 'these', 'those', 'am',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
    'do', 'does', 'did', 'doing', 'will', 'would', 'could', 'should', 'may', 'might',
    'must', 'can', 'said', 'say', 'says', 'get', 'go', 'goes', 'went', 'got', 'make',
    'made', 'take', 'taken', 'come', 'came', 'see', 'seen', 'know', 'knew', 'think',
    'thought', 'look', 'looked', 'first', 'last', 'long', 'great', 'little', 'own',
    'other', 'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next',
    'early', 'young', 'important', 'few', 'public', 'bad', 'same', 'able', 'also',
    'back', 'because', 'become', 'call', 'come', 'each', 'find', 'give', 'group',
    'hand', 'here', 'keep', 'last', 'leave', 'life', 'live', 'move', 'need', 'now',
    'number', 'over', 'own', 'part', 'place', 'point', 'put', 'right', 'seem', 'show',
    'small', 'start', 'state', 'still', 'such', 'system', 'take', 'tell', 'than',
    'there', 'turn', 'under', 'use', 'want', 'water', 'way', 'well', 'where', 'while',
    'work', 'world', 'write', 'year', 'years', 'many', 'much', 'more', 'most', 'very',
    'just', 'only', 'really', 'quite', 'rather', 'too', 'so', 'too', 'every', 'all',
    'some', 'any', 'no', 'not', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
    'eight', 'nine', 'ten', 'hundred', 'thousand', 'million', 'billion'
  ]);

  // Enhanced text preprocessing
  const preprocessText = (text: string): string[] => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(word => 
        word.length > 2 && 
        word.length < 20 && 
        !stopWords.has(word) &&
        !/^\d+$/.test(word) && // Remove pure numbers
        /^[a-zA-Z]+$/.test(word) // Only alphabetic words
      );
  };

  // Calculate cosine similarity between two vectors
  const cosineSimilarity = (vec1: number[], vec2: number[]): number => {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return mag1 && mag2 ? dotProduct / (mag1 * mag2) : 0;
  };

  // Calculate topic coherence using PMI (Pointwise Mutual Information)
  const calculateCoherence = (keywords: string[], processedTexts: string[][]): number => {
    let coherenceSum = 0;
    let pairCount = 0;

    for (let i = 0; i < keywords.length; i++) {
      for (let j = i + 1; j < keywords.length; j++) {
        const word1 = keywords[i];
        const word2 = keywords[j];
        
        // Count co-occurrences
        let cooccurrence = 0;
        let word1Count = 0;
        let word2Count = 0;
        
        processedTexts.forEach(text => {
          const hasWord1 = text.includes(word1);
          const hasWord2 = text.includes(word2);
          
          if (hasWord1) word1Count++;
          if (hasWord2) word2Count++;
          if (hasWord1 && hasWord2) cooccurrence++;
        });
        
        // Calculate PMI
        if (cooccurrence > 0 && word1Count > 0 && word2Count > 0) {
          const pmi = Math.log((cooccurrence * processedTexts.length) / (word1Count * word2Count));
          coherenceSum += pmi;
          pairCount++;
        }
      }
    }
    
    return pairCount > 0 ? coherenceSum / pairCount : 0;
  };

  // K-means clustering for topic modeling
  const performKMeansClustering = (tfidfMatrix: number[][], k: number): number[] => {
    const numDocs = tfidfMatrix.length;
    const numFeatures = tfidfMatrix[0].length;
    
    // Initialize centroids randomly
    const centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const centroid = new Array(numFeatures).fill(0).map(() => Math.random());
      centroids.push(centroid);
    }
    
    let assignments = new Array(numDocs).fill(0);
    let converged = false;
    let iterations = 0;
    const maxIterations = 100;
    
    while (!converged && iterations < maxIterations) {
      const newAssignments = new Array(numDocs);
      
      // Assign each document to nearest centroid
      for (let i = 0; i < numDocs; i++) {
        let bestCluster = 0;
        let bestSimilarity = -1;
        
        for (let j = 0; j < k; j++) {
          const similarity = cosineSimilarity(tfidfMatrix[i], centroids[j]);
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestCluster = j;
          }
        }
        
        newAssignments[i] = bestCluster;
      }
      
      // Update centroids
      for (let i = 0; i < k; i++) {
        const clusterDocs = newAssignments.map((assignment, idx) => 
          assignment === i ? tfidfMatrix[idx] : null
        ).filter(doc => doc !== null) as number[][];
        
        if (clusterDocs.length > 0) {
          for (let j = 0; j < numFeatures; j++) {
            centroids[i][j] = clusterDocs.reduce((sum, doc) => sum + doc[j], 0) / clusterDocs.length;
          }
        }
      }
      
      // Check convergence
      converged = assignments.every((assignment, idx) => assignment === newAssignments[idx]);
      assignments = newAssignments;
      iterations++;
    }
    
    return assignments;
  };

  useEffect(() => {
    const analyzeTopics = () => {
      try {
        const texts = field.value as string[];
        
        if (!texts || texts.length === 0) {
          setLoading(false);
          return;
        }

        // Enhanced preprocessing
        const processedTexts = texts.map(preprocessText);
        const validTexts = processedTexts.filter(text => text.length > 0);
        
        if (validTexts.length === 0) {
          setLoading(false);
          return;
        }

        // Calculate statistics
        const totalWords = validTexts.reduce((sum, text) => sum + text.length, 0);
        const allWords = validTexts.flat();
        const uniqueWords = new Set(allWords).size;
        
        setStats({
          totalDocuments: validTexts.length,
          totalWords,
          uniqueWords,
          avgDocLength: totalWords / validTexts.length
        });

        // Build vocabulary with minimum frequency threshold
        const minFreq = Math.max(2, Math.floor(validTexts.length * 0.05)); // At least 5% of documents
        const maxFreq = Math.floor(validTexts.length * 0.8); // At most 80% of documents
        
        const termFreq = new Map<string, number>();
        validTexts.forEach(words => {
          const uniqueWords = new Set(words);
          uniqueWords.forEach(word => {
            termFreq.set(word, (termFreq.get(word) || 0) + 1);
          });
        });

        // Filter vocabulary based on frequency
        const vocabulary = Array.from(termFreq.entries())
          .filter(([_, freq]) => freq >= minFreq && freq <= maxFreq)
          .sort((a, b) => b[1] - a[1]);

        if (vocabulary.length < 10) {
          setTopics([]);
          setLoading(false);
          return;
        }

        const vocabWords = vocabulary.map(([word]) => word);
        const vocabSize = Math.min(500, vocabWords.length); // Limit vocabulary size
        const finalVocab = vocabWords.slice(0, vocabSize);

        // Calculate TF-IDF matrix
        const tfidfMatrix: number[][] = [];
        const docCount = validTexts.length;
        
        // Calculate IDF for each term
        const idfScores = new Map<string, number>();
        finalVocab.forEach(term => {
          const docFreq = validTexts.filter(text => text.includes(term)).length;
          const idf = Math.log(docCount / docFreq);
          idfScores.set(term, idf);
        });

        // Build TF-IDF vectors for each document
        validTexts.forEach(text => {
          const termCounts = _.countBy(text);
          const maxCount = Math.max(...Object.values(termCounts));
          
          const tfidfVector = finalVocab.map(term => {
            const tf = (termCounts[term] || 0) / maxCount; // Normalized TF
            const idf = idfScores.get(term) || 0;
            return tf * idf;
          });
          
          tfidfMatrix.push(tfidfVector);
        });

        // Determine optimal number of topics
        const maxTopics = Math.min(8, Math.max(3, Math.floor(validTexts.length / 10)));
        const topicCount = Math.min(maxTopics, Math.floor(Math.sqrt(validTexts.length)));

        // Perform clustering
        const assignments = performKMeansClustering(tfidfMatrix, topicCount);

        // Generate topics from clusters
        const generatedTopics: Topic[] = [];
        
        for (let i = 0; i < topicCount; i++) {
          const clusterDocs = assignments.map((assignment, idx) => 
            assignment === i ? idx : null
          ).filter(idx => idx !== null) as number[];

          if (clusterDocs.length === 0) continue;

          // Calculate average TF-IDF for this cluster
          const clusterCentroid = new Array(vocabSize).fill(0);
          clusterDocs.forEach(docIdx => {
            tfidfMatrix[docIdx].forEach((score, termIdx) => {
              clusterCentroid[termIdx] += score;
            });
          });
          
          clusterCentroid.forEach((sum, idx) => {
            clusterCentroid[idx] = sum / clusterDocs.length;
          });

          // Get top keywords for this topic
          const topKeywords = finalVocab
            .map((term, idx) => ({ term, weight: clusterCentroid[idx] }))
            .filter(item => item.weight > 0)
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 8);

          if (topKeywords.length === 0) continue;

          // Calculate topic coherence
          const keywordTerms = topKeywords.slice(0, 5).map(k => k.term);
          const coherence = calculateCoherence(keywordTerms, validTexts);

          // Get representative documents
          const docScores = clusterDocs.map(docIdx => ({
            idx: docIdx,
            score: cosineSimilarity(tfidfMatrix[docIdx], clusterCentroid)
          }));
          
          const topDocs = docScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(doc => texts[doc.idx].substring(0, 100) + '...');

          const topicScore = topKeywords.reduce((sum, kw) => sum + kw.weight, 0) / topKeywords.length;

          generatedTopics.push({
            id: i + 1,
            keywords: topKeywords,
            score: topicScore,
            documents: clusterDocs.length,
            coherence,
            topDocuments: topDocs
          });
        }

        // Sort topics by coherence and score
        const sortedTopics = generatedTopics
          .sort((a, b) => (b.coherence + b.score) - (a.coherence + a.score))
          .map((topic, idx) => ({ ...topic, id: idx + 1 }));

        setTopics(sortedTopics);
        setLoading(false);
      } catch (error) {
        console.error('Error analyzing topics:', error);
        setLoading(false);
      }
    };

    analyzeTopics();
  }, [field]);

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div>Analyzing topics with advanced algorithms...</div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-gray-500">
          No meaningful topics found. Try providing more diverse text data.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Analysis Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalDocuments}</div>
            <div className="text-gray-500">Documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.uniqueWords.toLocaleString()}</div>
            <div className="text-gray-500">Unique Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{Math.round(stats.avgDocLength)}</div>
            <div className="text-gray-500">Avg Length</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{topics.length}</div>
            <div className="text-gray-500">Topics Found</div>
          </div>
        </div>
      </Card>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map(topic => (
          <Card key={topic.id} className="p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">Topic {topic.id}</h4>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Score: {topic.score.toFixed(3)}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    Coherence: {topic.coherence.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Keywords (by importance)</div>
                  <div className="flex flex-wrap gap-2">
                    {topic.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-sm font-medium"
                        style={{
                          opacity: Math.max(0.5, keyword.weight / topic.keywords[0].weight)
                        }}
                      >
                        {keyword.term}
                        <span className="ml-1 text-xs text-blue-600">
                          ({keyword.weight.toFixed(2)})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 flex items-center justify-between">
                  <span>
                    Found in {topic.documents} documents
                    ({((topic.documents / stats.totalDocuments) * 100).toFixed(1)}%)
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(topic.documents / stats.totalDocuments) * 100}%`
                    }}
                  />
                </div>

                {/* Representative Documents */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Representative Documents</div>
                  <div className="space-y-1">
                    {topic.topDocuments.map((doc, idx) => (
                      <div key={idx} className="text-xs text-gray-600 bg-gray-50 p-2 rounded italic">
                        "{doc}"
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Topic Distribution Overview */}
      <Card className="p-5">
        <h4 className="font-semibold mb-4">Topic Distribution & Quality</h4>
        <div className="space-y-3">
          {topics.map(topic => (
            <div key={topic.id} className="flex items-center space-x-4">
              <span className="w-20 text-sm font-medium">Topic {topic.id}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${(topic.documents / stats.totalDocuments) * 100}%`
                  }}
                />
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600 w-12">
                  {((topic.documents / stats.totalDocuments) * 100).toFixed(1)}%
                </span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                  Q: {topic.coherence.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 