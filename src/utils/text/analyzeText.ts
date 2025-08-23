interface TextStats {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  averageWordLength: number;
  mostFrequentWord: string;
  readingTime: number;
}

export function analyzeText(text: string): TextStats {
  // Remove extra whitespace and split into words
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;
  
  // Character count (excluding whitespace)
  const characterCount = text.replace(/\s/g, '').length;
  
  // Sentence count (basic implementation)
  const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
  
  // Calculate average word length
  const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
  const averageWordLength = wordCount > 0 ? Number((totalWordLength / wordCount).toFixed(2)) : 0;
  
  // Find most frequent word
  const wordFrequency: { [key: string]: number } = {};
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanWord) {
      wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
    }
  });
  
  const mostFrequentWord = Object.entries(wordFrequency)
    .reduce((max, [word, count]) => 
      count > (max.count || 0) ? { word, count } : max,
      { word: '', count: 0 }
    ).word;
  
  // Calculate reading time (assuming average reading speed of 200 words per minute)
  const readingTime = Number((wordCount / 200).toFixed(1));
  
  return {
    wordCount,
    characterCount,
    sentenceCount,
    averageWordLength,
    mostFrequentWord,
    readingTime
  };
} 