import express from 'express';
import Joi from 'joi';
import natural from 'natural';

const router = express.Router();

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const sentenceTokenizer = new natural.SentenceTokenizer();

// Enhanced sentiment lexicons
const sentimentLexicon = {
  positive: {
    'excellent': 2.0, 'amazing': 2.0, 'wonderful': 1.8, 'fantastic': 1.8, 'great': 1.5,
    'good': 1.0, 'nice': 1.0, 'love': 2.0, 'like': 1.0, 'enjoy': 1.5,
    'happy': 1.5, 'satisfied': 1.0, 'pleased': 1.0, 'delighted': 1.8,
    'outstanding': 2.0, 'superb': 2.0, 'brilliant': 1.8, 'perfect': 2.0,
    'best': 1.5, 'awesome': 1.8, 'incredible': 1.8, 'fabulous': 1.8,
    'terrific': 1.5, 'marvelous': 1.8, 'splendid': 1.5, 'excellent': 2.0,
    'quality': 1.0, 'reliable': 1.0, 'trustworthy': 1.0, 'efficient': 1.0,
    'fast': 1.0, 'quick': 1.0, 'easy': 1.0, 'simple': 1.0, 'convenient': 1.0,
    'affordable': 1.0, 'cheap': 0.5, 'inexpensive': 1.0, 'value': 1.0,
    'recommend': 1.5, 'suggest': 1.0, 'approve': 1.0, 'support': 1.0
  },
  negative: {
    'terrible': -2.0, 'awful': -2.0, 'horrible': -2.0, 'bad': -1.0, 'poor': -1.5,
    'hate': -2.0, 'dislike': -1.0, 'disappointed': -1.5, 'frustrated': -1.5,
    'angry': -1.5, 'upset': -1.5, 'sad': -1.0, 'unhappy': -1.0,
    'worst': -2.0, 'terrible': -2.0, 'awful': -2.0, 'horrible': -2.0,
    'disgusting': -2.0, 'repulsive': -2.0, 'nasty': -1.5, 'vile': -2.0,
    'broken': -1.5, 'damaged': -1.5, 'defective': -1.5, 'faulty': -1.5,
    'slow': -1.0, 'difficult': -1.0, 'hard': -1.0, 'complicated': -1.0,
    'expensive': -0.5, 'overpriced': -1.0, 'costly': -0.5, 'waste': -1.5,
    'useless': -1.5, 'worthless': -1.5, 'pointless': -1.5, 'meaningless': -1.5,
    'avoid': -1.5, 'reject': -1.5, 'refuse': -1.0, 'deny': -1.0
  }
};

// Validation schema for sentiment analysis requests
const sentimentRequestSchema = Joi.object({
  texts: Joi.array().items(Joi.string().min(1).max(50000)).min(1).max(100).required(),
  custom_lexicons: Joi.object({
    positive: Joi.array().items(Joi.string()),
    negative: Joi.array().items(Joi.string())
  }).optional()
});

// GET /api/sentiment (test endpoint)
router.get('/', (req, res) => {
  res.json({
    message: 'Sentiment analysis endpoint is working',
    timestamp: new Date().toISOString(),
    availableMethods: ['POST'],
    expectedFormat: {
      texts: ['string1', 'string2', '...'],
      custom_lexicons: {
        positive: ['word1', 'word2'],
        negative: ['word1', 'word2']
      }
    }
  });
});

// POST /api/sentiment
router.post('/', async (req, res) => {
  try {
    // Add detailed logging
    console.log('Received sentiment analysis request:');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request body type:', typeof req.body);
    console.log('Texts array:', req.body?.texts);
    console.log('Texts array type:', typeof req.body?.texts);
    console.log('Texts array length:', req.body?.texts?.length);
    
    // Validate request
    const { error, value } = sentimentRequestSchema.validate(req.body);
    if (error) {
      console.log('Validation error details:', error.details);
      return res.status(422).json({
        error: {
          message: 'Validation error',
          details: error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message,
            value: d.context?.value
          })),
          receivedData: {
            textsType: typeof req.body?.texts,
            textsLength: req.body?.texts?.length,
            textsSample: req.body?.texts?.slice(0, 2),
            hasCustomLexicons: !!req.body?.custom_lexicons
          }
        }
      });
    }

    const { texts, custom_lexicons } = value;
    console.log('Validation passed. Processing texts:', texts.length);

    // Perform sentiment analysis
    const results = await analyzeSentiments(texts, custom_lexicons);

    res.json(results);

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Sentiment analysis failed',
        request_id: req.id,
        timestamp: new Date().toISOString()
      }
    });
  }
});

async function analyzeSentiments(texts, customLexicons = null) {
  try {
    // Merge custom lexicons with default ones
    const mergedLexicon = { ...sentimentLexicon };
    if (customLexicons) {
      if (customLexicons.positive) {
        customLexicons.positive.forEach(word => {
          mergedLexicon.positive[word.toLowerCase()] = 1.0;
        });
      }
      if (customLexicons.negative) {
        customLexicons.negative.forEach(word => {
          mergedLexicon.negative[word.toLowerCase()] = -1.0;
        });
      }
    }

    const sentiments = [];
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let totalScore = 0;
    let strongestPositive = null;
    let strongestNegative = null;

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const sentiment = analyzeSentimentEnhanced(text, mergedLexicon);
      
      // Count sentiment categories
      if (sentiment.sentiment === 'positive') positiveCount++;
      else if (sentiment.sentiment === 'negative') negativeCount++;
      else neutralCount++;

      totalScore += sentiment.score;

      // Track strongest sentiments
      if (sentiment.sentiment === 'positive' && (!strongestPositive || sentiment.score > strongestPositive.score)) {
        strongestPositive = {
          score: sentiment.score,
          label: 'Positive',
          confidence: sentiment.confidence,
          text: text.substring(0, 200) + (text.length > 200 ? '...' : '')
        };
      }
      if (sentiment.sentiment === 'negative' && (!strongestNegative || sentiment.score < strongestNegative.score)) {
        strongestNegative = {
          score: sentiment.score,
          label: 'Negative',
          confidence: sentiment.confidence,
          text: text.substring(0, 200) + (text.length > 200 ? '...' : '')
        };
      }

      sentiments.push({
        score: sentiment.score,
        label: sentiment.sentiment.charAt(0).toUpperCase() + sentiment.sentiment.slice(1),
        confidence: sentiment.confidence,
        text: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      });
    }

    const averageScore = totalScore / texts.length;

    return {
      sentiments,
      stats: {
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount,
        average: averageScore,
        strongest_positive: strongestPositive,
        strongest_negative: strongestNegative
      },
      lexicon_info: {
        positive_words: Object.keys(mergedLexicon.positive).length,
        negative_words: Object.keys(mergedLexicon.negative).length
      }
    };

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    throw new Error(`Sentiment analysis failed: ${error.message}`);
  }
}

function analyzeSentimentEnhanced(text, lexicon = sentimentLexicon) {
  try {
    const sentences = sentenceTokenizer.tokenize(text);
    const sentenceScores = [];

    // Analyze each sentence
    for (const sentence of sentences) {
      const words = tokenizer.tokenize(sentence.toLowerCase());
      let sentenceScore = 0;

      for (const word of words) {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (lexicon.positive[cleanWord]) {
          sentenceScore += lexicon.positive[cleanWord];
        } else if (lexicon.negative[cleanWord]) {
          sentenceScore += lexicon.negative[cleanWord];
        }
      }

      sentenceScores.push({
        sentence,
        score: sentenceScore,
        sentiment: sentenceScore > 0 ? 'positive' : sentenceScore < 0 ? 'negative' : 'neutral'
      });
    }

    // Calculate overall sentiment
    const totalScore = sentenceScores.reduce((sum, s) => sum + s.score, 0);
    const normalizedScore = totalScore / Math.max(sentences.length, 1);

    let overallSentiment = 'neutral';
    if (normalizedScore > 0.05) overallSentiment = 'positive';
    else if (normalizedScore < -0.05) overallSentiment = 'negative';

    // Calculate confidence based on score magnitude
    const confidence = Math.min(Math.abs(normalizedScore) * 2, 1.0);

    return {
      sentiment: overallSentiment,
      score: normalizedScore,
      confidence,
      sentence_breakdown: sentenceScores
    };

  } catch (error) {
    console.error('Enhanced sentiment analysis error:', error);
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      sentence_breakdown: []
    };
  }
}

export { router as sentimentAnalysisRoutes }; 