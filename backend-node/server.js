import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Import routes and middleware
import { analyticsRoutes } from './routes/analytics.js';
import { predictionRoutes } from './routes/predictions.js';
import { anomalyRoutes } from './routes/anomalies.js';
import { correlationRoutes } from './routes/correlation.js';
import { forecastRoutes } from './routes/forecast.js';
import { textAnalysisRoutes } from './routes/textAnalysis.js';
import { sentimentAnalysisRoutes } from './routes/sentimentAnalysis.js';
import { seasonalDecompositionRoutes } from './routes/seasonalDecomposition.js';
import regressionRoutes from './routes/regression.js';
import arimaRoutes from './routes/arima.js';

// Import analytics engine
import { AnalyticsEngine } from './services/analyticsEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Create HTTP server for WebSocket support
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

// WebSocket connection manager
class ConnectionManager {
  constructor() {
    this.activeConnections = new Set();
  }

  connect(ws) {
    this.activeConnections.add(ws);
    console.log(`Client connected. Total connections: ${this.activeConnections.size}`);
  }

  disconnect(ws) {
    this.activeConnections.delete(ws);
    console.log(`Client disconnected. Total connections: ${this.activeConnections.size}`);
  }

  broadcast(message) {
    this.activeConnections.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

const connectionManager = new ConnectionManager();

// WebSocket connection handling
wss.on('connection', (ws) => {
  connectionManager.connect(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data);
      
      // Echo back for now, can be extended for real-time analytics
      ws.send(JSON.stringify({
        type: 'response',
        data: data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    connectionManager.disconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    connectionManager.disconnect(ws);
  });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/analyze', analyticsRoutes);
app.use('/api/predict', predictionRoutes);
app.use('/api/detect-anomalies', anomalyRoutes);
app.use('/api/advanced/correlation', correlationRoutes);
app.use('/api/advanced/forecast', forecastRoutes);
app.use('/analyze/summarize', textAnalysisRoutes);
app.use('/api/sentiment', sentimentAnalysisRoutes);
app.use('/api/seasonal-decomposition', seasonalDecompositionRoutes);
app.use('/api/regression', regressionRoutes);
app.use('/api/arima', arimaRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      requestId: req.id
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      requestId: req.id
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Analytics API available at http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
});

export { connectionManager }; 