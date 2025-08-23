import express from 'express';
import Joi from 'joi';
import natural from 'natural';

const router = express.Router();

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const sentenceTokenizer = new natural.SentenceTokenizer();
const TfIdf = natural.TfIdf;

// Enhanced validation schemas
const textRequestSchema = Joi.object({
  texts: Joi.array().items(Joi.string().min(1).max(50000)).min(1).max(100).required(),
  options: Joi.object({
    summary_length: Joi.number().min(50).max(500).default(150),
    include_readability: Joi.boolean().default(true),
    include_entities: Joi.boolean().default(true),
    language: Joi.string().valid('en', 'es', 'fr', 'de').default('en')
  }).default({})
});

// POST /analyze/summarize
router.post('/', async (req, res) => {
  try {
    // Validate request
    const { error, value } = textRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          details: error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message
          }))
        }
      });
    }

    const { texts, options } = value;

    // Perform enhanced text analysis
    const results = await analyzeTexts(texts, options);

    res.json({
      success: true,
      data: results,
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: req.id,
        processing_time: Date.now() - req.start_time,
        version: '2.0'
      }
    });

  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Text analysis failed',
        request_id: req.id,
        timestamp: new Date().toISOString()
      }
    });
  }
});

async function analyzeTexts(texts, options = {}) {
  try {
    const results = {
      summaries: [],
      sentiment_analysis: [],
      key_phrases: [],
      readability_scores: [],
      entities: [],
      statistics: {
        total_texts: texts.length,
        total_words: 0,
        total_sentences: 0,
        total_characters: 0,
        average_words_per_text: 0,
        average_sentences_per_text: 0,
        vocabulary_diversity: 0
      }
    };

    let totalWords = 0;
    let totalSentences = 0;
    let totalCharacters = 0;
    const allWords = new Set();

    // Create TF-IDF for better key phrase extraction
    const tfidf = new TfIdf();
    texts.forEach(text => tfidf.addDocument(text));

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      
      // Basic text processing
      const words = tokenizer.tokenize(text);
      const sentences = sentenceTokenizer.tokenize(text);
      const characters = text.length;

      // Update global statistics
      totalWords += words.length;
      totalSentences += sentences.length;
      totalCharacters += characters;
      words.forEach(word => allWords.add(word.toLowerCase()));

      // Generate enhanced summary
      const summary = generateEnhancedSummary(text, options.summary_length);
      results.summaries.push({
        text_index: i,
        original_length: characters,
        original_word_count: words.length,
        summary: summary.text,
        summary_length: summary.text.length,
        summary_word_count: tokenizer.tokenize(summary.text).length,
        compression_ratio: Math.round((summary.text.length / characters) * 100) / 100,
        extraction_method: summary.method,
        key_sentences_used: summary.sentences_count
      });

      // Enhanced sentiment analysis
      const sentiment = analyzeSentimentEnhanced(text);
      results.sentiment_analysis.push({
        text_index: i,
        overall_sentiment: sentiment.sentiment,
        confidence: sentiment.confidence,
        polarity_score: sentiment.score,
        subjectivity: sentiment.subjectivity,
        emotion_scores: sentiment.emotions,
        sentence_sentiments: sentiment.sentence_breakdown
      });

      // Extract enhanced key phrases using TF-IDF
      const keyPhrases = extractEnhancedKeyPhrases(text, tfidf, i);
      results.key_phrases.push({
        text_index: i,
        key_words: keyPhrases.words,
        key_phrases: keyPhrases.phrases,
        topics: keyPhrases.topics,
        named_entities: keyPhrases.entities
      });

      // Readability analysis
      if (options.include_readability) {
        const readability = calculateReadabilityScores(text);
        results.readability_scores.push({
          text_index: i,
          flesch_reading_ease: readability.flesch_ease,
          flesch_kincaid_grade: readability.flesch_kincaid,
          automated_readability_index: readability.ari,
          difficulty_level: readability.level,
          estimated_reading_time: readability.reading_time
        });
      }

      // Named entity extraction
      if (options.include_entities) {
        const entities = extractNamedEntities(text);
        results.entities.push({
          text_index: i,
          persons: entities.persons,
          organizations: entities.organizations,
          locations: entities.locations,
          dates: entities.dates,
          numbers: entities.numbers
        });
      }
    }

    // Calculate comprehensive statistics
    results.statistics = {
      total_texts: texts.length,
      total_words: totalWords,
      total_sentences: totalSentences,
      total_characters: totalCharacters,
      average_words_per_text: Math.round(totalWords / texts.length),
      average_sentences_per_text: Math.round(totalSentences / texts.length),
      average_characters_per_text: Math.round(totalCharacters / texts.length),
      vocabulary_diversity: Math.round((allWords.size / totalWords) * 100) / 100,
      lexical_density: calculateLexicalDensity(texts),
      most_common_words: getMostCommonWords(texts, 10)
    };

    return results;

  } catch (error) {
    console.error('Enhanced text analysis error:', error);
    throw new Error(`Text analysis failed: ${error.message}`);
  }
}

function generateEnhancedSummary(text, maxLength = 150) {
  try {
    const sentences = sentenceTokenizer.tokenize(text);
    
    if (sentences.length <= 1) {
      return {
        text: text.length > maxLength ? text.substring(0, maxLength) + '...' : text,
        method: 'truncation',
        sentences_count: 1
      };
    }

    // Enhanced sentence scoring with multiple factors
    const wordFreq = {};
    const words = tokenizer.tokenize(text.toLowerCase());
    
    // Calculate word frequencies
    words.forEach(word => {
      if (word.length > 2) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Score sentences based on multiple criteria
    const sentenceScores = sentences.map((sentence, index) => {
      const sentenceWords = tokenizer.tokenize(sentence.toLowerCase());
      
      // Factor 1: Word frequency score
      const freqScore = sentenceWords.reduce((sum, word) => sum + (wordFreq[word] || 0), 0);
      
      // Factor 2: Position score (earlier sentences get bonus)
      const positionScore = (sentences.length - index) / sentences.length;
      
      // Factor 3: Length score (moderate length preferred)
      const lengthScore = Math.max(0, 1 - Math.abs(sentenceWords.length - 15) / 15);
      
      // Factor 4: Capitalized words (potential proper nouns)
      const capsScore = sentenceWords.filter(word => /^[A-Z]/.test(word)).length;
      
      const totalScore = (freqScore * 0.4) + (positionScore * 0.3) + (lengthScore * 0.2) + (capsScore * 0.1);
      
      return { 
        sentence: sentence.trim(), 
        score: totalScore,
        index: index
      };
    });

    // Sort by score and select best sentences
    sentenceScores.sort((a, b) => b.score - a.score);
    
    let summary = '';
    let usedSentences = 0;
    const maxSentences = Math.min(3, Math.ceil(sentences.length * 0.3));
    
    for (const item of sentenceScores) {
      const potentialSummary = summary + (summary ? ' ' : '') + item.sentence;
      if (potentialSummary.length <= maxLength && usedSentences < maxSentences) {
        summary = potentialSummary;
        usedSentences++;
      }
    }

    return {
      text: summary || text.substring(0, maxLength) + '...',
      method: 'extractive',
      sentences_count: usedSentences
    };

  } catch (error) {
    console.error('Enhanced summary generation error:', error);
    return {
      text: text.substring(0, Math.min(maxLength, text.length)),
      method: 'fallback',
      sentences_count: 1
    };
  }
}

function analyzeSentimentEnhanced(text) {
  try {
    // Enhanced sentiment lexicons
    const sentimentLexicon = {
      positive: {
        'excellent': 3, 'amazing': 3, 'outstanding': 3, 'superb': 3, 'fantastic': 3,
        'wonderful': 2, 'great': 2, 'good': 2, 'nice': 2, 'pleasant': 2,
        'happy': 2, 'joy': 2, 'love': 2, 'like': 1, 'okay': 1, 'fine': 1
      },
      negative: {
        'terrible': -3, 'awful': -3, 'horrible': -3, 'disgusting': -3, 'hate': -3,
        'bad': -2, 'poor': -2, 'disappointing': -2, 'sad': -2, 'angry': -2,
        'dislike': -1, 'annoying': -1, 'boring': -1, 'meh': -1, 'okay': -1
      }
    };

    const sentences = sentenceTokenizer.tokenize(text);
    const sentenceScores = [];
    let totalScore = 0;
    let totalWords = 0;
    let subjectiveWords = 0;

    sentences.forEach(sentence => {
      const words = tokenizer.tokenize(sentence.toLowerCase());
      let sentenceScore = 0;
      let sentenceSubjective = 0;

      words.forEach(word => {
        if (sentimentLexicon.positive[word]) {
          sentenceScore += sentimentLexicon.positive[word];
          sentenceSubjective++;
        } else if (sentimentLexicon.negative[word]) {
          sentenceScore += sentimentLexicon.negative[word];
          sentenceSubjective++;
        }
      });

      totalScore += sentenceScore;
      totalWords += words.length;
      subjectiveWords += sentenceSubjective;

      sentenceScores.push({
        sentence: sentence.trim(),
        score: sentenceScore,
        sentiment: sentenceScore > 0 ? 'positive' : sentenceScore < 0 ? 'negative' : 'neutral'
      });
    });

    // Calculate overall metrics
    const normalizedScore = totalWords > 0 ? totalScore / totalWords : 0;
    const subjectivity = totalWords > 0 ? subjectiveWords / totalWords : 0;
    const confidence = Math.min(Math.abs(normalizedScore) * 2, 1);

    let overallSentiment = 'neutral';
    if (normalizedScore > 0.05) overallSentiment = 'positive';
    else if (normalizedScore < -0.05) overallSentiment = 'negative';

    // Emotion detection (basic)
    const emotions = detectEmotions(text);

    return {
      sentiment: overallSentiment,
      score: Math.round(normalizedScore * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      subjectivity: Math.round(subjectivity * 100) / 100,
      emotions: emotions,
      sentence_breakdown: sentenceScores
    };

  } catch (error) {
    console.error('Enhanced sentiment analysis error:', error);
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      subjectivity: 0,
      emotions: {},
      sentence_breakdown: []
    };
  }
}

function detectEmotions(text) {
  const emotionKeywords = {
    joy: ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'cheerful'],
    anger: ['angry', 'furious', 'mad', 'irritated', 'annoyed', 'rage'],
    fear: ['afraid', 'scared', 'terrified', 'worried', 'anxious', 'nervous'],
    sadness: ['sad', 'depressed', 'disappointed', 'upset', 'miserable', 'grief'],
    surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'unexpected'],
    disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'appalled']
  };

  const words = tokenizer.tokenize(text.toLowerCase());
  const emotions = {};

  Object.keys(emotionKeywords).forEach(emotion => {
    const count = words.filter(word => emotionKeywords[emotion].includes(word)).length;
    emotions[emotion] = Math.round((count / words.length) * 100) / 100;
  });

  return emotions;
}

function extractEnhancedKeyPhrases(text, tfidf, docIndex) {
  try {
    // Get TF-IDF scores for this document
    const tfidfItems = [];
    tfidf.listTerms(docIndex).forEach(item => {
      if (item.term.length > 2) {
        tfidfItems.push({
          word: item.term,
          score: Math.round(item.tfidf * 100) / 100
        });
      }
    });

    // Extract n-grams for phrases
    const words = tokenizer.tokenize(text.toLowerCase());
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
      'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);

    // Generate bigrams and trigrams
    const phrases = [];
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
        phrases.push(bigram);
      }
      
      if (i < words.length - 2) {
        const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1]) && !stopWords.has(words[i + 2])) {
          phrases.push(trigram);
        }
      }
    }

    // Count phrase frequencies
    const phraseFreq = {};
    phrases.forEach(phrase => {
      phraseFreq[phrase] = (phraseFreq[phrase] || 0) + 1;
    });

    const topPhrases = Object.entries(phraseFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([phrase, freq]) => ({ phrase, frequency: freq }));

    // Topic modeling (simple)
    const topics = identifyTopics(tfidfItems.slice(0, 10));

    // Named entities (basic)
    const entities = extractBasicEntities(text);

    return {
      words: tfidfItems.slice(0, 15),
      phrases: topPhrases,
      topics: topics,
      entities: entities
    };

  } catch (error) {
    console.error('Enhanced key phrase extraction error:', error);
    return {
      words: [],
      phrases: [],
      topics: [],
      entities: []
    };
  }
}

function identifyTopics(topWords) {
  // Simple topic clustering based on word similarity
  const topics = [];
  const used = new Set();

  topWords.forEach(wordObj => {
    if (!used.has(wordObj.word)) {
      const topic = {
        main_term: wordObj.word,
        related_terms: [],
        strength: wordObj.score
      };
      
      // Find related terms (very basic similarity)
      topWords.forEach(otherWord => {
        if (otherWord.word !== wordObj.word && !used.has(otherWord.word)) {
          // Simple similarity check (could be enhanced with word embeddings)
          if (wordObj.word.includes(otherWord.word) || otherWord.word.includes(wordObj.word)) {
            topic.related_terms.push(otherWord.word);
            used.add(otherWord.word);
          }
        }
      });
      
      topics.push(topic);
      used.add(wordObj.word);
    }
  });

  return topics.slice(0, 5);
}

function extractBasicEntities(text) {
  // Basic pattern matching for entities
  const entities = {
    persons: [],
    organizations: [],
    locations: [],
    dates: [],
    numbers: []
  };

  // Simple patterns (could be enhanced with NER libraries)
  const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g;
  const numberPattern = /\b\d+(?:,\d{3})*(?:\.\d+)?\b/g;
  const capitalizedPattern = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g;

  // Extract dates
  const dateMatches = text.match(datePattern);
  if (dateMatches) entities.dates = [...new Set(dateMatches)];

  // Extract numbers
  const numberMatches = text.match(numberPattern);
  if (numberMatches) entities.numbers = [...new Set(numberMatches)];

  // Extract capitalized words (potential proper nouns)
  const capitalizedMatches = text.match(capitalizedPattern);
  if (capitalizedMatches) {
    const filtered = capitalizedMatches.filter(match => match.length > 2);
    entities.persons = [...new Set(filtered)].slice(0, 10);
  }

  return entities;
}

function calculateReadabilityScores(text) {
  try {
    const sentences = sentenceTokenizer.tokenize(text);
    const words = tokenizer.tokenize(text);
    const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
    
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease
    const fleschEase = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Flesch-Kincaid Grade Level
    const fleschKincaid = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;
    
    // Automated Readability Index
    const charactersPerWord = text.replace(/\s/g, '').length / words.length;
    const ari = (4.71 * charactersPerWord) + (0.5 * avgSentenceLength) - 21.43;

    // Determine difficulty level
    let level = 'Graduate';
    if (fleschEase >= 90) level = 'Very Easy';
    else if (fleschEase >= 80) level = 'Easy';
    else if (fleschEase >= 70) level = 'Fairly Easy';
    else if (fleschEase >= 60) level = 'Standard';
    else if (fleschEase >= 50) level = 'Fairly Difficult';
    else if (fleschEase >= 30) level = 'Difficult';

    // Estimated reading time (average 200 words per minute)
    const readingTime = Math.ceil(words.length / 200);

    return {
      flesch_ease: Math.round(fleschEase),
      flesch_kincaid: Math.round(fleschKincaid * 10) / 10,
      ari: Math.round(ari * 10) / 10,
      level: level,
      reading_time: `${readingTime} min${readingTime > 1 ? 's' : ''}`
    };

  } catch (error) {
    console.error('Readability calculation error:', error);
    return {
      flesch_ease: 0,
      flesch_kincaid: 0,
      ari: 0,
      level: 'Unknown',
      reading_time: '0 mins'
    };
  }
}

function countSyllables(word) {
  // Simple syllable counting algorithm
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function calculateLexicalDensity(texts) {
  const allWords = [];
  texts.forEach(text => {
    const words = tokenizer.tokenize(text.toLowerCase());
    allWords.push(...words);
  });

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
  ]);

  const contentWords = allWords.filter(word => !stopWords.has(word));
  return Math.round((contentWords.length / allWords.length) * 100) / 100;
}

function getMostCommonWords(texts, limit = 10) {
  const wordFreq = {};
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
  ]);

  texts.forEach(text => {
    const words = tokenizer.tokenize(text.toLowerCase());
    words.forEach(word => {
      if (word.length > 2 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
  });

  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([word, freq]) => ({ word, frequency: freq }));
}

function extractNamedEntities(text) {
  // Enhanced named entity extraction
  const entities = {
    persons: [],
    organizations: [],
    locations: [],
    dates: [],
    numbers: []
  };

  // More sophisticated patterns
  const patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s?\d{3}-\d{4}\b/g,
    url: /https?:\/\/[^\s]+/g,
    date: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    money: /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
    percentage: /\d+(?:\.\d+)?%/g
  };

  // Extract various entity types
  Object.keys(patterns).forEach(type => {
    const matches = text.match(patterns[type]);
    if (matches) {
      entities[type] = [...new Set(matches)];
    }
  });

  return entities;
}

// GET /analyze/summarize/health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'enhanced_text_analysis',
    version: '2.0',
    features: [
      'text_summarization',
      'sentiment_analysis',
      'key_phrase_extraction',
      'readability_analysis',
      'named_entity_recognition',
      'topic_modeling',
      'emotion_detection'
    ],
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /analyze/summarize/stats
router.get('/stats', (req, res) => {
  res.json({
    supported_languages: ['en', 'es', 'fr', 'de'],
    max_text_length: 50000,
    max_texts_per_request: 100,
    available_options: {
      summary_length: { min: 50, max: 500, default: 150 },
      include_readability: { type: 'boolean', default: true },
      include_entities: { type: 'boolean', default: true },
      language: { options: ['en', 'es', 'fr', 'de'], default: 'en' }
    }
  });
});

export { router as textAnalysisRoutes }; 